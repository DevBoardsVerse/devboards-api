import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(private config: ConfigService) {
    // Create reusable transporter — one connection, used for all emails
    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('MAIL_HOST'),
      port: this.config.getOrThrow<number>('MAIL_PORT'),
      auth: {
        user: this.config.getOrThrow<string>('MAIL_USER'),
        pass: this.config.getOrThrow<string>('MAIL_PASS'),
      },
    });
  }

  async sendInviteEmail(params: {
    recipientEmail: string;
    recipientName: string;
    organizationName: string;
    inviterName: string;
    role: string;
  }): Promise<void> {
    const { recipientEmail, recipientName, organizationName, inviterName, role } = params;

    await this.transporter.sendMail({
      from: this.config.get<string>('MAIL_FROM'),
      to: recipientEmail,
      subject: `You've been invited to ${organizationName} on DevBoard`,
      // Plain text fallback
      text: `
        Hi ${recipientName},

        ${inviterName} has invited you to join ${organizationName} as a ${role}.

        Log in to DevBoard to get started.

        The DevBoard Team
      `,
      // HTML version
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to ${organizationName}</h2>
          <p>Hi <strong>${recipientName}</strong>,</p>
          <p>
            <strong>${inviterName}</strong> has invited you to join
            <strong>${organizationName}</strong> as a <strong>${role}</strong>.
          </p>
          <p>Log in to DevBoard to get started.</p>
          <br/>
          <p style="color: #888; font-size: 12px;">The DevBoard Team</p>
        </div>
      `,
    });

    this.logger.log(`Invite email sent to ${recipientEmail}`);
  }

  async sendTaskAssignedEmail(params: {
    recipientEmail: string;
    recipientName: string;
    taskTitle: string;
    projectName: string;
    organizationName: string;
    assignerName: string;
  }): Promise<void> {
    const {
      recipientEmail,
      recipientName,
      taskTitle,
      projectName,
      organizationName,
      assignerName,
    } = params;

    await this.transporter.sendMail({
      from: this.config.get<string>('MAIL_FROM'),
      to: recipientEmail,
      subject: `New task assigned to you in ${projectName}`,
      text: `
        Hi ${recipientName},

        ${assignerName} assigned you a task in ${organizationName} / ${projectName}:
        "${taskTitle}"

        Log in to DevBoard to view it.

        The DevBoard Team
      `,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New task assigned to you</h2>
          <p>Hi <strong>${recipientName}</strong>,</p>
          <p>
            <strong>${assignerName}</strong> assigned you a task in
            <strong>${organizationName} / ${projectName}</strong>:
          </p>
          <blockquote style="border-left: 3px solid #ccc; padding-left: 16px;">
            ${taskTitle}
          </blockquote>
          <p>Log in to DevBoard to view it.</p>
          <br/>
          <p style="color: #888; font-size: 12px;">The DevBoard Team</p>
        </div>
      `,
    });

    this.logger.log(`Task assigned email sent to ${recipientEmail}`);
  }
}