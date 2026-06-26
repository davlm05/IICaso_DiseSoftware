import {
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  MockPayResponse,
  QrTicketResponse,
} from '@smartcart/shared-types';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../../common/decorators/current-user.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { ResourceOwnershipGuard } from '../../../../common/guards/resource-ownership.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { CheckoutService } from '../../application/services/checkout.service';

/**
 * QR generation endpoint (README §2.4 POST /sessions/:id/qr, §2.8 Workflow 4.5).
 * Finalizes the session and returns the signed, 10-minute checkout token.
 */
@ApiTags('sessions')
@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')
export class QrController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post(':id/qr')
  @UseGuards(ResourceOwnershipGuard)
  generate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QrTicketResponse> {
    return this.checkout.generateQr(id, user.sub);
  }

  /**
   * Mock checkout (backend spec §3). Completes a PENDING_CHECKOUT session the
   * caller owns, credits the frozen points and returns the new balance — reusing
   * the real validation transaction boundary without the POS API key. Gated by
   * `MOCK_PAY_ENABLED` in the service (404 when off), so it never substitutes for
   * the API-key-scoped POS path `POST /sessions/:id/validate` in production.
   */
  @Post(':id/qr/pay')
  @UseGuards(ResourceOwnershipGuard)
  @ApiOperation({
    summary: 'Mock checkout (dev/demo only — disabled in production)',
  })
  mockPay(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MockPayResponse> {
    return this.checkout.mockPay(id, user.sub);
  }
}
