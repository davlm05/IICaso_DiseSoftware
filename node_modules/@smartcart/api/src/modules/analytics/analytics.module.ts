import { Module } from '@nestjs/common';
import { AnalyticsService } from './application/services/analytics.service';
import { AnalyticsController } from './presentation/controllers/analytics.controller';

/** B2B analytics module (README §2.8 Workflow 2 consumption). */
@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
