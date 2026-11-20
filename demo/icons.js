const ICON_PATHS = {
  notebook: '<path d="M6 3.5h12a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5Z"/><path d="M8.5 4v16m3.5-12h4m-4 3h3"/>',
  star: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
  trash: '<path d="M4 7h16m-12-3h8l1 3M6 7l1 13h10l1-13m-8 4v5m4-5v5"/>',
  shield: '<path d="m12 3 8 3v5c0 4.8-3.5 8.1-8 10-4.5-1.9-8-5.2-8-10V6Z"/><path d="m8.8 11.6 2.3 2.3 4.3-4.3"/>',
  eraser: '<path d="m3.6 13.8 9.6-10 7 7-9.2 9.4H9.4l-5.8-5.5a.7.7 0 0 1 0-.9Zm4.7-4.7 7 6.8m-5.5 4.3h11"/>',
  panels: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9.5 5v14"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>', plus:'<path d="M12 5v14m-7-7h14"/>',
  search: '<circle cx="10.3" cy="10.3" r="6.5"/><path d="m15.5 15.5 4.7 4.7"/>',
  'sort-down':'<path d="M4 6h11M4 11h8m-8 5h5m8-9v12m-3.5-3.5L17 19l3.5-3.5"/>',
  'sort-up':'<path d="M4 6h5M4 11h8m-8 5h11m2 1V5m-3.5 3.5L17 5l3.5 3.5"/>',
  file:'<path d="M6 3.5h8l4.5 4.8V20H6Zm8 .5v5h4m-9 3h6m-6 3h5"/>',
  edit:'<path d="m4 20 4.7-1.1L20 7.6c.8-.9.8-1.8 0-2.6L19 4c-.8-.8-1.7-.8-2.6 0L5.1 15.3 4 20Zm10.7-14.3 3.6 3.6"/>',
  user:'<circle cx="12" cy="8" r="3.1"/><path d="M5 20v-1c0-3.3 2.9-5.5 7-5.5s7 2.2 7 5.5v1"/>',
  calendar:'<rect x="3.5" y="6" width="17" height="14" rx="2"/><path d="M7.5 3v6m9-6v6m-13 2h17"/>',
  flask:'<path d="M9 3h6m-5 0v6.3l-6 9.2a1.6 1.6 0 0 0 1.4 2.3h13.2a1.6 1.6 0 0 0 1.4-2.3l-6-9.2V3M7.5 15h9"/>',
  menu:'<path d="M3 6h18M3 12h18M3 18h18"/>', x:'<path d="m6 6 12 12M6 18 18 6"/>',
  restore:'<path d="M4 10a8 8 0 1 1 1.4 7.2M4 4v6h6"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="2.8"/>'
};
function icon(name) {
  return '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (ICON_PATHS[name] || '') + '</svg>';
}
document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
