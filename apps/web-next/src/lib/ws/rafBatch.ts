'use client'

type Task = () => void

export function createRafBatch() {
  let queued = false
  const tasks: Task[] = []

  function loop() {
    queued = false
    const copy = tasks.splice(0, tasks.length)
    for (const t of copy) t()
  }

  return {
    enqueue(task: Task) {
      tasks.push(task)
      if (!queued) {
        queued = true
        requestAnimationFrame(loop)
      }
    },
  }
}

/**
 * RAF-based batching to limit render frequency
 * Coalesces multiple updates into single RAF callback
 */

export function rafBatch<T>(push: (batch: T[]) => void) {
  let queue: T[] = [];
  let scheduled = false;
  
  return (msg: T) => {
    queue.push(msg);
    
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        const batch = queue;
        queue = [];
        push(batch);
      });
    }
  };
}

