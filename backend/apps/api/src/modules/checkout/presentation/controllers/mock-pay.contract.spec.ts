import { MockPayResponseSchema } from '@smartcart/shared-types';

/**
 * Contract tests for MockPayResponse (README §2.9 CI/CD, backend spec §4).
 * Validates that the response DTO conforms to the shared Zod schema,
 * is JSON-serializable, and includes all required fields.
 */
describe('MockPayResponse — Contract (README §2.9)', () => {
  describe('MockPayResponseSchema validation', () => {
    it('validates a valid mock pay response', () => {
      const response = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'COMPLETED',
        pointsAwarded: 150,
        newBalance: 700,
        mock: true,
      };

      expect(() => MockPayResponseSchema.parse(response)).not.toThrow();
    });

    it('accepts zero points awarded', () => {
      const response = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'COMPLETED',
        pointsAwarded: 0,
        newBalance: 500,
        mock: true,
      };

      const parsed = MockPayResponseSchema.parse(response);
      expect(parsed.pointsAwarded).toBe(0);
    });

    it('accepts negative newBalance (e.g., after redemption)', () => {
      const response = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'COMPLETED',
        pointsAwarded: 50,
        newBalance: -10,
        mock: true,
      };

      const parsed = MockPayResponseSchema.parse(response);
      expect(parsed.newBalance).toBe(-10);
    });

    it('rejects if mock is not exactly true', () => {
      const response = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'COMPLETED',
        pointsAwarded: 150,
        newBalance: 700,
        mock: false,
      };

      expect(() => MockPayResponseSchema.parse(response)).toThrow();
    });

    it('rejects if status is not a valid SessionStatus', () => {
      const response = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'INVALID_STATUS',
        pointsAwarded: 150,
        newBalance: 700,
        mock: true,
      };

      expect(() => MockPayResponseSchema.parse(response)).toThrow();
    });

    it('rejects if sessionId is not a valid UUID', () => {
      const response = {
        sessionId: 'not-a-uuid',
        status: 'COMPLETED',
        pointsAwarded: 150,
        newBalance: 700,
        mock: true,
      };

      expect(() => MockPayResponseSchema.parse(response)).toThrow();
    });

    it('rejects if pointsAwarded is negative', () => {
      const response = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'COMPLETED',
        pointsAwarded: -1,
        newBalance: 700,
        mock: true,
      };

      expect(() => MockPayResponseSchema.parse(response)).toThrow();
    });

    it('rejects if pointsAwarded is not an integer', () => {
      const response = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'COMPLETED',
        pointsAwarded: 150.5,
        newBalance: 700,
        mock: true,
      };

      expect(() => MockPayResponseSchema.parse(response)).toThrow();
    });

    it('rejects if required field is missing', () => {
      const incomplete = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'COMPLETED',
        pointsAwarded: 150,
        newBalance: 700,
        // mock is missing
      };

      expect(() => MockPayResponseSchema.parse(incomplete)).toThrow();
    });

    it('rejects if sessionId is missing', () => {
      const incomplete = {
        // sessionId is missing
        status: 'COMPLETED',
        pointsAwarded: 150,
        newBalance: 700,
        mock: true,
      };

      expect(() => MockPayResponseSchema.parse(incomplete)).toThrow();
    });

    it('rejects if status is missing', () => {
      const incomplete = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        // status is missing
        pointsAwarded: 150,
        newBalance: 700,
        mock: true,
      };

      expect(() => MockPayResponseSchema.parse(incomplete)).toThrow();
    });

    it('strips extra fields by default', () => {
      const withExtra = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'COMPLETED',
        pointsAwarded: 150,
        newBalance: 700,
        mock: true,
        extraField: 'should-be-rejected',
      };

      const parsed = MockPayResponseSchema.parse(withExtra);
      expect(parsed).not.toHaveProperty('extraField');
    });
  });

  describe('JSON serialization', () => {
    it('serializes to JSON without errors', () => {
      const response = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'COMPLETED',
        pointsAwarded: 150,
        newBalance: 700,
        mock: true,
      };

      expect(() => JSON.stringify(response)).not.toThrow();
    });

    it('round-trips through JSON serialization', () => {
      const original = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'COMPLETED',
        pointsAwarded: 150,
        newBalance: 700,
        mock: true,
      };

      const json = JSON.stringify(original);
      const parsed = JSON.parse(json);

      expect(() => MockPayResponseSchema.parse(parsed)).not.toThrow();
      expect(parsed).toEqual(original);
    });

    it('has no circular references', () => {
      const response = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'COMPLETED',
        pointsAwarded: 150,
        newBalance: 700,
        mock: true,
      };

      const json = JSON.stringify(response);
      expect(typeof json).toBe('string');
      expect(json).toContain('COMPLETED');
    });

    it('has no undefined values', () => {
      const response = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'COMPLETED',
        pointsAwarded: 150,
        newBalance: 700,
        mock: true,
      };

      const json = JSON.stringify(response);
      expect(json).not.toContain('undefined');
    });
  });

  describe('Type inference', () => {
    it('infers MockPayResponse type correctly', () => {
      const response = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'COMPLETED' as const,
        pointsAwarded: 150,
        newBalance: 700,
        mock: true as const,
      };

      const validated = MockPayResponseSchema.parse(response);

      // Verify type properties
      expect(validated).toHaveProperty('sessionId');
      expect(validated).toHaveProperty('status');
      expect(validated).toHaveProperty('pointsAwarded');
      expect(validated).toHaveProperty('newBalance');
      expect(validated).toHaveProperty('mock');

      // Verify types
      expect(typeof validated.sessionId).toBe('string');
      expect(typeof validated.status).toBe('string');
      expect(typeof validated.pointsAwarded).toBe('number');
      expect(typeof validated.newBalance).toBe('number');
      expect(typeof validated.mock).toBe('boolean');
    });
  });

  describe('Valid SessionStatus values', () => {
    it('accepts COMPLETED status', () => {
      const response = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'COMPLETED',
        pointsAwarded: 150,
        newBalance: 700,
        mock: true,
      };

      expect(() => MockPayResponseSchema.parse(response)).not.toThrow();
    });

    // NOTE: mockPay only returns COMPLETED status. Including for completeness.
    // Other SessionStatus values (ACTIVE, PENDING_CHECKOUT, VALIDATION_FAILED, EXPIRED)
    // should not be returned by mockPay.
  });

  describe('Edge cases', () => {
    it('handles large pointsAwarded values', () => {
      const response = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'COMPLETED',
        pointsAwarded: Number.MAX_SAFE_INTEGER,
        newBalance: Number.MAX_SAFE_INTEGER,
        mock: true,
      };

      expect(() => MockPayResponseSchema.parse(response)).not.toThrow();
    });

    it('handles large negative newBalance', () => {
      const response = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'COMPLETED',
        pointsAwarded: 100,
        newBalance: Number.MIN_SAFE_INTEGER,
        mock: true,
      };

      expect(() => MockPayResponseSchema.parse(response)).not.toThrow();
    });

    it('rejects non-integer pointsAwarded in strictest validation', () => {
      // Zod coerces floats to int with .int(), but let's verify explicit float is rejected
      const response = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'COMPLETED',
        pointsAwarded: 150.9999,
        newBalance: 700,
        mock: true,
      };

      expect(() => MockPayResponseSchema.parse(response)).toThrow();
    });
  });
});
