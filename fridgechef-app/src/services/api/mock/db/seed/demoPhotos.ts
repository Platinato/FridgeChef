/**
 * Mock backend seed: the demo photo library (Scan → "Use demo photos"). Mock mode only; not part of the contract.
 * Ported from fridgechef-mockup/js/data.js with values unchanged, and typed as contract DTOs so
 * a shape mismatch fails `tsc`. Copy follows the content rules (checked by content-rules.test.ts).
 */
/** A demo photo: a remote image the Scan screen can use instead of the camera. */
export type DemoPhotoDto = { id: string; label: string; uri: string };

export const demoPhotoSeed: DemoPhotoDto[] = [
  {
    id: 'lib1',
    label: 'Fridge',
    uri: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=70',
  },
  {
    id: 'lib2',
    label: 'Pantry shelf',
    uri: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=70',
  },
  {
    id: 'lib3',
    label: 'Spice rack',
    uri: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=70',
  },
  {
    id: 'lib4',
    label: 'Vegetables',
    uri: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=70',
  },
  {
    id: 'lib5',
    label: 'Grocery haul',
    uri: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&w=800&q=70',
  },
  {
    id: 'lib6',
    label: 'Dairy shelf',
    uri: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=70',
  },
];
