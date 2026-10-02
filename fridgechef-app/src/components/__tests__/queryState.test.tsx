import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppText } from '@/components/AppText';
import { QueryState } from '@/components/QueryState';

const child = <AppText>Loaded content</AppText>;

describe('QueryState', () => {
  it('shows a placeholder while loading', async () => {
    await render(
      <QueryState loading errorMessage={null} onRetry={jest.fn()} placeholder="chips">
        {child}
      </QueryState>,
    );
    expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
    expect(screen.queryByText('Loaded content')).toBeNull();
  });

  it('shows the error with Try again (error wins over loading)', async () => {
    const onRetry = jest.fn();
    await render(
      <QueryState
        loading
        errorMessage="No connection. Check your internet and try again."
        onRetry={onRetry}
      >
        {child}
      </QueryState>,
    );
    expect(screen.getByText("Couldn't load this")).toBeOnTheScreen();
    expect(screen.getByText('No connection. Check your internet and try again.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders the children once loaded', async () => {
    await render(
      <QueryState loading={false} errorMessage={null} onRetry={jest.fn()} blocks={2}>
        {child}
      </QueryState>,
    );
    expect(screen.getByText('Loaded content')).toBeOnTheScreen();
  });
});
