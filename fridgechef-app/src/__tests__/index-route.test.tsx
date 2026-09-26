import { render, screen } from '@testing-library/react-native';

import Index from '@/app/index';

describe('placeholder index route', () => {
  it('shows the app name and the API mode', async () => {
    await render(<Index />);
    expect(screen.getByText('FridgeChef · mode: mock')).toBeOnTheScreen();
  });
});
