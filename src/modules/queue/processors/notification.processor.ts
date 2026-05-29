import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService } from '../../mail/mail.service';
import {
  QUEUES,
  JOBS,
  InviteEmailJobPayload,
  TaskAssignedEmailJobPayload,
} from '../queue.constants';

// @Processor tells NestJS this class handles jobs from the NOTIFICATIONS queue
@Processor(QUEUES.NOTIFICATIONS)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private mailService: MailService) {
    super();
  }

  // process() is called automatically when a job is dequeued
  // BullMQ passes the full Job object — job.name tells you which job type
  // job.data contains the typed payload
  async process(job: Job): Promise<void> {
    this.logger.log(`Processing job: ${job.name} [id: ${job.id}]`);

    switch (job.name) {
      case JOBS.SEND_INVITE_EMAIL:
        await this.handleInviteEmail(job.data as InviteEmailJobPayload);
        break;

      case JOBS.SEND_TASK_ASSIGNED_EMAIL:
        await this.handleTaskAssignedEmail(
          job.data as TaskAssignedEmailJobPayload,
        );
        break;

      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async handleInviteEmail(data: InviteEmailJobPayload): Promise<void> {
  try {
    await this.mailService.sendInviteEmail(data);
    this.logger.log(`Invite email processed for ${data.recipientEmail}`);
  } catch (err) {
    this.logger.error(`Failed to send invite email to ${data.recipientEmail}`, err);
    throw err; // rethrow so BullMQ marks job as failed
  }
}

  private async handleTaskAssignedEmail(
    data: TaskAssignedEmailJobPayload,
  ): Promise<void> {
    await this.mailService.sendTaskAssignedEmail(data);
    this.logger.log(
      `Task assigned email processed for ${data.recipientEmail}`,
    );
  }
}