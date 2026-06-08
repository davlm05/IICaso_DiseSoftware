/**
 * Integration test template — README §1.7 (Integration / React Native Testing
 * Library 12.8). Co-located with the real component (../ScanConfirmationModal.tsx).
 *
 * Render the component, drive it with fireEvent/userEvent, and assert via
 * accessibility queries (getByRole / getByLabelText). The API layer is mocked.
 *
 * NOTE: Design-deliverable template. Align the props and the role/label selectors
 * below with the real ScanConfirmationModal implementation, then enable the tests.
 */
import { render, screen, fireEvent } from '@testing-library/react-native';

// TODO: import the real component once its props are finalized:
// import { ScanConfirmationModal } from '../ScanConfirmationModal';

const product = { sku: '7441234567890', name: 'Café 1kg', points: 50 };

describe('ScanConfirmationModal', () => {
  it('shows the scanned product and its points', () => {
    // render(<ScanConfirmationModal visible product={product} onConfirm={jest.fn()} onCancel={jest.fn()} />);
    // expect(screen.getByText(product.name)).toBeOnTheScreen();
    // expect(screen.getByText(`+${product.points}`)).toBeOnTheScreen();
    expect(product.points).toBe(50); // placeholder until component is wired
  });

  it('calls onConfirm when the confirm button is pressed', () => {
    const onConfirm = jest.fn();
    // render(<ScanConfirmationModal visible product={product} onConfirm={onConfirm} onCancel={jest.fn()} />);
    // fireEvent.press(screen.getByRole('button', { name: /confirmar/i }));
    onConfirm(); // placeholder for the fireEvent.press above
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it.todo('calls onCancel and does not credit points when dismissed');
  it.todo('exposes an accessible label on the confirm action (getByLabelText)');
});

// Silence the unused import until the real render() calls are enabled.
void render;
void screen;
void fireEvent;
