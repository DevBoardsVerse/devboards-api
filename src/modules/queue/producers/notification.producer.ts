import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  QUEUES,
  JOBS,
  InviteEmailJobPayload,
  TaskAssignedEmailJobPayload,
} from '../queue.constants';

@Injectable()
export class NotificationProducer {
  private readonly logger = new Logger(NotificationProducer.name);

  constructor(
    // @InjectQueue injects the BullMQ Queue instance for this queue name
    @InjectQueue(QUEUES.NOTIFICATIONS)
    private notificationsQueue: Queue,
  ) {}

  async sendInviteEmail(payload: InviteEmailJobPayload): Promise<void> {
    await this.notificationsQueue.add(JOBS.SEND_INVITE_EMAIL, payload, {
      attempts: 3,           // retry up to 3 times on failure
      backoff: {
        type: 'exponential', // wait 2s, 4s, 8s between retries
        delay: 2000,
      },
      removeOnComplete: 100, // keep last 100 completed jobs for debugging
      removeOnFail: 200,     // keep last 200 failed jobs for inspection
    });

    this.logger.log(`Queued invite email for ${payload.recipientEmail}`);
  }

  async sendTaskAssignedEmail(
    payload: TaskAssignedEmailJobPayload,
  ): Promise<void> {
    await this.notificationsQueue.add(
      JOBS.SEND_TASK_ASSIGNED_EMAIL,
      payload,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    );

    this.logger.log(
      `Queued task assigned email for ${payload.recipientEmail}`,
    );
  }
}