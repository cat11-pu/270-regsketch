import assert from "node:assert";
import { bucketFor, tailZeroRun } from "../sketch.js";
import { step, close } from "../regrun.js";
import { render } from "../app.js";

const base = {
  budget: 2, buckets: 8,
  state: { reg: [0, 0, 0, 0, 0, 0, 0, 0], seen: 0, ledger: [], applied: [] },
  events: [],
  name_error_code: "E_BAD_NAME", buckets_error_code: "E_BAD_BUCKETS",
  event_error_code: "E_BAD_EVENT"
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("bucketFor returns a number", () => {
  assert.strictEqual(typeof bucketFor("a", 8), "number");
});

check("tailZeroRun returns a number", () => {
  assert.strictEqual(typeof tailZeroRun(1), "number");
});

check("step returns a state", () => {
  assert.strictEqual(typeof step(base).state, "object");
});

check("close returns a state", () => {
  assert.strictEqual(typeof close(base).state, "object");
});

check("render counts events", () => {
  assert.strictEqual(typeof render(base).count, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
