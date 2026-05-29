import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('BREVO_API_KEY');
    this.fromEmail = this.config.getOrThrow<string>('MAIL_FROM');
  }

  private async send(payload: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'DevBoard', email: this.fromEmail },
        to: [{ email: payload.to }],
        subject: payload.subject,
        htmlContent: payload.html,
        textContent: payload.text,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Brevo API error: ${res.status} ${error}`);
    }
  }

  async sendInviteEmail(params: {
    recipientEmail: string;
    recipientName: string;
    organizationName: string;
    inviterName: string;
    role: string;
  }): Promise<void> {
    const { recipientEmail, recipientName, organizationName, inviterName, role } = params;

    await this.send({
      to: recipientEmail,
      subject: `You've been invited to ${organizationName} on DevBoard`,
      text: `Hi ${recipientName}, ${inviterName} has invited you to join ${organizationName} as a ${role}. Log in to DevBoard to get started.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to ${organizationName}</h2>
          <p>Hi <strong>${recipientName}</strong>,</p>
          <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as a <strong>${role}</strong>.</p>
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
    const { recipientEmail, recipientName, taskTitle, projectName, organizationName, assignerName } = params;

    await this.send({
      to: recipientEmail,
      subject: `New task assigned to you in ${projectName}`,
      text: `Hi ${recipientName}, ${assignerName} assigned you "${taskTitle}" in ${organizationName} / ${projectName}. Log in to DevBoard to view it.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New task assigned to you</h2>
          <p>Hi <strong>${recipientName}</strong>,</p>
          <p><strong>${assignerName}</strong> assigned you a task in <strong>${organizationName} / ${projectName}</strong>:</p>
          <blockquote style="border-left: 3px solid #ccc; padding-left: 16px;">${taskTitle}</blockquote>
          <p>Log in to DevBoard to view it.</p>
          <br/>
          <p style="color: #888; font-size: 12px;">The DevBoard Team</p>
        </div>
      `,
    });

    this.logger.log(`Task assigned email sent to ${recipientEmail}`);
  }
}