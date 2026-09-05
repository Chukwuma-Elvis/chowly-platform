// The five menu_category enum values, in menu order, with display labels and a
// tint used on the item cards and the sidebar.
export const CATEGORIES = [
  { key: 'starter', label: 'Starters', band: 'bg-[#EFE3D2]' },
  { key: 'main', label: 'Main Courses', band: 'bg-[#E7D8C4]' },
  { key: 'sides', label: 'Sides', band: 'bg-[#E9E0CE]' },
  { key: 'dessert', label: 'Desserts', band: 'bg-[#F0DACE]' },
  { key: 'drinks', label: 'Drinks', band: 'bg-[#DfE2D3]' },
];

export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.label]));
export const CATEGORY_BAND = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.band]));
