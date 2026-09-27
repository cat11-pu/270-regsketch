// sketch.js：落桶与尾零链
export function bucketFor(name, buckets) {
  let sum = 0;
  for (let spot = 0; spot < name.length; spot += 1) {
    sum += name.charCodeAt(spot);
  }
  return sum % buckets;
}

export function tailZeroRun(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }
  let rest = Math.floor(value);
  let run = 0;
  while (rest % 2 === 0) {
    run += 1;
    rest = rest / 2;
  }
  return run + 1;
}
