// Global test setup (runs after the jest-expo preset's own setup).

// Reanimated 4: fake timers/frame loop and jest matchers (toHaveAnimatedStyle).
require('react-native-reanimated').setUpTests();

// @gorhom/bottom-sheet: the shipped mock, except BottomSheetModal behaves like the real one
// (Sprint 06): content renders only after present(), and dismiss() fires onDismiss. The shipped
// mock renders every modal's content all the time, so closed sheets would leak into screen tests.
jest.mock('@gorhom/bottom-sheet', () => {
  const mock = require('@gorhom/bottom-sheet/mock');
  const React = require('react');

  class BottomSheetModal extends React.Component<{
    children?: unknown;
    onDismiss?: () => void;
  }> {
    state = { presented: false };
    present() {
      this.setState({ presented: true });
    }
    dismiss() {
      if (!this.state.presented) return;
      this.setState({ presented: false });
      this.props.onDismiss?.();
    }
    close() {
      this.dismiss();
    }
    forceClose() {
      this.dismiss();
    }
    snapToIndex() {}
    snapToPosition() {}
    expand() {}
    collapse() {}
    render() {
      return this.state.presented ? this.props.children : null;
    }
  }

  return { ...mock, BottomSheetModal };
});

// @react-native-community/netinfo (Sprint 09): the package's own mock (online by default).
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);
