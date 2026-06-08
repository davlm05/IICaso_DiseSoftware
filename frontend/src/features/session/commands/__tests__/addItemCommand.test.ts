/**
 * Unit test template — README §1.7 (Unit / Jest 29 + jest-expo).
 *
 * Pure-logic test for a Command object with execute/undo (Command pattern) and
 * the points rules. No rendering, all dependencies mocked.
 *
 * NOTE: Design-deliverable template. Wire the import below to the real command
 * once `/features/session/commands/` is implemented, then flesh out assertions.
 */

// TODO: import the real command + store once implemented, e.g.:
// import { AddItemCommand } from '../addItemCommand';
// import { createSessionStore } from '../../../../store/sessionStore';

type PendingItem = { sku: string; name: string; points: number };

// Minimal in-memory stand-in for the session store so the template runs.
// Replace with the real Zustand store / mock in the actual implementation.
function makeFakeSession() {
  const pending: PendingItem[] = [];
  return {
    getPending: () => [...pending],
    add: (item: PendingItem) => pending.push(item),
    removeLast: () => pending.pop(),
    totalPoints: () => pending.reduce((sum, i) => sum + i.points, 0),
  };
}

const PRODUCT: PendingItem = { sku: '7441234567890', name: 'Café 1kg', points: 50 };

describe('AddItemCommand', () => {
  it('execute() adds the item to the pending list and credits its points', () => {
    const session = makeFakeSession();

    // const cmd = new AddItemCommand(session, PRODUCT);
    // cmd.execute();
    session.add(PRODUCT); // placeholder for cmd.execute()

    expect(session.getPending()).toHaveLength(1);
    expect(session.totalPoints()).toBe(50);
  });

  it('undo() reverts the item and its points (Command + undo)', () => {
    const session = makeFakeSession();

    // const cmd = new AddItemCommand(session, PRODUCT);
    // cmd.execute();
    // cmd.undo();
    session.add(PRODUCT); // cmd.execute()
    session.removeLast(); // cmd.undo()

    expect(session.getPending()).toHaveLength(0);
    expect(session.totalPoints()).toBe(0);
  });

  it.todo('does not double-count points when the same item is scanned twice');
  it.todo('applies sponsored-product point multipliers from the points rules');
});
