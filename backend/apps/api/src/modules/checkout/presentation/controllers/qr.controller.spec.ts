import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { MockPayResponse } from '@smartcart/shared-types';
import { CheckoutService } from '../../application/services/checkout.service';
import type { AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';
import { QrController } from './qr.controller';

/**
 * Unit tests for QrController.mockPay() (README §2.9 CI/CD, backend spec §3).
 * Tests the HTTP handler for POST /sessions/:id/qr/pay without database access.
 */
describe('QrController — mockPay (README §2.9)', () => {
  let controller: QrController;
  let checkoutService: CheckoutService;

  beforeEach(() => {
    checkoutService = {
      mockPay: jest.fn(),
    } as any;
    controller = new QrController(checkoutService);
  });

  describe('POST :id/qr/pay', () => {
    const user: AuthenticatedUser = {
      sub: 'user-uuid-123',
      role: 'USER',
    };
    const sessionId = '550e8400-e29b-41d4-a716-446655440000';

    it('returns 200 with { status: COMPLETED, pointsAwarded, newBalance, mock: true }', async () => {
      const response: MockPayResponse = {
        sessionId,
        status: 'COMPLETED',
        pointsAwarded: 150,
        newBalance: 700,
        mock: true,
      };
      jest.spyOn(checkoutService, 'mockPay').mockResolvedValue(response);

      const result = await controller.mockPay(user, sessionId);

      expect(result).toEqual(response);
      expect(result.status).toBe('COMPLETED');
      expect(result.mock).toBe(true);
      expect(checkoutService.mockPay).toHaveBeenCalledWith(sessionId, user.sub);
    });

    it('throws NotFoundException when MOCK_PAY_ENABLED is false', async () => {
      jest
        .spyOn(checkoutService, 'mockPay')
        .mockRejectedValue(new NotFoundException('Session not found.'));

      await expect(controller.mockPay(user, sessionId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when session owner does not match JWT sub', async () => {
      jest
        .spyOn(checkoutService, 'mockPay')
        .mockRejectedValue(
          new ForbiddenException('You do not own this session.'),
        );

      await expect(controller.mockPay(user, sessionId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when session is not found', async () => {
      jest
        .spyOn(checkoutService, 'mockPay')
        .mockRejectedValue(new NotFoundException('Session not found.'));

      await expect(controller.mockPay(user, sessionId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('delegates to checkoutService.mockPay with correct arguments', async () => {
      const response: MockPayResponse = {
        sessionId,
        status: 'COMPLETED',
        pointsAwarded: 100,
        newBalance: 500,
        mock: true,
      };
      jest.spyOn(checkoutService, 'mockPay').mockResolvedValue(response);

      await controller.mockPay(user, sessionId);

      expect(checkoutService.mockPay).toHaveBeenCalledTimes(1);
      expect(checkoutService.mockPay).toHaveBeenCalledWith(
        sessionId,
        'user-uuid-123',
      );
    });
  });
});
