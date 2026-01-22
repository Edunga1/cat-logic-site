import os

import pandas as pd
import streamlit as st

from get_embeddings import (
    load_embeddings,
    merge_docs,
    persist_embeddings,
    read_docs,
    update_token,
    get_embeddings,
)

st.set_page_config(page_title="Embeddings Manager", layout="wide")
st.title("Embeddings Manager")

# 경로 설정
col1, col2, col3 = st.columns([2, 2, 1])
with col1:
    docs_path = st.text_input("문서 경로", value="../docs/wiki")
with col2:
    db_path = st.text_input("DB 경로", value="output_embeddings.db")
with col3:
    st.markdown("<br>", unsafe_allow_html=True)
    if st.button("새로고침"):
        st.cache_data.clear()


@st.cache_data
def load_data(docs_path, db_path):
    df_docs = read_docs(docs_path)
    df_db = load_embeddings(db_path)
    return df_docs, df_db


def compare_docs(df_docs, df_db):
    """문서와 DB를 비교하여 상태를 반환"""
    # 모든 파일명 수집
    all_files = set(df_docs["filename"].tolist()) | set(df_db["filename"].tolist())

    rows = []
    for filename in all_files:
        doc_row = df_docs[df_docs["filename"] == filename]
        db_row = df_db[df_db["filename"] == filename]

        doc_exists = len(doc_row) > 0
        db_exists = len(db_row) > 0

        if doc_exists and not db_exists:
            status = "new"
            checksum_doc = doc_row["checksum"].values[0]
            checksum_db = None
        elif not doc_exists and db_exists:
            status = "deleted"
            checksum_doc = None
            checksum_db = db_row["checksum"].values[0]
        else:
            checksum_doc = doc_row["checksum"].values[0]
            checksum_db = db_row["checksum"].values[0]
            has_embedding = db_row["embedding"].values[0] is not None
            if checksum_doc != checksum_db or not has_embedding:
                status = "changed"
            else:
                status = "same"

        rows.append(
            {
                "filename": filename,
                "status": status,
                "checksum_doc": checksum_doc,
                "checksum_db": checksum_db,
            }
        )

    return pd.DataFrame(rows)


# 데이터 로드 및 비교
try:
    df_docs, df_db = load_data(docs_path, db_path)
    df_compare = compare_docs(df_docs, df_db)

    # 요약 표시
    status_counts = df_compare["status"].value_counts()
    new_count = status_counts.get("new", 0)
    changed_count = status_counts.get("changed", 0)
    deleted_count = status_counts.get("deleted", 0)
    same_count = status_counts.get("same", 0)

    st.markdown(
        f"**요약:** 새 문서 {new_count}개 | 변경 {changed_count}개 | 삭제 {deleted_count}개 | 동일 {same_count}개"
    )

    # 정렬: new -> changed -> deleted -> same
    status_order = {"new": 0, "changed": 1, "deleted": 2, "same": 3}
    df_compare["_order"] = df_compare["status"].map(status_order)
    df_compare = df_compare.sort_values(["_order", "filename"])

    # 상태 텍스트 매핑
    status_display = {
        "new": "New file",
        "changed": "Modified",
        "deleted": "Deleted",
        "same": "Synced",
    }
    df_compare["상태"] = df_compare["status"].map(status_display)

    # 표시할 컬럼 선택
    df_display = df_compare[["상태", "filename", "checksum_doc", "checksum_db"]].copy()
    df_display.columns = ["상태", "파일명", "문서 체크섬", "DB 체크섬"]

    # 행 색상 적용
    status_colors = {
        "New file": "background-color: #d4edda",
        "Modified": "background-color: #fff3cd",
        "Deleted": "background-color: #f8d7da",
        "Synced": "",
    }

    def color_rows(row):
        color = status_colors.get(row["상태"], "")
        return [color] * len(row)

    styled_df = df_display.style.apply(color_rows, axis=1)

    # 행 선택 가능한 dataframe
    selection = st.dataframe(
        styled_df,
        width="stretch",
        hide_index=True,
        on_select="rerun",
        selection_mode="multi-row",
    )

    # 선택된 행 가져오기
    selected_rows = selection.selection.rows
    selected_files = df_display.iloc[selected_rows]["파일명"].tolist() if selected_rows else []
    selected_count = len(selected_files)

    if selected_count > 0:
        st.divider()

        has_api_key = os.environ.get("AZURE_OPENAI_API_KEY") is not None
        if not has_api_key:
            st.warning("AZURE_OPENAI_API_KEY 환경변수가 설정되지 않았습니다.")

        if st.button(
            f"선택한 문서 갱신 ({selected_count}개)",
            disabled=not has_api_key,
            type="primary",
        ):
            # 문서 데이터 가져오기
            df_to_embed = df_docs[df_docs["filename"].isin(selected_files)].copy()
            df_to_embed = update_token(df_to_embed)

            # 진행 상황 표시
            progress_bar = st.progress(0)
            status_text = st.empty()

            embedded_rows = []
            for i, (_, row) in enumerate(df_to_embed.iterrows()):
                status_text.text(f"처리 중: {row['filename']} ({i + 1}/{len(df_to_embed)})")

                single_df = pd.DataFrame([row])
                result = get_embeddings(single_df)
                embedded_rows.append(result.iloc[0])

                progress_bar.progress((i + 1) / len(df_to_embed))

            df_embedded = pd.DataFrame(embedded_rows)

            # DB 병합 및 저장
            status_text.text("저장 중...")
            df_merged = merge_docs(df_db, df_embedded)
            persist_embeddings(df_merged, "output_embeddings")

            # 완료
            progress_bar.empty()
            status_text.empty()
            st.success(f"{len(df_embedded)}개 문서 갱신 완료!")
            st.cache_data.clear()
            st.rerun()

except FileNotFoundError as e:
    st.error(f"파일을 찾을 수 없습니다: {e}")
except Exception as e:
    st.error(f"오류 발생: {e}")
