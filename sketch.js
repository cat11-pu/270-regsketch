// sketch.js：落桶与尾零链
export function codeSum(name) {
  const text = String(name);
  let sum = 0;
  for (let spot = 0; spot < text.length; spot += 1) sum += text.charCodeAt(spot);
  return sum;
}

export function bucketFor(name, buckets) {
  return codeSum(name) % buckets;
}

export function tailZeroRun(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return 1;
  let rest = Math.abs(Math.trunc(num));
  let run = 0;
  while (rest % 2 === 0) { run += 1; rest = rest / 2; }
  return run + 1;
}
