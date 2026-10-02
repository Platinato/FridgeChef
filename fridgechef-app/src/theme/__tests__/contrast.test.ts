/**
 * Sprint 09 contrast check: the text / background pairs the components actually use meet WCAG AA
 * (4.5:1 for body text). Translucent backgrounds are blended over the page colour first.
 */
import fs from 'node:fs';
import path from 'node:path';

import { colors } from '@/theme/tokens';

type RGB = [number, number, number];

function parse(color: string): { rgb: RGB; alpha: number } {
  if (color.startsWith('#')) {
    const h = color.slice(1);
    return { rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB, alpha: 1 };
  }
  const [r, g, b, a = '1'] = color.replace(/rgba?\(|\)/g, '').split(',');
  return { rgb: [Number(r), Number(g), Number(b)], alpha: Number(a) };
}

/** `color` (maybe translucent) composited over an opaque `base`. */
function over(color: string, base: RGB): RGB {
  const top = parse(color);
  return top.rgb.map((c, i) => c * top.alpha + base[i]! * (1 - top.alpha)) as RGB;
}

const luminance = (rgb: RGB) => {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};

export const contrast = (fg: string, bg: string, page: string = colors.bg): number => {
  const back = over(bg, parse(page).rgb);
  const [a, b] = [luminance(over(fg, back)), luminance(back)].sort((x, y) => y - x);
  return (a! + 0.05) / (b! + 0.05);
};

const AA = 4.5;

describe('contrast (WCAG AA, 4.5:1)', () => {
  it.each([
    ['body text on the page', colors.text, colors.bg],
    ['secondary text on the page', colors.text2, colors.bg],
    ['secondary text on cards (surface 2)', colors.text2, colors.surface2],
    ['secondary text on chips (surface 3)', colors.text2, colors.surface3],
    ['ink on lime (CTAs, lime cards)', colors.ink, colors.lime],
    ['ink on the light ticket', colors.ink, colors.lightCard],
    ['lime numbers on the page', colors.lime, colors.bg],
    ['alert badge text ("need a check")', colors.alertText, colors.alertBg],
    ['danger button text', colors.alertText, colors.bg],
    ['alert InfoCard body', colors.infoAlertText, colors.infoAlertBg],
  ])('%s', (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AA);
  });

  it('text3 is below AA, so it stays out of the app UI (only the dev gallery shows it)', () => {
    expect(contrast(colors.text3, colors.bg)).toBeLessThan(AA);
    const src = path.join(__dirname, '..', '..');
    const files = ['components', 'screens'].flatMap((dir) =>
      fs
        .readdirSync(path.join(src, dir), { recursive: true, withFileTypes: true })
        .filter((f) => f.isFile() && /.tsx?$/.test(f.name) && !f.parentPath.includes('__tests__'))
        .map((f) => path.join(f.parentPath, f.name)),
    );
    const users = files
      .filter((f) => !f.includes(`${path.sep}dev${path.sep}`) && !f.endsWith('AppText.tsx'))
      .filter((f) => /text3/.test(fs.readFileSync(f, 'utf8')));
    expect(users).toEqual([]);
  });
});
