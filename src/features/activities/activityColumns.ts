export type ActivityColumnId = 'name' | 'description' | 'scheduled' | 'start' | 'end';
export type ActivityColumnLayout = { id: ActivityColumnId; size: number };

/** Wide enough for "Sep 13, 2012, 10:26 PM" on one line. */
const DATE_WIDTH = 190;
/** Room for the table's scrollbar and borders, so the columns do not force a sideways scroll. */
const GUTTER = 16;
const MIN_TEXT_WIDTH = 160;
const MIN_NAME_WIDTH = 120;
/** The name's share of what the text columns have between them. */
const NAME_SHARE = 0.4;

// The widths used until the table has been measured: the layout for a typical desktop.
const UNMEASURED: ActivityColumnLayout[] = [
  { id: 'name', size: 200 },
  { id: 'description', size: 240 },
  { id: 'scheduled', size: DATE_WIDTH },
  { id: 'start', size: DATE_WIDTH },
  { id: 'end', size: DATE_WIDTH },
];

/**
 * Which columns to show, and how wide, for a table `width` px wide. The grid gives every column a fixed
 * width, so it cannot shrink on its own; instead the less important columns are dropped as room runs
 * out. Opening an activity still shows everything. Every layout leaves the dates room on one line.
 */
export function activityColumnLayout(width: number | undefined): ActivityColumnLayout[] {
  if (width === undefined) return UNMEASURED;
  const usable = width - GUTTER;

  // All five: the text columns need at least MIN_TEXT_WIDTH each, in a 40/60 split.
  const fullTextWidth = usable - 3 * DATE_WIDTH;
  if (fullTextWidth >= MIN_TEXT_WIDTH / NAME_SHARE) {
    const name = Math.round(fullTextWidth * NAME_SHARE);
    return [
      { id: 'name', size: name },
      { id: 'description', size: fullTextWidth - name },
      { id: 'scheduled', size: DATE_WIDTH },
      { id: 'start', size: DATE_WIDTH },
      { id: 'end', size: DATE_WIDTH },
    ];
  }

  // What the activity is, and when it started and ended.
  const mediumNameWidth = usable - 2 * DATE_WIDTH;
  if (mediumNameWidth >= 200) {
    return [
      { id: 'name', size: mediumNameWidth },
      { id: 'start', size: DATE_WIDTH },
      { id: 'end', size: DATE_WIDTH },
    ];
  }

  return [
    { id: 'name', size: Math.max(MIN_NAME_WIDTH, usable - DATE_WIDTH) },
    { id: 'start', size: DATE_WIDTH },
  ];
}
