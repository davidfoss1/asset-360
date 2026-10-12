import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { NO_VALUE, formatDateTime } from '../../lib/format';
import type { ActivityItem } from '../../services/RelatedDataService';

import { ActivityDetail } from './ActivityDetail';

const LONG_NAME = 'Kontroll av EX utstyr - Instrument & Deck, Production Area, quarterly inspection of all zone 1 equipment';
const LONG_DESCRIPTION = 'First line of the work description.\nSecond line, with the part numbers and the findings from the inspection.';
const ACTIVITY: ActivityItem = {
  id: { space: 's', externalId: 'wo-1' },
  name: LONG_NAME,
  description: LONG_DESCRIPTION,
  scheduledStartTime: Date.UTC(2012, 8, 10, 2, 0),
  scheduledEndTime: Date.UTC(2012, 8, 10, 12, 0),
  startTime: Date.UTC(2012, 8, 13, 9, 0),
  endTime: Date.UTC(2012, 8, 12, 22, 26),
};

function renderDetail(activity: ActivityItem = ACTIVITY, onBack = vi.fn()) {
  render(<ActivityDetail activity={activity} onBack={onBack} />);
  return { onBack };
}

describe(ActivityDetail.name, () => {
  it('shows the whole name', () => {
    renderDetail();

    expect(screen.getByRole('heading', { name: LONG_NAME })).toBeInTheDocument();
  });

  it('shows the whole description, with its line breaks kept', () => {
    renderDetail();

    const description = screen.getByText(/First line of the work description/);
    expect(description.textContent).toBe(LONG_DESCRIPTION);
    expect(description).toHaveClass('whitespace-pre-wrap');
  });

  it('says there is no description when there is none', () => {
    renderDetail({ ...ACTIVITY, description: undefined });

    expect(screen.getByText('No description')).toBeInTheDocument();
  });

  it('shows all four times, each under its own label', () => {
    renderDetail();

    expect(timeOf('Scheduled start')).toBe(formatDateTime(ACTIVITY.scheduledStartTime));
    expect(timeOf('Scheduled end')).toBe(formatDateTime(ACTIVITY.scheduledEndTime));
    expect(timeOf('Started')).toBe(formatDateTime(ACTIVITY.startTime));
    expect(timeOf('Ended')).toBe(formatDateTime(ACTIVITY.endTime));
  });

  it('shows a dash for a time the activity does not have', () => {
    renderDetail({ ...ACTIVITY, startTime: undefined, endTime: undefined });

    expect(timeOf('Started')).toBe(NO_VALUE);
    expect(timeOf('Ended')).toBe(NO_VALUE);
  });

  it('goes back to the list with a clearly labelled button', async () => {
    const { onBack } = renderDetail();

    await userEvent.click(screen.getByRole('button', { name: 'Back to activities' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

/** The value shown under a label in the definition list. */
function timeOf(label: string): string | null {
  return screen.getByText(label).nextElementSibling?.textContent ?? null;
}
