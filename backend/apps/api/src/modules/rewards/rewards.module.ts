import { Module } from '@nestjs/common';
import { RewardsService } from './application/services/rewards.service';
import { RewardsController } from './presentation/controllers/rewards.controller';

@Module({
  controllers: [RewardsController],
  providers: [RewardsService],
})
export class RewardsModule {}
