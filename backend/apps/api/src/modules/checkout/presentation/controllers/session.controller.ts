import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AddItemRequestSchema,
  CreateSessionRequestSchema,
  type AddItemRequest,
  type CreateSessionRequest,
} from '@smartcart/shared-types';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe';
import { CheckoutService } from '../../application/services/checkout.service';

/** Shopper-facing session endpoints (README §2.4). All require JWT. */
@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'sessions', version: '1' })
export class SessionController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateSessionRequestSchema))
    dto: CreateSessionRequest,
  ) {
    return this.checkout.createSession(user.userId, dto.storeId);
  }

  @Get('active')
  async active(@CurrentUser() user: AuthenticatedUser) {
    const session = await this.checkout.getActive(user.userId);
    if (!session) throw new NotFoundException('No active session');
    return session;
  }

  @Get(':id')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.checkout.getById(user.userId, id);
  }

  @Post(':id/items')
  addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(AddItemRequestSchema)) dto: AddItemRequest,
  ) {
    return this.checkout.addItem(user.userId, id, dto.barcode, dto.quantity);
  }

  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.OK)
  removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.checkout.removeItem(user.userId, id, itemId);
  }
}
