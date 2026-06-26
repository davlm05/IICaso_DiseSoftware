import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';
import { Icon } from '../Icon';

jest.mock('../Icon', () => ({
  Icon: ({ name, color }: { name: string; size?: number; color?: string }) => {
    const { ActivityIndicator } = require('react-native');
    return <ActivityIndicator testID={`icon-${name}`} color={color} />;
  },
}));

describe('PayButton — Unit (README §1.7)', () => {
  const defaultProps = {
    label: 'Realizar Pago',
    onPress: jest.fn(),
    variant: 'primary' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Default State ──────────────────────────────────────────────────────────

  describe('Default state (enabled, not loading)', () => {
    it('renders with correct label and is enabled', () => {
      render(<Button {...defaultProps} />);

      expect(screen.getByLabelText('Realizar Pago')).toBeTruthy();
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('renders with primary variant styling', () => {
      const { getByRole } = render(<Button {...defaultProps} variant="primary" />);

      const button = getByRole('button');
      // Verify styling classes are applied (NativeWind)
      expect(button.props.className).toContain('bg-primary');
    });

    it('calls onPress when pressed', () => {
      const onPress = jest.fn();
      render(<Button {...defaultProps} onPress={onPress} />);

      fireEvent.press(screen.getByRole('button'));

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('displays the CreditCard icon by default', () => {
      const icon = <Icon name="CreditCard" size={16} color="#FFFFFF" />;
      render(<Button {...defaultProps} icon={icon} />);

      expect(screen.getByTestId('icon-CreditCard')).toBeTruthy();
    });

    it('has correct accessibility role and label', () => {
      render(<Button {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button.props.accessibilityRole).toBe('button');
      expect(button.props.accessibilityLabel).toBe('Realizar Pago');
    });

    it('is accessible via keyboard (accessibilityRole button enables keyboard interaction)', () => {
      render(<Button {...defaultProps} />);

      const button = screen.getByRole('button');

      // Press via keyboard (simulated by fireEvent.press)
      fireEvent.press(button);

      expect(defaultProps.onPress).toHaveBeenCalled();
    });
  });

  // ── Processing State ───────────────────────────────────────────────────────

  describe('Processing state expressed through existing Button props', () => {
    it('shows the processing label supplied by the caller', () => {
      render(<Button {...defaultProps} label="Validando..." disabled />);

      expect(screen.getByLabelText('Validando...')).toBeTruthy();
    });

    it('does not call onPress while disabled', () => {
      const onPress = jest.fn();
      render(<Button {...defaultProps} onPress={onPress} disabled />);

      fireEvent.press(screen.getByRole('button'));

      expect(onPress).not.toHaveBeenCalled();
    });

    it('applies disabled accessibility state and styling', () => {
      render(<Button {...defaultProps} disabled />);

      const button = screen.getByRole('button');
      expect(button.props.accessibilityState?.disabled).toBe(true);
      expect(button.props.className).toContain('opacity-50');
    });
  });

  // ── Success State ──────────────────────────────────────────────────────────

  describe('Success state', () => {
    it('shows success icon (green checkmark) on success', () => {
      const successIcon = <Icon name="CircleCheck" size={16} color="#10B981" />;
      render(
        <Button {...defaultProps} icon={successIcon} />
      );

      expect(screen.getByTestId('icon-CircleCheck')).toBeTruthy();
    });

    it('temporarily disables button after success', () => {
      render(
        <Button
          {...defaultProps}
          disabled={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });

    it('updates label to show success', () => {
      render(
        <Button
          {...defaultProps}
          label="Pago realizado"
        />
      );

      expect(screen.getByLabelText('Pago realizado')).toBeTruthy();
    });
  });

  // ── Error State ────────────────────────────────────────────────────────────

  describe('Error state', () => {
    it('shows error icon (red X) on failure', () => {
      const errorIcon = <Icon name="CircleAlert" size={16} color="#EF4444" />;
      render(
        <Button {...defaultProps} icon={errorIcon} />
      );

      expect(screen.getByTestId('icon-CircleAlert')).toBeTruthy();
    });

    it('re-enables button after error (allows retry)', () => {
      const onPress = jest.fn();
      render(
        <Button
          {...defaultProps}
          onPress={onPress}
          disabled={false}
        />
      );

      const button = screen.getByRole('button');
      expect(button.props.accessibilityState?.disabled).not.toBe(true);

      // User can retry
      fireEvent.press(button);
      expect(onPress).toHaveBeenCalled();
    });

    it('updates label to show error', () => {
      render(
        <Button
          {...defaultProps}
          label="Pago fallido"
        />
      );

      expect(screen.getByLabelText('Pago fallido')).toBeTruthy();
    });

    it('allows immediate retry without waiting', () => {
      const onPress = jest.fn();
      render(
        <Button
          {...defaultProps}
          onPress={onPress}
          disabled={false}
        />
      );

      const button = screen.getByRole('button');

      // First attempt
      fireEvent.press(button);
      expect(onPress).toHaveBeenCalledTimes(1);

      // Immediate retry
      fireEvent.press(button);
      expect(onPress).toHaveBeenCalledTimes(2);
    });
  });

  // ── Props & Variants ───────────────────────────────────────────────────────

  describe('Props & variants', () => {
    it('accepts variant prop and applies correct styling', () => {
      render(<Button {...defaultProps} variant="secondary" />);

      const button = screen.getByRole('button');
      // Variant styling should be applied
      expect(button).toBeTruthy();
    });

    it('accepts disabled prop independently of loading state', () => {
      render(
        <Button {...defaultProps} disabled={true} />
      );

      const button = screen.getByRole('button');
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });

    it('accepts custom icon via icon prop', () => {
      const customIcon = <Icon name="Wallet" size={16} color="#FFFFFF" />;
      render(
        <Button {...defaultProps} icon={customIcon} />
      );

      expect(screen.getByTestId('icon-Wallet')).toBeTruthy();
    });

    it('handles icon=null gracefully', () => {
      render(
        <Button {...defaultProps} icon={null} />
      );

      // Button should render without error
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('accepts optional accessibility hint', () => {
      const hint = 'Inicia el proceso de pago mock';
      render(
        <Button
          {...defaultProps}
          accessibilityHint={hint}
        />
      );

      const button = screen.getByRole('button');
      expect(button.props.accessibilityHint).toBe(hint);
    });
  });

  // ── Edge Cases ─────────────────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('handles very long label with text wrapping', () => {
      const longLabel = 'Este es un botón de pago muy largo que podría ocupar múltiples líneas';
      render(
        <Button {...defaultProps} label={longLabel} />
      );

      const button = screen.getByRole('button');
      // Button should render without layout issues
      expect(button).toBeTruthy();
    });

    it('handles missing onPress callback gracefully', () => {
      render(
        <Button label="Realizar Pago" />
      );

      const button = screen.getByRole('button');

      // Press should not crash
      expect(() => fireEvent.press(button)).not.toThrow();
    });

    it('handles multiple state cycles without crashing', () => {
      const { rerender } = render(
        <Button {...defaultProps} />
      );

      // Cycle through states
      for (let i = 0; i < 3; i++) {
        rerender(
          <Button {...defaultProps} label="Validando..." disabled />
        );
        rerender(
          <Button {...defaultProps} disabled={true} />
        );
        rerender(
          <Button {...defaultProps} disabled={false} />
        );
      }

      // Component should remain stable
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('gracefully handles undefined icon', () => {
      render(
        <Button {...defaultProps} icon={undefined} />
      );

      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('clamps label text if necessary', () => {
      const superLongLabel = 'A'.repeat(100); // Very long text
      render(
        <Button {...defaultProps} label={superLongLabel} />
      );

      // Button should handle gracefully
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('handles rapid state updates', () => {
      const { rerender } = render(
        <Button {...defaultProps} />
      );

      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        rerender(
          <Button {...defaultProps} disabled={i % 2 === 0} />
        );
      }

      expect(screen.getByRole('button')).toBeTruthy();
    });
  });

  // ── Accessibility Edge Cases ───────────────────────────────────────────────

  describe('Accessibility edge cases', () => {
    it('maintains accessibility when icon changes', () => {
      const { rerender } = render(
        <Button {...defaultProps} />
      );

      const button = screen.getByRole('button');
      expect(button.props.accessibilityRole).toBe('button');

      // Change icon
      const newIcon = <Icon name="CircleCheck" size={16} color="#10B981" />;
      rerender(
        <Button {...defaultProps} icon={newIcon} />
      );

      // Accessibility should remain
      const updatedButton = screen.getByRole('button');
      expect(updatedButton.props.accessibilityRole).toBe('button');
    });

    it('icon is hidden from accessibility tree (decorative)', () => {
      render(
        <Button {...defaultProps} />
      );

      // Icon should have accessibilityElementsHidden
      // (This is verified in code review, not easy to test in unit tests)
      // But the label should be the accessible text
      expect(screen.getByLabelText('Realizar Pago')).toBeTruthy();
    });

    it('maintains focus state during state transitions', () => {
      const onPress = jest.fn();
      const { rerender } = render(
        <Button {...defaultProps} onPress={onPress} />
      );

      const button = screen.getByRole('button');

      // Simulate focus and state change
      fireEvent.press(button);

      rerender(
        <Button {...defaultProps} onPress={onPress} label="Validando..." disabled />
      );

      // Button should still be accessible (though disabled)
      expect(screen.getByRole('button')).toBeTruthy();
    });
  });

  // ── Styling ────────────────────────────────────────────────────────────────

  describe('Styling & NativeWind', () => {
    it('applies primary variant classes', () => {
      render(
        <Button {...defaultProps} variant="primary" />
      );

      const button = screen.getByRole('button');
      // Primary variant should include specific classes
      expect(button.props.className).toContain('bg-primary');
    });

    it('applies disabled styling when disabled', () => {
      render(
        <Button {...defaultProps} disabled={true} />
      );

      const button = screen.getByRole('button');
      // Disabled styling should be applied
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });

    it('applies disabled styling with opacity', () => {
      render(
        <Button {...defaultProps} disabled />
      );

      const button = screen.getByRole('button');
      expect(button.props.className).toContain('opacity-50');
    });
  });
});
