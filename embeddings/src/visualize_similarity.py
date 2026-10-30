import glob
import html
import pathlib

import altair as alt
import pandas as pd
import streamlit as st
import streamlit.components.v1 as components

alt.data_transformers.disable_max_rows()

REQUIRED_COLUMNS = {"filename_x", "filename_y", "similarity"}
RANK_COLORS = {"상승": "#1170aa", "하락": "#fc7d0b", "유지": "#a3acb9"}

st.set_page_config(page_title="Similarity Visualizer", layout="wide")
st.title("Similarity Visualizer")


@st.cache_data
def load_similarity(path, mtime):
    return pd.read_json(path)


def select_similarity_file(label, key, default_name="similarity-result.json", fallback_index=0):
    files = sorted(glob.glob("*.json"))
    selected_file = None
    if files:
        saved_file = st.query_params.get(key)
        if saved_file in files:
            default_index = files.index(saved_file)
        elif default_name in files:
            default_index = files.index(default_name)
        else:
            default_index = min(fallback_index, len(files) - 1)
        selected_file = st.selectbox(label, files, index=default_index, key=f"select_{key}")
        st.query_params[key] = selected_file
    uploaded_file = st.file_uploader("다른 위치의 파일 선택", type="json", key=f"upload_{key}")

    if uploaded_file is not None:
        df = pd.read_json(uploaded_file)
    elif selected_file:
        df = load_similarity(selected_file, pathlib.Path(selected_file).stat().st_mtime)
    else:
        st.info("json 파일을 업로드하세요.")
        return None

    if not REQUIRED_COLUMNS.issubset(df.columns):
        st.error(f"유사도 파일 형식이 아닙니다. 필요한 컬럼: {REQUIRED_COLUMNS}")
        return None

    return df[df["filename_x"] != df["filename_y"]]


def render_single(df):
    # 방향 중복 제거 (a-b, b-a 중 하나만)
    df_pairs = df[df["filename_x"] < df["filename_y"]]

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("문서 수", df["filename_x"].nunique())
    col2.metric("문서 쌍", len(df_pairs))
    col3.metric("평균 유사도", f"{df_pairs['similarity'].mean():.4f}")
    col4.metric("최대 유사도", f"{df_pairs['similarity'].max():.4f}")

    st.divider()

    st.subheader("유사도 분포")
    histogram = (
        alt.Chart(df_pairs)
        .mark_bar()
        .encode(
            x=alt.X("similarity", bin=alt.Bin(maxbins=50), title="유사도"),
            y=alt.Y("count()", title="쌍 개수"),
            tooltip=["count()"],
        )
        .properties(height=250)
    )
    st.altair_chart(histogram, width="stretch")

    st.subheader("유사도 히트맵")
    heatmap = (
        alt.Chart(df)
        .mark_rect()
        .encode(
            x=alt.X("filename_x", sort="ascending", title=None, axis=alt.Axis(labels=False, ticks=False)),
            y=alt.Y("filename_y", sort="ascending", title=None, axis=alt.Axis(labels=False, ticks=False)),
            color=alt.Color("similarity", scale=alt.Scale(scheme="viridis"), title="유사도"),
            tooltip=["filename_x", "filename_y", alt.Tooltip("similarity", format=".4f")],
        )
        .properties(height=700)
    )
    st.altair_chart(heatmap, width="stretch")

    st.subheader("문서별 유사 문서")
    col1, col2 = st.columns([3, 1])
    with col1:
        doc = st.selectbox("문서 선택", sorted(df["filename_x"].unique()))
    with col2:
        top_n = st.number_input("상위 개수", min_value=5, max_value=50, value=10)

    df_doc = df[df["filename_x"] == doc].nlargest(top_n, "similarity")
    bars = (
        alt.Chart(df_doc)
        .mark_bar()
        .encode(
            x=alt.X("similarity", title="유사도"),
            y=alt.Y("filename_y", sort="-x", title=None),
            tooltip=["filename_y", alt.Tooltip("similarity", format=".4f")],
        )
        .properties(height=25 * top_n)
    )
    st.altair_chart(bars, width="stretch")

    st.subheader("상위 유사 쌍")
    df_top = df_pairs.nlargest(30, "similarity")[["filename_x", "filename_y", "similarity"]]
    st.dataframe(df_top, width="stretch", hide_index=True)


def rank_change_label(delta):
    if delta > 0:
        return f"▲{delta}"
    if delta < 0:
        return f"▼{-delta}"
    return "-"


def top_inout(joined, n=5):
    """문서별로 B 기준 상위 n개 목록(유지/진입 표시)과 A에서 밀려난 문서 계산"""
    rows = []
    for doc, group in joined.groupby("filename_x"):
        top_a = group[group["rank_a"] <= n]
        top_b = group[group["rank_b"] <= n].sort_values("rank_b")
        set_a, set_b = set(top_a["filename_y"]), set(top_b["filename_y"])
        rank_a_map = dict(zip(top_a["filename_y"], top_a["rank_a"]))
        entries = sorted(
            [
                (int(rank), "keep" if filename in set_a else "in", filename, int(rank_a_map.get(filename, 0)))
                for rank, filename in zip(top_b["rank_b"], top_b["filename_y"])
            ] + [
                (int(rank), "out", filename, int(rank))
                for rank, filename in zip(top_a["rank_a"], top_a["filename_y"])
                if filename not in set_b
            ],
            key=lambda entry: (entry[0], entry[1] == "out"),
        )
        rows.append({
            "문서": doc,
            "유지율": len(set_a & set_b) / max(len(set_a), 1),
            "변동": entries,
        })
    return pd.DataFrame(rows).sort_values("유지율", ascending=False).reset_index(drop=True)


def render_compare(df_a, df_b):
    joined = pd.merge(df_a, df_b, on=["filename_x", "filename_y"], suffixes=("_a", "_b"))
    if joined.empty:
        st.warning("두 파일에 공통 문서 쌍이 없습니다.")
        return

    joined["rank_a"] = joined.groupby("filename_x")["similarity_a"].rank(ascending=False, method="min").astype(int)
    joined["rank_b"] = joined.groupby("filename_x")["similarity_b"].rank(ascending=False, method="min").astype(int)

    df_inout = top_inout(joined)

    col1, col2, col3, col4, col5 = st.columns(5)
    col1.metric("공통 문서 수", joined["filename_x"].nunique())
    col2.metric("공통 쌍", len(joined[joined["filename_x"] < joined["filename_y"]]))
    col3.metric("평균 유사도 A", f"{joined['similarity_a'].mean():.4f}")
    col4.metric("평균 유사도 B", f"{joined['similarity_b'].mean():.4f}")
    col5.metric("상위 5 평균 유지율", f"{df_inout['유지율'].mean():.0%}")

    st.divider()

    st.subheader("문서별 순위 변화")
    col1, col2 = st.columns([3, 1])
    with col1:
        doc = st.selectbox("문서 선택", sorted(joined["filename_x"].unique()), key="compare_doc")
    with col2:
        top_n = st.number_input("상위 개수", min_value=5, max_value=30, value=10, key="compare_top_n")

    df_doc = joined[joined["filename_x"] == doc]
    df_doc = df_doc[(df_doc["rank_a"] <= top_n) | (df_doc["rank_b"] <= top_n)].copy()
    df_doc["delta"] = df_doc["rank_a"] - df_doc["rank_b"]
    df_doc["변동"] = df_doc["delta"].apply(lambda d: "상승" if d > 0 else ("하락" if d < 0 else "유지"))

    df_long = pd.concat([
        df_doc.assign(model="A", rank=df_doc["rank_a"]),
        df_doc.assign(model="B", rank=df_doc["rank_b"]),
    ])
    slope_base = alt.Chart(df_long).encode(
        x=alt.X("model", sort=["A", "B"], title=None, axis=alt.Axis(labelAngle=0), scale=alt.Scale(padding=0.5)),
        y=alt.Y("rank", scale=alt.Scale(reverse=True), axis=alt.Axis(tickMinStep=1), title="순위"),
        detail="filename_y",
    )
    slope_lines = slope_base.mark_line(strokeWidth=2).encode(
        color=alt.Color(
            "변동",
            scale=alt.Scale(domain=list(RANK_COLORS), range=list(RANK_COLORS.values())),
            title="변동",
        ),
        tooltip=["filename_y", "rank_a", "rank_b", "변동"],
    )
    slope_labels = (
        alt.Chart(df_long[df_long["model"] == "B"])
        .mark_text(align="left", dx=10)
        .encode(
            x=alt.X("model", sort=["A", "B"], scale=alt.Scale(padding=0.5)),
            y=alt.Y("rank", scale=alt.Scale(reverse=True)),
            text="filename_y",
        )
    )
    st.altair_chart((slope_lines + slope_labels).properties(height=30 * top_n), width="stretch")

    df_doc_display = df_doc.sort_values("rank_b")[
        ["filename_y", "rank_a", "rank_b", "delta", "similarity_a", "similarity_b"]
    ].copy()
    df_doc_display["delta"] = df_doc_display["delta"].apply(rank_change_label)
    df_doc_display.columns = ["유사 문서", "A 순위", "B 순위", "변동", "A 유사도", "B 유사도"]
    st.dataframe(df_doc_display, width="stretch", hide_index=True)

    st.subheader("문서별 in/out")
    st.caption(
        "B(이후) 기준 상위 5 유사 문서 목록. 검정 = 유지(순위 변화는 A→B), 파랑 ← = 새로 진입, "
        "빨강 → = A(이전) 상위 5에서 밀려남(순위는 A 기준). 컬럼 제목을 클릭하면 정렬"
    )
    def format_move(rank, kind, filename, prev_rank):
        name = html.escape(filename)
        if kind == "keep":
            rank_label = f"{prev_rank}→{rank}위" if prev_rank != rank else f"{rank}위"
            return f'<div class="move keep"><span class="rank">{rank_label}</span>{name}</div>'
        if kind == "in":
            return f'<div class="move in"><span class="rank">{rank}위</span>← {name}</div>'
        return f'<div class="move out"><span class="rank">{rank}위</span>{name} →</div>'

    body_rows = []
    for _, row in df_inout.iterrows():
        moves = "".join(format_move(*entry) for entry in row["변동"])
        meter = (
            '<div class="keepcell"><div class="meter">'
            f'<span style="width:{row["유지율"]:.0%}"></span></div>{row["유지율"]:.0%}</div>'
        )
        body_rows.append(
            f'<tr><td class="doc">{html.escape(row["문서"])}</td><td>{meter}</td><td>{moves}</td></tr>'
        )
    table = (
        "<style>"
        "body {font-family: -apple-system, 'Segoe UI', sans-serif; margin: 0; color: #24292f}"
        "table {width: 100%; border-collapse: collapse; font-size: 14px}"
        "th {cursor: pointer; user-select: none; position: sticky; top: 0; background: #fff; "
        "font-size: 12px; color: #57606a; text-align: left; padding: 8px 10px; "
        "border-bottom: 2px solid #d0d7de}"
        "th .arrow {color: #8c959f; margin-left: 4px}"
        "td {padding: 8px 10px; text-align: left; vertical-align: top; border-bottom: 1px solid #eaeef2}"
        "tr:hover td {background: #f6f8fa}"
        "td.doc {font-weight: 600; white-space: nowrap}"
        ".keepcell {display: flex; align-items: center; gap: 8px; white-space: nowrap; "
        "font-variant-numeric: tabular-nums}"
        ".meter {width: 56px; height: 6px; background: #eaeef2; border-radius: 3px; overflow: hidden}"
        ".meter span {display: block; height: 100%; background: #8c959f}"
        ".move {padding: 2px 8px; border-radius: 4px; margin: 1px 0; line-height: 1.5}"
        ".move .rank {display: inline-block; min-width: 58px; margin-right: 6px; "
        "color: #6e7781; font-size: 12px; font-variant-numeric: tabular-nums}"
        ".move.in {background: rgba(17, 112, 170, 0.07); color: #0b5c8d}"
        ".move.out {background: rgba(214, 39, 40, 0.06); color: #b62324}"
        "</style>"
        "<table><thead><tr>"
        '<th onclick="sortBy(0)">문서<span class="arrow">⇅</span></th>'
        '<th onclick="sortBy(1)">유지율<span class="arrow">⇅</span></th>'
        "<th>변동</th>"
        "</tr></thead>"
        f'<tbody>{"".join(body_rows)}</tbody></table>'
        "<script>"
        "const dir = {};"
        "function sortBy(col) {"
        "  dir[col] = !dir[col];"
        "  document.querySelectorAll('th .arrow').forEach((arrow, i) => {"
        "    arrow.textContent = i === col ? (dir[col] ? '▲' : '▼') : '⇅';"
        "  });"
        "  const tbody = document.querySelector('tbody');"
        "  const rows = Array.from(tbody.rows);"
        "  rows.sort((r1, r2) => {"
        "    const a = r1.cells[col].innerText, b = r2.cells[col].innerText;"
        "    const cmp = col === 1 ? parseFloat(a) - parseFloat(b) : a.localeCompare(b);"
        "    return dir[col] ? cmp : -cmp;"
        "  });"
        "  rows.forEach(r => tbody.appendChild(r));"
        "}"
        "</script>"
    )
    components.html(table, height=620, scrolling=True)

    st.subheader("쌍별 유사도 산점도")
    st.caption(
        "각 축은 그 파일 안에서의 백분위 순위. 절대값 기준선 차이를 소거했으므로 "
        "대각선 근처 = 두 파일이 같은 판단, 왼쪽 위·오른쪽 아래 구석 = 의견이 갈린 쌍"
    )
    df_pairs = joined[joined["filename_x"] < joined["filename_y"]].copy()
    df_pairs["percentile_a"] = df_pairs["similarity_a"].rank(pct=True)
    df_pairs["percentile_b"] = df_pairs["similarity_b"].rank(pct=True)
    scatter = (
        alt.Chart(df_pairs)
        .mark_circle(size=30, opacity=0.4)
        .encode(
            x=alt.X("percentile_a", title="A 백분위", axis=alt.Axis(format=".0%")),
            y=alt.Y("percentile_b", title="B 백분위", axis=alt.Axis(format=".0%")),
            tooltip=[
                "filename_x",
                "filename_y",
                alt.Tooltip("percentile_a", format=".1%"),
                alt.Tooltip("percentile_b", format=".1%"),
                alt.Tooltip("similarity_a", format=".4f"),
                alt.Tooltip("similarity_b", format=".4f"),
            ],
        )
        .properties(width=550, height=550)
    )
    diagonal = (
        alt.Chart(pd.DataFrame({"percentile_a": [0, 1], "percentile_b": [0, 1]}))
        .mark_line(color="#a3acb9", strokeDash=[4, 4])
        .encode(x="percentile_a", y="percentile_b")
    )
    st.altair_chart(scatter + diagonal, width="content")

    st.subheader("의견이 갈린 쌍")
    df_disagree = df_pairs.copy()
    df_disagree["diff"] = df_disagree["percentile_a"] - df_disagree["percentile_b"]

    def to_quadrant_table(df_quadrant):
        out = df_quadrant[["filename_x", "filename_y", "percentile_a", "percentile_b"]].copy()
        out["percentile_a"] = out["percentile_a"].apply(lambda x: f"{x:.0%}")
        out["percentile_b"] = out["percentile_b"].apply(lambda x: f"{x:.0%}")
        out.columns = ["문서", "문서 상대", "A 백분위", "B 백분위"]
        return out

    col1, col2 = st.columns(2)
    with col1:
        st.markdown("**A만 높게 본 쌍** — 교체 시 사라지는 추천")
        st.dataframe(to_quadrant_table(df_disagree.nlargest(10, "diff")), width="stretch", hide_index=True)
    with col2:
        st.markdown("**B만 높게 본 쌍** — 교체 시 새로 생기는 추천")
        st.dataframe(to_quadrant_table(df_disagree.nsmallest(10, "diff")), width="stretch", hide_index=True)


tab_single, tab_compare = st.tabs(["단일 보기", "비교"])

with tab_single:
    df = select_similarity_file("유사도 파일", "single")
    if df is not None:
        render_single(df)

with tab_compare:
    col_a, col_b = st.columns(2)
    with col_a:
        df_a = select_similarity_file("파일 A (이전)", "a", default_name=None)
    with col_b:
        df_b = select_similarity_file("파일 B (이후)", "b", default_name=None, fallback_index=1)
    if df_a is not None and df_b is not None:
        render_compare(df_a, df_b)
