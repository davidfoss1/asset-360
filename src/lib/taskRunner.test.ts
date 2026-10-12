import { describe, expect, it } from 'vitest';

import { createTaskRunner } from './taskRunner';

describe(createTaskRunner.name, () => {
  it('returns the result of the task', async () => {
    const run = createTaskRunner(2);

    expect(await run(() => Promise.resolve('done'))).toBe('done');
  });

  it('never runs more tasks at once than the cap', async () => {
    // Arrange
    const run = createTaskRunner(2);
    const tasks = Array.from({ length: 5 }, () => deferred());
    let running = 0;
    let peak = 0;
    const results = tasks.map((task) =>
      run(async () => {
        running += 1;
        peak = Math.max(peak, running);
        await task.promise;
        running -= 1;
      })
    );

    // Act
    await flush();
    expect(running).toBe(2);
    for (const task of tasks) {
      task.resolve();
      await flush();
    }
    await Promise.all(results);

    // Assert
    expect(peak).toBe(2);
  });

  it('starts queued tasks in the order they were submitted', async () => {
    // Arrange
    const run = createTaskRunner(1);
    const first = deferred();
    const started: string[] = [];
    const results = [
      run(() => {
        started.push('first');
        return first.promise;
      }),
      run(() => {
        started.push('second');
        return Promise.resolve();
      }),
      run(() => {
        started.push('third');
        return Promise.resolve();
      }),
    ];

    // Act
    await flush();
    expect(started).toEqual(['first']);
    first.resolve();
    await Promise.all(results);

    // Assert
    expect(started).toEqual(['first', 'second', 'third']);
  });

  it('passes a failure to its caller and keeps running the queue', async () => {
    // Arrange
    const run = createTaskRunner(1);

    // Act
    const failed = run(() => Promise.reject(new Error('boom')));
    const next = run(() => Promise.resolve('still runs'));

    // Assert
    await expect(failed).rejects.toThrow('boom');
    expect(await next).toBe('still runs');
  });

  it('frees the slot when a task throws synchronously', async () => {
    const run = createTaskRunner(1);

    const failed = run(() => {
      throw new Error('sync boom');
    });

    await expect(failed).rejects.toThrow('sync boom');
    expect(await run(() => Promise.resolve('after'))).toBe('after');
  });

  it.each([0, -1, 1.5, Number.NaN])('rejects a cap of %s', (cap) => {
    expect(() => createTaskRunner(cap)).toThrow(/positive integer/);
  });
});

function deferred() {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

/** Lets already-resolved promises run their continuations. */
async function flush() {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
}
