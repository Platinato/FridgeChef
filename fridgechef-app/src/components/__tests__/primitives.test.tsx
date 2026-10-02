import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import {
  AccessibilityInfo,
  StyleSheet,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { AppLogo } from '@/components/AppLogo';
import { AppText, FONT_SCALE_CAP } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Chip } from '@/components/Chip';
import { ChipRow } from '@/components/ChipRow';
import { CounterPill } from '@/components/CounterPill';
import { Disc } from '@/components/Disc';
import { FallbackImage } from '@/components/FallbackImage';
import { HeroTitle } from '@/components/HeroTitle';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { LevelBars } from '@/components/LevelBars';
import { LiveBadge } from '@/components/LiveBadge';
import { PaginationDots } from '@/components/PaginationDots';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProgressBar } from '@/components/ProgressBar';
import { touchSlop } from '@/components/PressableScale';
import { SegmentedControl } from '@/components/SegmentedControl';
import { StatTileRow } from '@/components/StatTileRow';
import { Stepper, formatStepperValue, stepValue } from '@/components/Stepper';
import { TabBar } from '@/components/TabBar';
import { RangeSlider } from '@/components/RangeSlider';
import { ShutterButton } from '@/components/ShutterButton';
import { showToast } from '@/components/Toast';
import { Toggle } from '@/components/Toggle';
import { haptics } from '@/components/haptics';
import { iconNames } from '@/theme/icons';
import { colors } from '@/theme/tokens';

const user = () => userEvent.setup();
const flat = (style: StyleProp<ViewStyle & TextStyle>) => StyleSheet.flatten(style) ?? {};

describe('touchSlop', () => {
  it('grows small visuals to the 44pt minimum and leaves big ones alone', () => {
    expect(touchSlop(44)).toBeUndefined();
    expect(touchSlop(52)).toBeUndefined();
    expect(touchSlop(40)).toEqual({ top: 2, bottom: 2, left: 2, right: 2 });
    expect(touchSlop(120, 36)).toEqual({ top: 4, bottom: 4, left: 0, right: 0 });
  });
});

describe('AppText', () => {
  it('applies per-variant default colours', async () => {
    await render(
      <>
        <AppText variant="display">Title</AppText>
        <AppText variant="body">Body</AppText>
        <AppText variant="caption" color="lime">
          Caption
        </AppText>
      </>,
    );
    expect(flat(screen.getByText('Title').props.style).color).toBe(colors.text);
    expect(flat(screen.getByText('Title').props.style).textTransform).toBe('uppercase');
    expect(flat(screen.getByText('Body').props.style).color).toBe(colors.text2);
    expect(flat(screen.getByText('Caption').props.style).color).toBe(colors.lime);
  });
});

describe('Icon / AppLogo', () => {
  it('renders every mockup icon', async () => {
    await render(
      <>
        {iconNames.map((n) => (
          <Icon key={n} name={n} />
        ))}
      </>,
    );
    for (const n of iconNames) expect(screen.getByTestId(`icon-${n}`)).toBeOnTheScreen();
  });

  it('labels the logo', async () => {
    await render(<AppLogo />);
    expect(screen.getByRole('image', { name: 'FridgeChef' })).toBeOnTheScreen();
  });
});

describe('IconButton', () => {
  it('is a labelled button that fires onPress', async () => {
    const onPress = jest.fn();
    await render(<IconButton icon="search" label="Search recipes" onPress={onPress} />);
    await user().press(screen.getByRole('button', { name: 'Search recipes' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('blocks presses when disabled', async () => {
    const onPress = jest.fn();
    await render(<IconButton icon="trash" label="Remove" disabled onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Remove' });
    expect(button).toBeDisabled();
    await user().press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows the badge dot only when asked', async () => {
    await render(<IconButton icon="bell" label="Notifications" badge />);
    expect(screen.getByTestId('iconbutton-badge')).toBeOnTheScreen();
  });

  it('gets hitSlop when smaller than 44pt', async () => {
    await render(<IconButton icon="close" label="Close" size={40} />);
    expect(screen.getByRole('button', { name: 'Close' }).props.hitSlop).toEqual({
      top: 2,
      bottom: 2,
      left: 2,
      right: 2,
    });
  });
});

describe('Chip / ChipRow', () => {
  it('exposes the selected state and fires onPress', async () => {
    const onPress = jest.fn();
    await render(<Chip label="Comfort" active onPress={onPress} />);
    const chip = screen.getByRole('button', { name: 'Comfort' });
    expect(chip).toBeSelected();
    await user().press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders every chip in scroll and wrap mode', async () => {
    const chips = [
      { key: 'a', label: 'Indian' },
      { key: 'b', label: 'Thai' },
    ];
    await render(
      <>
        <ChipRow chips={chips} />
        <ChipRow chips={chips} wrap />
      </>,
    );
    expect(screen.getAllByRole('button', { name: 'Indian' })).toHaveLength(2);
  });
});

describe('Badge / LiveBadge / CounterPill', () => {
  it('is static text without onPress and a button with it', async () => {
    const onPress = jest.fn();
    await render(
      <>
        <Badge label="Have" icon="check" size="sm" />
        <LiveBadge
          label="04:59"
          size="lg"
          icon="timer"
          onPress={onPress}
          accessibilityLabel="Start the timer"
        />
      </>,
    );
    expect(screen.getByLabelText('Have')).toHaveProp('accessibilityRole', 'text');
    expect(screen.queryByRole('button', { name: 'Have' })).toBeNull();
    await user().press(screen.getByRole('button', { name: 'Start the timer' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders the live dot for LiveBadge and a static red dot for alerts', async () => {
    await render(
      <>
        <LiveBadge label="Ready" />
        <Badge label="Short" dot="red" variant="alert" />
      </>,
    );
    expect(screen.getByTestId('live-dot')).toBeOnTheScreen();
    expect(screen.getByTestId('red-dot')).toBeOnTheScreen();
  });

  it('announces the counter value', async () => {
    await render(<CounterPill icon="basket" value="12 items" />);
    // The accessible container collapses icon + text into one announced element.
    expect(screen.getByLabelText('12 items')).toHaveProp('accessibilityRole', 'text');
  });
});

describe('PrimaryButton', () => {
  it('fires onPress', async () => {
    const onPress = jest.fn();
    await render(<PrimaryButton label="Start cooking" onPress={onPress} />);
    await user().press(screen.getByRole('button', { name: 'Start cooking' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is text-only unless an icon is passed', async () => {
    await render(<PrimaryButton label="Start cooking" />);
    expect(screen.queryByTestId(/^icon-/)).toBeNull();
  });

  it('blocks presses and greys out when disabled', async () => {
    const onPress = jest.fn();
    await render(<PrimaryButton label="Back" variant="outline" disabled onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Back' });
    expect(button).toBeDisabled();
    await user().press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(flat(button.props.style).backgroundColor).toBe(colors.surface3);
  });
});

describe('Disc', () => {
  it('is a button only when pressable', async () => {
    const onPress = jest.fn();
    await render(
      <>
        <Disc label="35'" />
        <Disc icon="camera" variant="lime" onPress={onPress} accessibilityLabel="Scan now" />
      </>,
    );
    expect(screen.queryAllByRole('button')).toHaveLength(1);
    await user().press(screen.getByRole('button', { name: 'Scan now' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('LevelBars', () => {
  it('describes the level in display mode', async () => {
    await render(<LevelBars level={3} />);
    expect(screen.getByRole('image', { name: 'Level 3 of 5' })).toBeOnTheScreen();
  });

  it('reports the 1-based level of the pressed square in input mode', async () => {
    const onChange = jest.fn();
    await render(<LevelBars level={2} size={30} onChange={onChange} label="Spice level" />);
    const squares = screen.getAllByRole('button');
    expect(squares).toHaveLength(5);
    expect(squares[1]).toBeSelected();
    expect(squares[2]).not.toBeSelected();
    await user().press(screen.getByRole('button', { name: 'Level 4 of 5' }));
    expect(onChange).toHaveBeenCalledWith(4);
  });
});

describe('StatTileRow / ProgressBar / PaginationDots', () => {
  it('makes the first stat tile taller', async () => {
    await render(
      <StatTileRow
        tiles={[
          { value: '35', caption: 'MIN', variant: 'lime' },
          { value: '540', caption: 'KCAL', variant: 'white' },
        ]}
      />,
    );
    expect(flat(screen.getByLabelText('35 MIN').props.style).minHeight).toBe(88);
    expect(flat(screen.getByLabelText('540 KCAL').props.style).minHeight).toBe(72);
  });

  it('clamps the progress fill and exposes the value', async () => {
    await render(<ProgressBar value={3} max={5} label="Step 3 of 5" caption="60%" />);
    const bar = screen.getByRole('progressbar', { name: 'Step 3 of 5' });
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 5, now: 3 });
    expect(flat(screen.getByTestId('progress-fill').props.style).width).toBe('60.0%');
  });

  it('never overflows the track', async () => {
    await render(<ProgressBar value={9} max={5} />);
    expect(flat(screen.getByTestId('progress-fill').props.style).width).toBe('100.0%');
  });

  it('indeterminate: a sliding segment, busy, and no value', async () => {
    await render(<ProgressBar value={0} indeterminate label="Scanning" />);
    const bar = screen.getByRole('progressbar', { name: 'Scanning' });
    expect(bar.props.accessibilityValue).toBeUndefined();
    expect(bar.props.accessibilityState).toEqual({ busy: true });
    expect(screen.getByTestId('progress-indeterminate')).toBeOnTheScreen();
    expect(screen.queryByTestId('progress-fill')).toBeNull();
  });

  it('labels the onboarding step', async () => {
    await render(<PaginationDots count={4} active={1} />);
    expect(screen.getByRole('image', { name: 'Step 2 of 4' })).toBeOnTheScreen();
  });
});

describe('Toggle', () => {
  it('is a switch that reports the next value', async () => {
    const onChange = jest.fn();
    await render(
      <Toggle on={false} label="Auto-include staples" sub="Every scan" onChange={onChange} />,
    );
    const sw = screen.getByRole('switch', { name: 'Auto-include staples' });
    expect(sw).not.toBeChecked();
    await user().press(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('keeps a label when bare and blocks presses when disabled', async () => {
    const onChange = jest.fn();
    await render(<Toggle bare on label="Include salt" disabled onChange={onChange} />);
    const sw = screen.getByRole('switch', { name: 'Include salt' });
    expect(sw).toBeChecked();
    await user().press(sw);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Stepper', () => {
  it('rounds steps to 2 decimals and clamps to min / max', () => {
    expect(stepValue(0.1, 0.2, 1, 0, 10)).toBe(0.3);
    expect(stepValue(1.5, 0.25, -1, 0, 3)).toBe(1.25);
    expect(stepValue(0.1, 0.25, -1, 0, 3)).toBe(0);
    expect(stepValue(2.9, 0.25, 1, 0, 3)).toBe(3);
    expect(stepValue(2, 1, 1, 1, 8)).toBe(3);
  });

  it('formats like the mockup (no trailing zeros)', () => {
    expect(formatStepperValue(1.5)).toBe('1.5');
    expect(formatStepperValue(2)).toBe('2');
    expect(formatStepperValue(0.30000000000000004)).toBe('0.3');
  });

  it('sends the next value and disables the button at the bounds', async () => {
    const onChange = jest.fn();
    await render(<Stepper value={1} min={1} max={8} label="Servings" onChange={onChange} />);
    const dec = screen.getByRole('button', { name: 'Decrease Servings' });
    expect(dec).toBeDisabled();
    await user().press(dec);
    expect(onChange).not.toHaveBeenCalled();
    await user().press(screen.getByRole('button', { name: 'Increase Servings' }));
    expect(onChange).toHaveBeenCalledWith(2);
    expect(screen.getByText('1')).toBeOnTheScreen();
  });

  it('hides the value when asked', async () => {
    await render(<Stepper value={3} hideValue label="Servings" />);
    expect(screen.queryByText('3')).toBeNull();
  });
});

describe('SegmentedControl / TabBar', () => {
  it('selects an option and renders level bars when options carry a level', async () => {
    const onChange = jest.fn();
    await render(
      <SegmentedControl
        label="Effort"
        value="easy"
        onChange={onChange}
        options={[
          { value: 'easy', label: 'Easy', level: 1 },
          { value: 'pro', label: 'Pro', level: 5 },
        ]}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Easy' })).toBeSelected();
    expect(screen.getAllByRole('image', { name: /^Level/ })).toHaveLength(2);
    await user().press(screen.getByRole('radio', { name: 'Pro' }));
    expect(onChange).toHaveBeenCalledWith('pro');
  });

  it('omits level bars for plain options (Profile default effort)', async () => {
    await render(
      <SegmentedControl
        value="easy"
        options={[
          { value: 'easy', label: 'Easy' },
          { value: 'pro', label: 'Pro' },
        ]}
      />,
    );
    expect(screen.queryAllByRole('image')).toHaveLength(0);
  });

  it('marks the active tab and reports presses', async () => {
    const onChange = jest.fn();
    await render(
      <TabBar
        active="steps"
        onChange={onChange}
        tabs={[
          { id: 'ingredients', label: 'Ingredients' },
          { id: 'steps', label: 'Steps' },
        ]}
      />,
    );
    expect(screen.getByRole('tab', { name: 'Steps' })).toBeSelected();
    await user().press(screen.getByRole('tab', { name: 'Ingredients' }));
    expect(onChange).toHaveBeenCalledWith('ingredients');
  });
});

describe('HeroTitle', () => {
  it('is announced as one header and renders the right slot', async () => {
    await render(
      <HeroTitle
        kicker="My"
        title="Pantry"
        right={<CounterPill icon="pantry" value="25 staples" />}
      />,
    );
    expect(screen.getByRole('header', { name: 'My Pantry' })).toBeOnTheScreen();
    expect(screen.getByLabelText('25 staples')).toBeOnTheScreen();
  });
});

describe('Sprint 09 accessibility', () => {
  it('caps Dynamic Type per variant: display barely grows, reading text may double', async () => {
    await render(
      <>
        <AppText variant="display">Big</AppText>
        <AppText variant="body">Read me</AppText>
        <AppText variant="micro">Tag</AppText>
      </>,
    );
    expect(screen.getByText('Big').props.maxFontSizeMultiplier).toBe(FONT_SCALE_CAP.display);
    expect(screen.getByText('Read me').props.maxFontSizeMultiplier).toBe(2);
    expect(screen.getByText('Tag').props.maxFontSizeMultiplier).toBe(1.3);
  });

  it('controls that hold text grow with it (minHeight, not height)', async () => {
    await render(<PrimaryButton label="Grow" onPress={() => undefined} />);
    const box = flat(screen.getByRole('button', { name: 'Grow' }).props.style);
    expect(box.minHeight).toBe(56);
    expect(box.height).toBeUndefined();
  });

  it('RangeSlider is one adjustable element: value with unit, steps by `step`', async () => {
    const onChange = jest.fn();
    const { rerender } = await render(
      <RangeSlider
        min={10}
        max={120}
        step={5}
        value={45}
        unit="min"
        label="Minutes available"
        onChange={onChange}
      />,
    );
    const slider = screen.getByRole('adjustable', { name: 'Minutes available' });
    expect(slider.props.accessibilityValue).toMatchObject({
      min: 10,
      max: 120,
      now: 45,
      text: '45 min',
    });
    await fireEvent(slider, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onChange).toHaveBeenLastCalledWith(50);
    await fireEvent(slider, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(onChange).toHaveBeenLastCalledWith(40);

    onChange.mockClear();
    await rerender(
      <RangeSlider
        min={10}
        max={120}
        step={5}
        value={120}
        unit="min"
        label="Minutes available"
        onChange={onChange}
      />,
    );
    await fireEvent(screen.getByRole('adjustable'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(onChange).not.toHaveBeenCalled(); // already at max
  });

  it('switches and the shutter give light haptic feedback', async () => {
    const selection = jest.spyOn(haptics, 'selection').mockImplementation(() => undefined);
    const tap = jest.spyOn(haptics, 'tap').mockImplementation(() => undefined);
    const user = userEvent.setup();
    await render(
      <>
        <Toggle on={false} label="Auto-include" onChange={() => undefined} />
        <ShutterButton onPress={() => undefined} />
      </>,
    );
    await user.press(screen.getByRole('switch', { name: 'Auto-include' }));
    await user.press(screen.getByRole('button', { name: 'Take photo' }));
    expect(selection).toHaveBeenCalledTimes(1);
    expect(tap).toHaveBeenCalledTimes(1);
    selection.mockRestore();
    tap.mockRestore();
  });
});

describe('Toast', () => {
  it('announces the message for VoiceOver', () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);
    showToast('Pantry updated');
    expect(announce).toHaveBeenCalledWith('Pantry updated');
    announce.mockRestore();
  });
});

describe('FallbackImage (Sprint 09 performance)', () => {
  it('caches remote photos in memory + on disk and shows a placeholder colour while loading', async () => {
    await render(<FallbackImage uri="https://example.com/a.jpg" label="Basil" />);
    const image = screen.getByTestId('image-photo');
    expect(image.props.cachePolicy).toBe('memory-disk');
    expect(flat(image.props.style).backgroundColor).toBe(colors.surface2);
  });
});
