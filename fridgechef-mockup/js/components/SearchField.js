/* SearchField - pill text input that live-filters the buttons inside [data-filter-list="<target>"].
   RN: <TextInput> + filtered list state */
FC.components.SearchField = function SearchField({ placeholder = 'Search', target }) {
  const { esc } = FC.util;
  return `<label class="c-search">
    ${FC.icon('search', 18)}
    <input type="search" placeholder="${esc(placeholder)}" data-action="filter" data-id="${esc(target)}" aria-label="${esc(placeholder)}" autocomplete="off">
  </label>`;
};
