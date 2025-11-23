import type { describe } from "node:test"

declare global {
  var describeWithCleanup: typeof describe
}

export {}
