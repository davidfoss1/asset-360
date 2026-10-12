/** Runs a task, possibly after waiting for a free slot. Resolves or rejects with the task's outcome. */
export type TaskRunner = <T>(task: () => Promise<T>) => Promise<T>;

/** Runs at most `maxConcurrent` tasks at once and starts the rest in submission order. */
export function createTaskRunner(maxConcurrent: number): TaskRunner {
  if (!Number.isInteger(maxConcurrent) || maxConcurrent < 1) {
    throw new Error(`maxConcurrent must be a positive integer, got ${maxConcurrent}`);
  }

  let running = 0;
  const waiting: Array<() => void> = [];

  const release = () => {
    const next = waiting.shift();
    if (next) next();
    else running -= 1;
  };

  return async function run<T>(task: () => Promise<T>): Promise<T> {
    if (running >= maxConcurrent) {
      // The slot is handed over by `release`, which leaves `running` unchanged.
      await new Promise<void>((resume) => waiting.push(resume));
    } else {
      running += 1;
    }
    try {
      return await task();
    } finally {
      release();
    }
  };
}
