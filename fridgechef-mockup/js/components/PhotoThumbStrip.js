/* PhotoThumbStrip - captured photos as 64px rounded thumbs with a remove ×, plus a "+" tile.
   Blurry photos get a red ring. RN: horizontal <ScrollView> of <Image> */
FC.components.PhotoThumbStrip = function PhotoThumbStrip({ photos, removable = true, addAction, max = 6 }) {
  const { cx, act, img } = FC.util;
  const items = photos.map((p, i) => `
    <div class="${cx('c-thumbs__item', p.blurry && 'is-blurry')}">
      ${img(p.src, `${p.label} photo`, 'c-thumbs__img')}
      <span class="c-thumbs__num">${i + 1}</span>
      ${removable ? `<button class="c-thumbs__remove" ${act('remove-photo', p.id)} aria-label="Remove photo ${i + 1}">${FC.icon('close', 12, 3)}</button>` : ''}
    </div>`).join('');
  const add = addAction && photos.length < max
    ? `<button class="c-thumbs__add" ${act(addAction)} aria-label="Add photos from gallery">${FC.icon('plus', 22)}</button>`
    : '';
  return `<div class="c-thumbs no-scrollbar" data-keep-scroll="thumbs">${items}${add}</div>`;
};
