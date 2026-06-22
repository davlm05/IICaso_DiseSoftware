import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import {
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { QueueMetricsService } from '../queues/queue-metrics.service';
import { ANALYTICS_QUEUE } from '../queues/queue.config';
import { BusinessMetricsService } from './business-metrics.service';

/**
 * Observability metrics (README §2.6). Registers `/metrics`, the default process
 * metrics, and the custom business/queue metrics. Global so any module can
 * inject `BusinessMetricsService`.
 */
@Global()
@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
    BullModule.registerQueue({ name: ANALYTICS_QUEUE }),
  ],
  providers: [
    makeCounterProvider({
      name: 'smartcart_checkout_completions_total',
      help: 'Total completed checkout validations',
    }),
    makeHistogramProvider({
      name: 'smartcart_points_awarded',
      help: 'Points awarded per checkout',
      buckets: [0, 10, 25, 50, 100, 250, 500, 1000],
    }),
    makeCounterProvider({
      name: 'smartcart_qr_generations_total',
      help: 'Total checkout QR codes generated',
    }),
    makeGaugeProvider({
      name: 'smartcart_bullmq_queue_depth',
      help: 'Number of waiting jobs per BullMQ queue',
      labelNames: ['queue'],
    }),
    BusinessMetricsService,
    QueueMetricsService,
  ],
  exports: [BusinessMetricsService, QueueMetricsService],
})
export class MetricsModule {}
