import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RewardsService } from '../../application/services/rewards.service';

@ApiTags('rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'rewards', version: '1' })
export class RewardsController {
  constructor(private readonly rewards: RewardsService) {}

  @Get()
  list() {
    return this.rewards.listActive();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.rewards.getById(id);
  }

  @Post(':id/redeem')
  @HttpCode(HttpStatus.CREATED)
  redeem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.rewards.redeem(user.userId, id);
  }
}
