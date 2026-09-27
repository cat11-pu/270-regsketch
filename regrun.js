// regrun.js：按元素预算更新并留账
import { bucketFor, tailZeroRun, codeSum } from "./sketch.js";

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function errorCodes(spec) {
  return {
    name: spec.name_error_code || "E_BAD_NAME",
    buckets: spec.buckets_error_code || "E_BAD_BUCKETS",
    event: spec.event_error_code || "E_BAD_EVENT"
  };
}

function cloneState(spec, errs) {
  if (!Number.isInteger(spec.buckets) || spec.buckets <= 0) {
    fail(errs.buckets, "buckets must be a positive integer");
  }
  const source = spec.state || {};
  const state = {
    reg: Array.isArray(source.reg) ? source.reg.slice() : [],
    seen: Number.isInteger(source.seen) ? source.seen : 0,
    ledger: Array.isArray(source.ledger) ? source.ledger.slice() : [],
    applied: Array.isArray(source.applied) ? source.applied.slice() : []
  };
  while (state.reg.length < spec.buckets) state.reg.push(0);
  return state;
}

function checkEvent(event, errs) {
  if (!event || typeof event !== "object" || event.kind !== "add" || typeof event.name !== "string") {
    fail(errs.event, "event must be an add event with a string name");
  }
  if (event.name.length === 0) fail(errs.name, "name must not be empty");
}

function applyName(state, buckets, name) {
  const spot = bucketFor(name, buckets);
  state.reg[spot] = Math.max(state.reg[spot], tailZeroRun(codeSum(name)));
  state.seen += 1;
}

export function step(spec) {
  const errs = errorCodes(spec || {});
  const state = cloneState(spec, errs);
  const events = spec.events === undefined ? [] : spec.events;
  if (!Array.isArray(events)) fail(errs.event, "events must be an array");
  const budget = Number.isFinite(spec.budget) ? Math.max(0, Math.trunc(spec.budget)) : events.length;
  let served = 0;
  let judged = 0;
  for (const event of events) {
    checkEvent(event, errs);
    judged += 1;
    const known = (event.id !== undefined && state.applied.indexOf(event.id) !== -1)
      || state.applied.indexOf(event.name) !== -1;
    if (known) continue;
    if (served < budget) {
      applyName(state, spec.buckets, event.name);
      state.applied.push(event.id !== undefined ? event.id : event.name);
      served += 1;
    } else {
      state.ledger.push(event.name);
    }
  }
  return { state: state, served: served, ledger_before: state.ledger.length,
           ledger: state.ledger.slice(), judged: judged, judged_bound: events.length };
}

export function close(spec) {
  const errs = errorCodes(spec || {});
  const state = cloneState(spec, errs);
  let catchup = 0;
  for (const name of state.ledger) {
    applyName(state, spec.buckets, name);
    state.applied.push(name);
    catchup += 1;
  }
  state.ledger = [];
  return { state: state, catchup: catchup };
}
