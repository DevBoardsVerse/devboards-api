import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { NotificationProcessor } from './processors/notification.processor';
import { NotificationProducer } from './producers/notification.producer';
import { QUEUES } from './queue.constants';
import { MailModule } from '../mail/mail.module';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.getOrThrow<string>('redis.host'),
          port: config.getOrThrow<number>('redis.port'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }),
    }),
    // Register specific queues
    BullModule.registerQueue({
      name: QUEUES.NOTIFICATIONS,
    }),
    MailModule,
  ],
  providers: [NotificationProcessor, NotificationProducer],
  exports: [NotificationProducer],
})
export class QueueModule {}