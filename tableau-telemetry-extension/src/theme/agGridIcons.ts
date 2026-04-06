/**
 * SVG icon overrides for AG Grid.
 * Replaces the built-in icon font with inline SVGs.
 * Passed via the `icons` prop on AgGridReact.
 */

const svg = (path: string, color = '#666') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="14" height="14">${path.replace(/%CLR%/g, color)}</svg>`

export const agGridIcons: Record<string, string> = {
  sortAscending: svg(`<path d="M6 2L10 8H2z" fill="#4E79A7"/>`),
  sortDescending: svg(`<path d="M6 10L2 4h8z" fill="#4E79A7"/>`),
  sortUnSort: svg(`<path d="M6 1L9 5H3z" fill="#bbb"/><path d="M6 11L3 7h6z" fill="#bbb"/>`),
  filter: svg(`<path d="M1 1h10L7.5 5.5V10l-3 1V5.5z" fill="%CLR%"/>`),
  menu: svg(`<rect x="1" y="2" width="10" height="1.5" rx=".5" fill="%CLR%"/><rect x="1" y="5.25" width="10" height="1.5" rx=".5" fill="%CLR%"/><rect x="1" y="8.5" width="10" height="1.5" rx=".5" fill="%CLR%"/>`),
  menuAlt: svg(`<circle cx="6" cy="2.5" r="1.2" fill="%CLR%"/><circle cx="6" cy="6" r="1.2" fill="%CLR%"/><circle cx="6" cy="9.5" r="1.2" fill="%CLR%"/>`),
  columns: svg(`<rect x="1" y="1" width="3" height="10" rx=".5" fill="%CLR%"/><rect x="5" y="1" width="3" height="10" rx=".5" fill="%CLR%"/><rect x="9" y="1" width="2" height="10" rx=".5" fill="#ccc"/>`),
  cross: svg(`<path d="M3 3l6 6M9 3l-6 6" stroke="%CLR%" stroke-width="1.5" stroke-linecap="round"/>`),
  cancel: svg(`<path d="M3 3l6 6M9 3l-6 6" stroke="%CLR%" stroke-width="1.5" stroke-linecap="round"/>`),
  pin: svg(`<path d="M7 1L5 3 3 3 3 5 5 5 3 7v2l2-2 2 2V7l2-2V3l-2 0z" fill="%CLR%"/>`),
  grip: svg(`<circle cx="4" cy="3" r="1" fill="#999"/><circle cx="8" cy="3" r="1" fill="#999"/><circle cx="4" cy="6" r="1" fill="#999"/><circle cx="8" cy="6" r="1" fill="#999"/><circle cx="4" cy="9" r="1" fill="#999"/><circle cx="8" cy="9" r="1" fill="#999"/>`),
  checkboxChecked: svg(`<rect x="1" y="1" width="10" height="10" rx="1.5" fill="#4E79A7" stroke="#4E79A7" stroke-width="1.2"/><path d="M3 6l2.5 2.5L9.5 4" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  checkboxUnchecked: svg(`<rect x="1" y="1" width="10" height="10" rx="1.5" fill="none" stroke="#999" stroke-width="1.2"/>`),
  checkboxIndeterminate: svg(`<rect x="1" y="1" width="10" height="10" rx="1.5" fill="#4E79A7" stroke="#4E79A7" stroke-width="1.2"/><rect x="3" y="5" width="6" height="2" rx=".5" fill="white"/>`),
  expanded: svg(`<path d="M2 4l4 5 4-5z" fill="%CLR%"/>`),
  contracted: svg(`<path d="M4 2l5 4-5 4z" fill="%CLR%"/>`),
  treeOpen: svg(`<path d="M2 4l4 5 4-5z" fill="%CLR%"/>`),
  treeClosed: svg(`<path d="M4 2l5 4-5 4z" fill="%CLR%"/>`),
}
