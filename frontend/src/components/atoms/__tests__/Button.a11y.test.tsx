/**
 * Accessibility test template — README §1.7 (Accessibility / @axe-core/react).
 * Co-located with the real component (../Button.tsx).
 *
 * Automated check that the component renders with no critical a11y violations.
 * Complement with manual VoiceOver (iOS) / TalkBack (Android) passes.
 *
 * NOTE: Design-deliverable template. Wire the real component + axe runner once
 * @axe-core/react is configured in jest.setup.ts.
 */
import { render } from '@testing-library/react-native';

// TODO: import the real component once finalized:
// import { Button } from '../Button';

describe('Button — accessibility', () => {
  it('exposes an accessible role and label', () => {
    // const { getByRole } = render(<Button label="Confirmar" onPress={jest.fn()} />);
    // const node = getByRole('button', { name: 'Confirmar' });
    // expect(node).toBeOnTheScreen();
    expect(true).toBe(true); // placeholder until component is wired
  });

  it.todo('has no critical axe violations (assert results.violations is empty)');
  it.todo('meets the minimum 44x44 touch target size');
  it.todo('keeps a visible focus/pressed state for keyboard & switch control');
});

void render;
