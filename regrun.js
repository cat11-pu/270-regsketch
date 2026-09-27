// regrun.js：按元素预算更新并留账
import { bucketFor, tailZeroRun } from "./sketch.js";

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function codes(spec) {
  return {
    name: spec.name_error_code || "E_BAD_NAME",
    buckets: spec.buckets_error_code || "E_BAD_BUCKETS",
    event: spec.event_error_code || "E_BAD_EVENT"
  };
}

function checkBuckets(spec, code) {
  if (!Number.isInteger(spec.buckets) || spec.buckets <= 0) {
    fail(code, "buckets must be a positive integer");
  }
}

function checkEvents(events, code) {
  events.forEach(function (event) {
    if (!event || typeof event !== "object" || event.kind !== "add"
        || typeof event.name !== "string") {
      fail(code.event, "event must be an add carrying a string name");
    }
    if (event.name === "") {
      fail(code.name, "event name must not be empty");
    }
  });
}

function freshState(state, buckets) {
  const source = state || {};
  return {
    reg: Array.isArray(source.reg) && source.reg.length === buckets
      ? source.reg.slice() : new Array(buckets).fill(0),
    seen: Number.isInteger(source.seen) ? source.seen : 0,
    ledger: Array.isArray(source.ledger) ? source.ledger.slice() : [],
    applied: Array.isArray(source.applied) ? source.applied.slice() : []
  };
}

function charSum(name) {
  let sum = 0;
  for (let spot = 0; spot < name.length; spot += 1) {
    sum += name.charCodeAt(spot);
  }
  return sum;
}

function apply(state, name, buckets, marker) {
  const spot = bucketFor(name, buckets);
  const value = tailZeroRun(charSum(name));
  if (value > state.reg[spot]) {
    state.reg[spot] = value;
  }
  state.seen += 1;
  state.applied.push(marker);
}

export function step(spec) {
  const code = codes(spec);
  checkBuckets(spec, code.buckets);
  const events = Array.isArray(spec.events) ? spec.events : [];
  checkEvents(events, code);
  const state = freshState(spec.state, spec.buckets);
  let budget = Number.isInteger(spec.budget) ? spec.budget : 0;
  let served = 0;
  let judged = 0;
  events.forEach(function (event) {
    if (budget <= 0) {
      state.ledger.push(event.name);
      return;
    }
    judged += 1;
    if (state.applied.indexOf(event.id) !== -1
        || state.applied.indexOf(event.name) !== -1) {
      return;
    }
    apply(state, event.name, spec.buckets, event.id);
    served += 1;
    budget -= 1;
  });
  return { state: state, served: served, ledger_before: state.ledger.length,
           ledger: state.ledger.slice(), judged: judged, judged_bound: events.length };
}

export function close(spec) {
  const code = codes(spec);
  checkBuckets(spec, code.buckets);
  const state = freshState(spec.state, spec.buckets);
  const pending = state.ledger;
  state.ledger = [];
  let catchup = 0;
  pending.forEach(function (name) {
    apply(state, name, spec.buckets, name);
    catchup += 1;
  });
  return { state: state, catchup: catchup };
}
