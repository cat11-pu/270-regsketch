// regrun.js：按元素预算更新并留账（基线：一律给空表）
import { bucketFor, tailZeroRun } from "./sketch.js";

export function step(spec) {
  return { state: spec.state, served: 0, ledger_before: 0, ledger: [], judged: 0, judged_bound: 0 };
}

export function close(spec) {
  return { state: spec.state, catchup: 0 };
}
