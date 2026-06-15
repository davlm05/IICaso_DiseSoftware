import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
  ValidateSessionRequestSchema,
  type ValidateSessionRequest,
} from '@smartcart/shared-types';
import { RequireApiKey } from '../../../../common/decorators/api-key.decorator';
import { ApiKeyGuard } from '../../../../common/guards/api-key.guard';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe';
import { CheckoutService } from '../../application/services/checkout.service';

/**
 * POS validation endpoint (README §2.4, §2.8 Workflow 1). Authenticated by a
 * POS API key (x-api-key header), NOT a shopper JWT.
 */
@ApiTags('pos')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@RequireApiKey('POS')
@Controller({ path: 'sessions', version: '1' })
export class ValidationController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post(':id/validate')
  @HttpCode(HttpStatus.OK)
  validate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(ValidateSessionRequestSchema))
    dto: ValidateSessionRequest,
  ) {
    return this.checkout.validateSession(id, dto);
  }
}
