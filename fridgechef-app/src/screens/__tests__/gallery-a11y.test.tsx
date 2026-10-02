import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ComponentGalleryScreen } from '@/screens/dev/ComponentGalleryScreen';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 54, left: 0, right: 0, bottom: 34 },
};

const PRESS_ROLES = new Set(['button', 'switch', 'radio', 'tab', 'link']);

/**
 * Accessibility baseline sweep over the dev gallery, which renders every primitive in every
 * variant: each pressable has a role and a label.
 */
describe('dev gallery accessibility', () => {
  it.each(['primitives', 'composites'] as const)(
    'gives every pressable a role and a label (%s)',
    async (tab) => {
      await render(
        <SafeAreaProvider initialMetrics={metrics}>
          <ComponentGalleryScreen initialTab={tab} />
        </SafeAreaProvider>,
      );
      // A host view that handles touches is a pressable (Pressable wires up the responder system).
      const root = screen.root;
      if (!root) throw new Error('nothing rendered');
      const pressables = root.queryAll(
        (node) =>
          typeof node.type === 'string' && typeof node.props.onResponderRelease === 'function',
      );
      expect(pressables.length).toBeGreaterThan(50);

      const problems = pressables.flatMap((node) => {
        const { accessibilityRole: role, accessibilityLabel: label, testID } = node.props;
        const id = `${node.type} ${testID ?? label ?? '(unlabelled)'}`;
        const issues: string[] = [];
        if (!PRESS_ROLES.has(role)) issues.push(`${id}: role "${role}"`);
        if (typeof label !== 'string' || label.trim() === '') issues.push(`${id}: no label`);
        return issues;
      });
      expect(problems).toEqual([]);
    },
  );
});
