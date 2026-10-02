import { render, screen, userEvent } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/BottomNav';
import { EmptyState } from '@/components/EmptyState';
import { IngredientRow } from '@/components/IngredientRow';
import { ListRow } from '@/components/ListRow';
import { PantryItem } from '@/components/PantryItem';
import { PhotoThumbStrip } from '@/components/PhotoThumbStrip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QuantitySlider, quantityStatus } from '@/components/QuantitySlider';
import { thumbCenter } from '@/components/RangeSlider';
import { RecipeCard } from '@/components/RecipeCard';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Sheet } from '@/components/Sheet';
import { ShutterButton } from '@/components/ShutterButton';
import { connectorPath, StepTimeline } from '@/components/StepTimeline';
import { TicketCard, ticketPath } from '@/components/TicketCard';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 54, left: 0, right: 0, bottom: 34 },
};
const renderSafe = (ui: ReactElement) =>
  render(<SafeAreaProvider initialMetrics={metrics}>{ui}</SafeAreaProvider>);
const user = () => userEvent.setup();

const recipe = {
  id: 'butter-chicken',
  name: 'Butter Chicken Lite',
  timeMin: 35,
  cuisine: 'Indian',
  effort: 3,
};
const match = { pct: 91, have: 10, total: 11, missing: [{ name: 'Fresh cream' }] };

describe('quantityStatus (the Confirm gate)', () => {
  it('flags low confidence until touched, then confirms', () => {
    expect(quantityStatus('low', false)).toMatchObject({
      kind: 'flagged',
      badge: { label: 'Please check', dot: 'red' },
    });
    expect(quantityStatus('low', true)).toMatchObject({
      kind: 'confirmed',
      badge: { label: 'Confirmed' },
    });
    expect(quantityStatus('high', true).badge.label).toBe('Confirmed');
  });

  it('labels untouched confidence without mentioning a machine', () => {
    expect(quantityStatus('high', false).badge.label).toBe('Sure');
    expect(quantityStatus('med', false).badge.label).toBe('Fairly sure');
    expect(quantityStatus(undefined, false).badge.label).toBe('Added by you');
  });
});

describe('QuantitySlider', () => {
  const base = {
    name: 'Chicken breast',
    value: 500,
    min: 100,
    max: 1500,
    step: 50,
    unit: 'g',
    estimate: 500,
  };

  it('shows "Please check" and a "Looks right" button while flagged', async () => {
    const onConfirm = jest.fn();
    await renderSafe(
      <QuantitySlider {...base} confidence="low" touched={false} onConfirm={onConfirm} />,
    );
    expect(screen.getByText('Please check')).toBeOnTheScreen();
    await user().press(screen.getByRole('button', { name: 'Looks right' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows "Confirmed" and no "Looks right" once touched', async () => {
    await renderSafe(<QuantitySlider {...base} confidence="low" touched />);
    expect(screen.getByText('Confirmed')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Looks right' })).toBeNull();
  });

  it('reports unit switches', async () => {
    const onUnitChange = jest.fn();
    await renderSafe(
      <QuantitySlider
        {...base}
        confidence="high"
        touched={false}
        units={['g', 'kg']}
        onUnitChange={onUnitChange}
      />,
    );
    expect(screen.getByRole('radio', { name: 'g' })).toBeSelected();
    await user().press(screen.getByRole('radio', { name: 'kg' }));
    expect(onUnitChange).toHaveBeenCalledWith('kg');
  });

  it('disables the stepper at the bounds and steps inside them', async () => {
    const onChange = jest.fn();
    await renderSafe(
      <QuantitySlider
        {...base}
        value={1500}
        confidence="high"
        touched={false}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('button', { name: 'Increase Chicken breast' })).toBeDisabled();
    await user().press(screen.getByRole('button', { name: 'Decrease Chicken breast' }));
    expect(onChange).toHaveBeenCalledWith(1450);
  });

  it('removes the item', async () => {
    const onRemove = jest.fn();
    await renderSafe(
      <QuantitySlider {...base} confidence="high" touched={false} onRemove={onRemove} />,
    );
    await user().press(screen.getByRole('button', { name: 'Remove Chicken breast' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});

describe('RangeSlider geometry', () => {
  it('centres a 28pt thumb like the mockup: 14 + pct × (width − 28)', () => {
    expect(thumbCenter(10, 10, 120, 328)).toBe(14);
    expect(thumbCenter(120, 10, 120, 328)).toBe(314);
    expect(thumbCenter(65, 10, 120, 328)).toBe(164);
    expect(thumbCenter(999, 10, 120, 328)).toBe(314);
  });
});

describe('RecipeCard', () => {
  it('shows match %, missing items and a match label on the full card', async () => {
    const onPress = jest.fn();
    await render(<RecipeCard recipe={recipe} match={match} onPress={onPress} />);
    expect(screen.getByText('91%')).toBeOnTheScreen();
    expect(screen.getByText('fresh cream')).toBeOnTheScreen();
    await user().press(
      screen.getByRole('button', { name: 'Butter Chicken Lite, 35 minutes, 91% match' }),
    );
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('says "You have everything" when nothing is missing', async () => {
    await render(<RecipeCard recipe={recipe} match={{ ...match, missing: [] }} />);
    expect(screen.getByText('You have everything')).toBeOnTheScreen();
  });

  it('compact stat="match" shows match % (Home "Cook again")', async () => {
    await render(<RecipeCard compact recipe={recipe} match={match} />);
    expect(screen.getByTestId('recipe-match')).toBeOnTheScreen();
    expect(screen.queryByText('Effort')).toBeNull();
  });

  it('compact stat="effort" shows effort bars and no match % (Saved)', async () => {
    await render(
      <RecipeCard compact stat="effort" recipe={recipe} match={match} onPress={jest.fn()} />,
    );
    expect(screen.queryByTestId('recipe-match')).toBeNull();
    expect(screen.queryByText(/%/)).toBeNull();
    expect(screen.getByText('Effort')).toBeOnTheScreen();
    expect(screen.getByRole('image', { name: 'Effort 3 of 5' })).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Butter Chicken Lite, 35 minutes, effort 3 of 5' }),
    ).toBeOnTheScreen();
  });
});

describe('TicketCard', () => {
  it('renders both halves and presses as one card', async () => {
    const onPress = jest.fn();
    await render(
      <TicketCard
        top={<Text>Top half</Text>}
        bottom={<Text>Bottom half</Text>}
        onPress={onPress}
        label="A ticket"
      />,
    );
    expect(screen.getByText('Top half')).toBeOnTheScreen();
    expect(screen.getByText('Bottom half')).toBeOnTheScreen();
    await user().press(screen.getByRole('button', { name: 'A ticket' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('cuts concave notches on the seam side only', () => {
    const top = ticketPath(300, 100, 'bottom');
    // Right notch: from (300, 86) to (286, 100) around the corner, sweep 0 (concave).
    expect(top).toContain('L300 86 A14 14 0 0 0 286 100');
    const bottom = ticketPath(300, 100, 'top');
    expect(bottom.startsWith('M14 0 L286 0 A14 14 0 0 0 300 14')).toBe(true);
    expect(ticketPath(300, 100, 'none')).not.toContain('A14');
  });
});

describe('Screen', () => {
  it('renders the body and the footer', async () => {
    await renderSafe(
      <Screen footer={<PrimaryButton label="Cook up ideas" variant="lime" />}>
        <Text>Body</Text>
      </Screen>,
    );
    expect(screen.getByText('Body')).toBeOnTheScreen();
    expect(screen.getByTestId('screen-footer')).toContainElement(
      screen.getByRole('button', { name: 'Cook up ideas' }),
    );
  });

  it('lays out a row footer and renders the overlay', async () => {
    await renderSafe(
      <Screen
        footerVariant="row"
        footer={[
          <PrimaryButton key="b" label="Back" variant="outline" />,
          <PrimaryButton key="n" label="Next step" variant="lime" />,
        ]}
        overlay={<Text>Overlay</Text>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Back' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Next step' })).toBeOnTheScreen();
    expect(screen.getByText('Overlay')).toBeOnTheScreen();
  });

  it('renders no footer when none is given', async () => {
    await renderSafe(<Screen withNav />);
    expect(screen.queryByTestId('screen-footer')).toBeNull();
  });
});

describe('BottomNav', () => {
  it('marks the active tab and calls onNavigate', async () => {
    const onNavigate = jest.fn();
    await renderSafe(<BottomNav active="home" onNavigate={onNavigate} />);
    expect(screen.getByRole('tab', { name: 'Home' })).toBeSelected();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    await user().press(screen.getByRole('tab', { name: 'Pantry' }));
    expect(onNavigate).toHaveBeenCalledWith('pantry');
  });
});

describe('small composites', () => {
  it('SectionHeader fires its action', async () => {
    const onAction = jest.fn();
    await render(
      <SectionHeader title="Running low" dot count={2} actionLabel="See all" onAction={onAction} />,
    );
    expect(screen.getByRole('header', { name: 'Running low, 2' })).toBeOnTheScreen();
    await user().press(screen.getByRole('button', { name: 'See all' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('ListRow is a button only with onPress', async () => {
    const onPress = jest.fn();
    await render(
      <>
        <ListRow label="Diet" detail="Vegetarian" onPress={onPress} />
        <ListRow label="Pack size" detail="~100 g jar" />
      </>,
    );
    expect(screen.getAllByRole('button')).toHaveLength(1);
    await user().press(screen.getByRole('button', { name: 'Diet, Vegetarian' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('EmptyState renders recovery actions', async () => {
    const onPress = jest.fn();
    await render(
      <EmptyState
        title="No matches"
        body="Loosen up."
        actions={[{ label: 'Add 30 min', onPress }]}
      />,
    );
    await user().press(screen.getByRole('button', { name: 'Add 30 min' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('IngredientRow shows the status badge', async () => {
    await render(<IngredientRow name="Fresh cream" qty="50 ML" status="missing" last />);
    expect(screen.getByText('Missing')).toBeOnTheScreen();
    expect(screen.getByTestId('image-fallback')).toBeOnTheScreen();
  });

  it('PantryItem announces low stock and toggles inclusion', async () => {
    const onChange = jest.fn();
    await render(
      <>
        <PantryItem
          item={{ id: 'g', name: 'Garam masala', level: 1, unitHint: '~100 g pack' }}
          low
          onPress={jest.fn()}
        />
        <PantryItem
          item={{ id: 'o', name: 'Oil', level: 3, unitHint: '1 L' }}
          toggle={{ on: true, onChange }}
        />
      </>,
    );
    expect(
      screen.getByRole('button', { name: 'Garam masala, running low, stock 1 of 5' }),
    ).toBeOnTheScreen();
    await user().press(screen.getByRole('switch', { name: 'Include Oil' }));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('PhotoThumbStrip removes and adds photos', async () => {
    const onRemove = jest.fn();
    const onAdd = jest.fn();
    await render(
      <PhotoThumbStrip
        photos={[{ id: 'p1', uri: 'https://example.com/a.jpg', label: 'Fridge' }]}
        onRemove={onRemove}
        onAdd={onAdd}
      />,
    );
    await user().press(screen.getByRole('button', { name: 'Remove photo 1' }));
    expect(onRemove).toHaveBeenCalledWith('p1');
    await user().press(screen.getByRole('button', { name: 'Add photos from gallery' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('PhotoThumbStrip hides the add tile at the limit', async () => {
    await render(
      <PhotoThumbStrip
        max={1}
        photos={[{ id: 'p1', uri: 'https://example.com/a.jpg', label: 'Fridge' }]}
        onAdd={jest.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Add photos from gallery' })).toBeNull();
  });

  it('ShutterButton blocks presses when disabled', async () => {
    const onPress = jest.fn();
    await render(<ShutterButton disabled onPress={onPress} />);
    const shutter = screen.getByRole('button', { name: 'Take photo' });
    expect(shutter).toBeDisabled();
    await user().press(shutter);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('StepTimeline announces each step with its time', async () => {
    await render(
      <StepTimeline
        steps={[
          { text: 'Sear the chicken.', minutes: 6 },
          { text: 'Simmer.', minutes: 8 },
        ]}
      />,
    );
    expect(screen.getByLabelText('Step 2 of 2: Simmer.. 8 minutes')).toBeOnTheScreen();
    expect(connectorPath(100)).toBe('M12 0 C 28 30, -4 62, 12 100');
  });

  it('Sheet renders its title, body, footer and a close button', async () => {
    await renderSafe(
      <Sheet
        open
        title="Add missed item"
        onClose={jest.fn()}
        footer={<PrimaryButton label="Add" />}
      >
        <Text>Body</Text>
      </Sheet>,
    );
    expect(screen.getByRole('header', { name: 'Add missed item' })).toBeOnTheScreen();
    expect(screen.getByText('Body')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Close' })).toBeOnTheScreen();
  });
});
