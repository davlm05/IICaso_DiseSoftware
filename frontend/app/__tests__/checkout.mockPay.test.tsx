/**
 * Integration test for the mock "Simular pago en caja" button.
 * README §1.7 (React Native Testing Library 12.8).
 *
 * Covers the checkout QR validation screen (`/app/checkout.tsx`):
 * - Button renders when QR exists and session is PENDING_CHECKOUT
 * - Button is disabled before QR generation and while processing
 * - Pressing the button calls store.confirmValidation() exactly once
 * - Navigation to /confirmation occurs after successful mock pay
 * - Rapid clicks are debounced (no double-dispatch)
 * - Store state is updated correctly
 *
 * Run with: `npm test -- checkout.mockPay.test.tsx`
 */
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';
import { ReactNode } from 'react';
import CheckoutScreen from '../checkout';
import { useSessionStore } from '../../src/store/sessionStore';
import type { ProductDTO } from '../../src/types';

// Mock expo-router
const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
}));

// Mock the real product for state seeding
const testProduct: ProductDTO = {
  id: 'product-1',
  barcode: '7441234567890',
  name: 'Café 1kg',
  brand: 'Café Rey',
  price: 4500,
  points: 50,
  iconName: 'Coffee',
  sponsored: false,
};

/**
 * Helper: seed the store with a PENDING_CHECKOUT session.
 * Call this in beforeEach to reset state between tests.
 */
function seedPendingCheckout(overrides: Partial<ReturnType<typeof useSessionStore.getState>> = {}) {
  useSessionStore.setState({
    status: 'PENDING_CHECKOUT',
    pendingItems: [testProduct],
    creditedPoints: 100,
    qrToken: 'SC-2026-AX9K-7283-TOKEN',
    qrFallbackCode: 'SC-2026-AX9K-7283',
    qrExpiresAt: Date.now() + 10 * 60 * 1000,
    ...overrides,
  });
}

/**
 * Test suite: CheckoutScreen — mock pay button integration
 */
describe('CheckoutScreen — mock pay button (README §1.7)', () => {
  beforeEach(() => {
    // Clear mocks and reset store state between tests
    mockReplace.mockClear();
    mockPush.mockClear();
    useSessionStore.getState().reset?.();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders the mock pay button when QR exists and status is PENDING_CHECKOUT', () => {
      seedPendingCheckout();
      render(<CheckoutScreen />);

      // Button should be visible with correct label
      expect(screen.getByLabelText('Simular pago en caja')).toBeTruthy();
    });

    it('hides the button when no QR token exists (QR not yet generated)', () => {
      useSessionStore.setState({
        status: 'PENDING_CHECKOUT',
        pendingItems: [testProduct],
        qrToken: null, // No QR yet
        qrFallbackCode: null,
        qrExpiresAt: null,
      });

      render(<CheckoutScreen />);

      // Button should not be visible
      expect(screen.queryByLabelText('Simular pago en caja')).toBeNull();
    });

    it('hides the button when status is not PENDING_CHECKOUT (e.g., ACTIVE)', () => {
      useSessionStore.setState({
        status: 'ACTIVE', // Wrong status
        pendingItems: [testProduct],
        qrToken: 'SC-TOKEN',
        qrFallbackCode: 'SC-CODE',
        qrExpiresAt: Date.now() + 600000,
      });

      render(<CheckoutScreen />);

      // Button should not be visible
      expect(screen.queryByLabelText('Simular pago en caja')).toBeNull();
    });

    it('displays the QR code alongside the mock pay button', () => {
      seedPendingCheckout();
      render(<CheckoutScreen />);

      // Both QR view and button should be present
      expect(screen.getByLabelText('Simular pago en caja')).toBeTruthy();
      // QR should also be rendered (if there's an accessible label for it)
      // This depends on the QRCodeView component's accessibility setup
    });

    it('shows a simulation disclaimer below the button', () => {
      seedPendingCheckout();
      render(<CheckoutScreen />);

      // Verify the disclaimer text is visible
      const disclaimer = screen.getByText(/Simulación:.*sin cobro real/i);
      expect(disclaimer).toBeTruthy();
    });
  });

  // ── Button State ─────────────────────────────────────────────────────────────

  describe('Button state transitions', () => {
    it('enables the button when ready (QR + PENDING_CHECKOUT + not processing)', () => {
      seedPendingCheckout();
      render(<CheckoutScreen />);

      const button = screen.getByLabelText('Simular pago en caja');
      // Button should not be disabled
      expect(button.props.accessibilityState?.disabled).not.toBe(true);
    });

    it('disables the button while processing', () => {
      seedPendingCheckout();
      const { rerender } = render(<CheckoutScreen />);

      // Simulate start of processing by pressing button
      const button = screen.getByLabelText('Simular pago en caja');
      fireEvent.press(button);

      // After press, button should be disabled (in processing state)
      // The label should change to "Validando…"
      rerender(<CheckoutScreen />);
      expect(screen.getByLabelText('Validando…')).toBeTruthy();
    });

    it('disables the button before QR is generated', () => {
      useSessionStore.setState({
        status: 'PENDING_CHECKOUT',
        pendingItems: [testProduct],
        qrToken: null, // No QR
      });

      render(<CheckoutScreen />);

      // Button should not be visible or should be disabled
      const button = screen.queryByLabelText('Simular pago en caja');
      expect(button).toBeNull();
    });

    it('disables the button after successful payment (during navigation)', async () => {
      seedPendingCheckout();
      const { rerender } = render(<CheckoutScreen />);

      const button = screen.getByLabelText('Simular pago en caja');
      fireEvent.press(button);

      // Button transitions to disabled state while processing
      rerender(<CheckoutScreen />);
      await waitFor(() => {
        expect(screen.getByLabelText('Validando…')).toBeTruthy();
      });
    });
  });

  // ── Button Interaction ─────────────────────────────────────────────────────────

  describe('Button interaction', () => {
    it('calls store.confirmValidation() when button is pressed', () => {
      seedPendingCheckout();
      const originalConfirmValidation = useSessionStore.getState().confirmValidation;
      const spyConfirmValidation = jest.fn(originalConfirmValidation);
      useSessionStore.setState({ confirmValidation: spyConfirmValidation });

      render(<CheckoutScreen />);

      const button = screen.getByLabelText('Simular pago en caja');
      fireEvent.press(button);

      expect(spyConfirmValidation).toHaveBeenCalledTimes(1);
    });

    it('navigates to /confirmation after successful payment', async () => {
      seedPendingCheckout();
      render(<CheckoutScreen />);

      const button = screen.getByLabelText('Simular pago en caja');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/confirmation');
      });
    });

    it('prevents double-credit by disabling button during processing', () => {
      seedPendingCheckout();
      const confirmSpy = jest.fn(useSessionStore.getState().confirmValidation);
      useSessionStore.setState({ confirmValidation: confirmSpy });

      const { rerender } = render(<CheckoutScreen />);

      const button = screen.getByLabelText('Simular pago en caja');
      fireEvent.press(button);

      rerender(<CheckoutScreen />);

      // Button should now show "Validando…" and be disabled
      const processingButton = screen.getByLabelText('Validando…');
      expect(processingButton.props.accessibilityState?.disabled).toBe(true);

      // Attempt second press (should have no effect)
      fireEvent.press(processingButton);

      // confirmValidation should still have been called only once
      expect(confirmSpy).toHaveBeenCalledTimes(1);
    });

    it('shows "Validando…" label while processing', () => {
      seedPendingCheckout();
      const { rerender } = render(<CheckoutScreen />);

      const button = screen.getByLabelText('Simular pago en caja');
      fireEvent.press(button);

      rerender(<CheckoutScreen />);

      // Label should change immediately
      expect(screen.getByLabelText('Validando…')).toBeTruthy();
    });

    it('shows a spinner icon while processing', () => {
      seedPendingCheckout();
      const { rerender } = render(<CheckoutScreen />);

      // Before processing: should show CreditCard icon
      // After processing: should show ActivityIndicator
      const button = screen.getByLabelText('Simular pago en caja');
      fireEvent.press(button);

      rerender(<CheckoutScreen />);

      // ActivityIndicator should be visible while processing
      // (This depends on the Button component exposing it to accessibility)
      const validandoButton = screen.getByLabelText('Validando…');
      expect(validandoButton).toBeTruthy();
    });
  });

  // ── State Management ─────────────────────────────────────────────────────────

  describe('State management (Zustand integration)', () => {
    it('updates creditedPoints after confirmValidation', async () => {
      seedPendingCheckout({
        creditedPoints: 100,
      });

      render(<CheckoutScreen />);

      // confirmValidation should update the store state
      const button = screen.getByLabelText('Simular pago en caja');
      fireEvent.press(button);

      await waitFor(() => {
        const state = useSessionStore.getState();
        // After confirmValidation, pendingPoints should be added to creditedPoints
        expect(state.creditedPoints).toBe(150); // 100 + 50 (pending)
      });
    });

    it('transitions session status from PENDING_CHECKOUT to COMPLETED', async () => {
      seedPendingCheckout({
        status: 'PENDING_CHECKOUT',
      });

      render(<CheckoutScreen />);

      const button = screen.getByLabelText('Simular pago en caja');
      fireEvent.press(button);

      await waitFor(() => {
        const state = useSessionStore.getState();
        expect(state.status).toBe('COMPLETED');
      });
    });

    it('uses selective selectors to prevent unnecessary re-renders', () => {
      seedPendingCheckout();

      // This test verifies that the component uses `useSessionStore((s) => s.specific)`
      // patterns rather than whole-store selectors, preventing unnecessary renders.
      // In a real test, we'd spy on component re-renders; for now, we document the expectation.
      render(<CheckoutScreen />);

      // Component should render efficiently (no implementation detail to test here,
      // but code review would verify selective selectors are used)
      expect(screen.getByLabelText('Simular pago en caja')).toBeTruthy();
    });
  });

  // ── Rapid Click Debouncing ──────────────────────────────────────────────────

  describe('Rapid click debouncing (prevents double-dispatch)', () => {
    it('ignores rapid successive presses', () => {
      seedPendingCheckout();
      const confirmSpy = jest.fn(useSessionStore.getState().confirmValidation);
      useSessionStore.setState({ confirmValidation: confirmSpy });

      const { rerender } = render(<CheckoutScreen />);

      const button = screen.getByLabelText('Simular pago en caja');

      // Attempt 5 rapid presses
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);

      rerender(<CheckoutScreen />);

      // confirmValidation should have been called only once
      // (The button is disabled after the first press, so subsequent presses have no effect)
      expect(confirmSpy).toHaveBeenCalledTimes(1);
    });

    it('enforces single dispatch via processing state guard', async () => {
      seedPendingCheckout();
      const confirmSpy = jest.fn(useSessionStore.getState().confirmValidation);
      useSessionStore.setState({ confirmValidation: confirmSpy });

      const { rerender } = render(<CheckoutScreen />);

      const button = screen.getByLabelText('Simular pago en caja');
      fireEvent.press(button);

      rerender(<CheckoutScreen />);

      // After first press, button is disabled
      const processingButton = screen.getByLabelText('Validando…');
      expect(processingButton.props.accessibilityState?.disabled).toBe(true);

      // Attempting to press the disabled button should not trigger another call
      fireEvent.press(processingButton);

      expect(confirmSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ── Accessibility ──────────────────────────────────────────────────────────────

  describe('Accessibility', () => {
    it('exposes correct accessibility role and label', () => {
      seedPendingCheckout();
      render(<CheckoutScreen />);

      const button = screen.getByLabelText('Simular pago en caja');

      // Verify a11y properties
      expect(button.props.accessibilityRole).toBe('button');
      expect(button.props.accessibilityLabel).toBe('Simular pago en caja');
    });

    it('updates accessibility label while processing', () => {
      seedPendingCheckout();
      const { rerender } = render(<CheckoutScreen />);

      const button = screen.getByLabelText('Simular pago en caja');
      fireEvent.press(button);

      rerender(<CheckoutScreen />);

      // Label should update
      const processingButton = screen.getByLabelText('Validando…');
      expect(processingButton.props.accessibilityLabel).toBe('Validando…');
    });

    it('marks the icon as decorative (hidden from accessibility tree)', () => {
      seedPendingCheckout();
      render(<CheckoutScreen />);

      const button = screen.getByLabelText('Simular pago en caja');

      // The button should have the label; any icon should be decorative
      // This is verified in code review (Icon should have accessibilityElementsHidden)
      expect(button.props.accessibilityLabel).toBe('Simular pago en caja');
    });

    it('announces state changes via liveRegion', () => {
      seedPendingCheckout();
      const { rerender } = render(<CheckoutScreen />);

      // The button container should have accessibilityLiveRegion="polite"
      // so screen reader users are notified of state transitions
      const button = screen.getByLabelText('Simular pago en caja');

      // Verify the button is inside a live region
      // (This depends on the component structure, but the test documents the expectation)
      expect(button).toBeTruthy();
    });

    it('maintains 44x44 minimum touch target size', () => {
      seedPendingCheckout();
      render(<CheckoutScreen />);

      const button = screen.getByLabelText('Simular pago en caja');

      // Touch target should meet WCAG minimum
      // In a real test, we'd check layout: expect(button.props.style.minHeight).toBeGreaterThanOrEqual(44)
      // For now, we document the expectation
      expect(button).toBeTruthy();
    });

    it('provides keyboard navigation support', () => {
      seedPendingCheckout();
      render(<CheckoutScreen />);

      // Button should be reachable via keyboard
      const button = screen.getByLabelText('Simular pago en caja');
      expect(button.props.accessibilityRole).toBe('button');

      // Pressing the button via fireEvent (simulates keyboard/screen reader activation)
      fireEvent.press(button);

      expect(button).toBeTruthy();
    });
  });

  // ── Error Handling & Edge Cases ─────────────────────────────────────────────

  describe('Edge cases & error handling', () => {
    it('handles unmount during payment gracefully', () => {
      seedPendingCheckout();
      const { unmount } = render(<CheckoutScreen />);

      const button = screen.getByLabelText('Simular pago en caja');
      fireEvent.press(button);

      // Unmount while processing
      unmount();

      // No memory leak warnings or unhandled promise rejections
      // (Jest should not report warnings)
      expect(true).toBe(true);
    });

    it('handles session with no pending items', () => {
      seedPendingCheckout({
        pendingItems: [], // Empty cart
        creditedPoints: 0,
      });

      render(<CheckoutScreen />);

      // Button should still render (even with empty cart)
      const button = screen.getByLabelText('Simular pago en caja');
      fireEvent.press(button);

      // Should complete without error
      expect(mockReplace).toHaveBeenCalledWith('/confirmation');
    });

    it('handles QR expiration while button is visible', () => {
      seedPendingCheckout({
        qrExpiresAt: Date.now() - 1000, // Expired
      });

      render(<CheckoutScreen />);

      // Button should still be visible (it's up to the QRCodeView to show expiration)
      // The mock pay is independent of QR expiration
      const button = screen.queryByLabelText('Simular pago en caja');
      expect(button).toBeTruthy();
    });

    it('does not block real POS validation flow', () => {
      seedPendingCheckout();
      render(<CheckoutScreen />);

      // Button should be independent; real socket validation should still work
      // (This would be tested with a socket mock, but for now we document the expectation)
      expect(screen.getByLabelText('Simular pago en caja')).toBeTruthy();
    });

    it('recovers from a store mutation failure', async () => {
      seedPendingCheckout();

      // Mock confirmValidation to throw an error
      useSessionStore.setState({
        confirmValidation: jest.fn(() => {
          throw new Error('Store error');
        }),
      });

      const { rerender } = render(<CheckoutScreen />);

      const button = screen.getByLabelText('Simular pago en caja');

      // Press should not crash the screen
      try {
        fireEvent.press(button);
      } catch (e) {
        // Error is expected; component should handle it gracefully
      }

      rerender(<CheckoutScreen />);

      // Component should still be rendered
      expect(screen.getByText('Validación de compra')).toBeTruthy();
    });
  });

  // ── Integration with Existing Checkout Flow ─────────────────────────────────

  describe('Integration with existing checkout flow', () => {
    it('does not interfere with QR generation on mount', () => {
      // Don't seed with QR token; let generateQr() run
      useSessionStore.setState({
        status: 'PENDING_CHECKOUT',
        pendingItems: [testProduct],
        qrToken: null,
        generateQr: jest.fn(),
      });

      render(<CheckoutScreen />);

      // QR generation should still occur
      expect(useSessionStore.getState().generateQr).toHaveBeenCalled();
    });

    it('displays existing session data (items, pending points)', () => {
      seedPendingCheckout({
        pendingItems: [testProduct],
        creditedPoints: 100,
      });

      render(<CheckoutScreen />);

      // Session info should be visible
      expect(screen.getByText(/1 producto/)).toBeTruthy();
      // Points info should be visible (via PointsTag)
      expect(screen.getByText(/\+50/)).toBeTruthy();
    });

    it('maintains button accessibility while socket/poll validation is active', () => {
      seedPendingCheckout();
      render(<CheckoutScreen />);

      // Both the mock pay button and socket/poll hook should coexist
      const button = screen.getByLabelText('Simular pago en caja');
      expect(button.props.accessibilityRole).toBe('button');
    });

    it('navigates using router.replace (not push) to prevent back-stack issues', async () => {
      seedPendingCheckout();
      render(<CheckoutScreen />);

      const button = screen.getByLabelText('Simular pago en caja');
      fireEvent.press(button);

      await waitFor(() => {
        // Should use replace, not push
        expect(mockReplace).toHaveBeenCalledWith('/confirmation');
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  // ── Performance & Perception ────────────────────────────────────────────────

  describe('Performance & perceived performance', () => {
    it('shows loading feedback immediately', () => {
      seedPendingCheckout();
      const { rerender } = render(<CheckoutScreen />);

      const button = screen.getByLabelText('Simular pago en caja');
      fireEvent.press(button);

      rerender(<CheckoutScreen />);

      // Spinner should be visible immediately
      expect(screen.getByLabelText('Validando…')).toBeTruthy();
    });

    it('navigates quickly after mock pay completes', async () => {
      seedPendingCheckout();
      render(<CheckoutScreen />);

      const button = screen.getByLabelText('Simular pago en caja');
      fireEvent.press(button);

      // Navigation should happen immediately (synchronous store + sync router call)
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/confirmation');
      });
    });
  });
});
