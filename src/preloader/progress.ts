// Tiny honest progress tracker: weighted real tasks only, no fake fills.
type Task = { weight: number; value: number };
const tasks = new Map<string, Task>();
export function registerTask(id: string, weight: number) {
  tasks.set(id, { weight, value: 0 });
  return {
    update(f: number) {
      const t = tasks.get(id);
      if (t) t.value = Math.min(1, Math.max(0, f));
    },
    done() {
      const t = tasks.get(id);
      if (t) t.value = 1;
    },
  };
}
export function getRealProgress(): number {
  let w = 0;
  let v = 0;
  for (const t of tasks.values()) {
    w += t.weight;
    v += t.weight * t.value;
  }
  return w === 0 ? 0 : Math.min(1, Math.max(0, v / w));
}
export function resetProgress() {
  tasks.clear();
}
