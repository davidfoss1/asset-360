const MINUTE_MS = 60 * 1000;

/** Round steps, smallest first. All divide the hour or the day evenly, and none is a single minute. */
const STEP_MINUTES = [5, 10, 15, 30, 60, 120, 180, 240, 360, 720];

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

/**
 * Round clock-time marks for an axis covering `start` to `end` (epoch ms): the smallest of a few round
 * steps that gives no more than `maxTicks` marks, on the browser's local clock. Recharts would pick its
 * marks as plain numbers, which land on arbitrary minutes. Returns no marks when the range is empty,
 * inverted, or too long for the largest step; the axis then falls back to its own.
 */
export function niceTimeTicks(start: number, end: number, maxTicks = 7): number[] {
  const range = end - start;
  if (!(range > 0)) return [];

  for (const stepMinutes of STEP_MINUTES) {
    // Fewer marks than this are impossible for the step, so a finer one would only give more.
    if (Math.floor(range / (stepMinutes * MINUTE_MS)) > maxTicks) continue;
    const marks = marksEvery(stepMinutes, start, end);
    if (marks.length <= maxTicks) return marks;
  }
  return [];
}

/** The mark at local midnight reads as a date, so the day change is visible; the rest as a clock time. */
export function formatTimeTick(epochMs: number): string {
  const date = new Date(epochMs);
  return date.getHours() === 0 && date.getMinutes() === 0 ? dateFormat.format(date) : timeFormat.format(date);
}

/**
 * Every `stepMinutes` from local midnight, inside [start, end]. Each mark comes from the wall clock, not
 * from adding milliseconds, so a clock change inside the range does not shift later marks by an hour.
 */
function marksEvery(stepMinutes: number, start: number, end: number): number[] {
  const first = new Date(start);
  const year = first.getFullYear();
  const month = first.getMonth();
  const day = first.getDate();
  const midnight = new Date(year, month, day).getTime();

  const marks: number[] = [];
  for (let step = Math.floor((start - midnight) / (stepMinutes * MINUTE_MS)) - 1; ; step += 1) {
    const mark = new Date(year, month, day, 0, step * stepMinutes).getTime();
    if (mark > end) break;
    // A skipped hour (clock change) can map two steps to one instant; keep it once.
    if (mark >= start && (marks.length === 0 || mark > marks[marks.length - 1])) marks.push(mark);
  }
  return marks;
}
