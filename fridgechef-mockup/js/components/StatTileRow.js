/* StatTileRow - three equal StatTiles; the first stands taller like the reference. RN: <View row> */
FC.components.StatTileRow = function StatTileRow({ tiles }) {
  return `<div class="c-statrow">${tiles.map((t, i) => FC.components.StatTile(Object.assign({ tall: i === 0 }, t))).join('')}</div>`;
};
