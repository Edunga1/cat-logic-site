import * as path from "path"
import Data from "./similarity-result.json"

export default function getRelatedDocs(filepath: string): RelatedDoc[] {
  const docsByPath = mapData(Data)
  return findRelatedDocs(docsByPath, filepath)
}

interface RelatedDoc {
  path: string
  similarity: number
}

function mapData(docs: typeof Data): Map<string, RelatedDoc[]> {
  return docs.reduce(
    (acc, doc) => {
      const filenameX = doc.filename_x
      const filenameY = doc.filename_y
      if (!acc.has(filenameX)) {
        acc.set(filenameX, [])
      }
      acc.get(filenameX)?.push({
        path: filenameY,
        similarity: doc.similarity,
      })
      return acc
    },
    new Map<string, RelatedDoc[]>()
  )
}

function findRelatedDocs(map: Map<string, RelatedDoc[]>, filepath: string): RelatedDoc[] {
  const filename = path.basename(filepath)
  const found = Array.from(map.keys()).find(x => x.includes(filename))
  if (!found) {
    return []
  }
  return map.get(found) ?? []
}
