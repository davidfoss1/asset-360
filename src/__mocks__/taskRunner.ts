import type { TaskRunner } from '../lib/taskRunner';

/** A runner with no cap, so service tests do not depend on scheduling. */
export const runImmediately: TaskRunner = (task) => task();

/** A runner with no cap that counts how many tasks were sent through it. */
export function makeCountingRunner(): { run: TaskRunner; count: () => number } {
  let count = 0;
  const run: TaskRunner = (task) => {
    count += 1;
    return task();
  };
  return { run, count: () => count };
}
