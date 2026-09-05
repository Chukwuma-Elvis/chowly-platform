// The dining room has tables 1-20. Values match the seed format (T01 … T20).
export const TABLES = Array.from({ length: 20 }, (_, i) => {
  const n = i + 1;
  return { value: `T${String(n).padStart(2, '0')}`, label: `Table ${n}` };
});
