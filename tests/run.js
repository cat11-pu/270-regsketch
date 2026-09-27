import assert from "node:assert";
import fs from "node:fs";
import { bucketFor, tailZeroRun } from "../sketch.js";
import { step, close } from "../regrun.js";
import { render } from "../app.js";

const sample = JSON.parse(fs.readFileSync(new URL("../sample/stream.json", import.meta.url), "utf8"));

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

check("两档处理元素数不同", () => {
  const view = render(sample);
  assert.notStrictEqual(view.served_first, view.served_wide);
});

check("收尾前账大于零而收尾后归零", () => {
  const view = render(sample);
  assert.ok(view.ledger_before > 0);
  assert.strictEqual(view.ledger_after, 0);
});

check("拆两轮中间态不同而收尾态一致", () => {
  const view = render(sample);
  assert.ok(view.mid_differs);
  assert.ok(view.closed_equal);
});

check("重放不再处理", () => {
  assert.strictEqual(render(sample).replay_new, 0);
});

check("工作计数不超事件条数", () => {
  const view = render(sample);
  assert.ok(view.judged <= view.judged_bound);
});

check("与全量对照为零", () => {
  assert.strictEqual(render(sample).full_diff, 0);
});

check("异常探针真调", () => {
  const probe = function (patch) {
    return function () {
      step(Object.assign({}, sample, patch, {
        state: { reg: [0, 0, 0, 0, 0, 0, 0, 0], seen: 0, ledger: [], applied: [] }
      }));
    };
  };
  assert.throws(probe({ events: [{ id: 1, kind: "add", name: "" }] }),
    function (error) { return error && error.code === "E_BAD_NAME"; });
  assert.throws(probe({ buckets: 0, events: [{ id: 1, kind: "add", name: "a" }] }),
    function (error) { return error && error.code === "E_BAD_BUCKETS"; });
  assert.throws(probe({ events: [{ id: 1, kind: "peek", name: "a" }] }),
    function (error) { return error && error.code === "E_BAD_EVENT"; });
});

console.log("12 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
