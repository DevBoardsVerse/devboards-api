// Queue names — one queue per domain concern
export const QUEUES = {
  NOTIFICATIONS: 'notifications',
} as const;

// Job names within each queue
export const JOBS = {
  SEND_INVITE_EMAIL: 'send_invite_email',
  SEND_TASK_ASSIGNED_EMAIL: 'send_task_assigned_email',
} as const;

// Typed job payloads — TypeScript safety for job data
export interface InviteEmailJobPayload {
  recipientEmail: string;
  recipientName: string;
  organizationName: string;
  inviterName: string;
  role: string;
}

export interface TaskAssignedEmailJobPayload {
  recipientEmail: string;
  recipientName: string;
  taskTitle: string;
  projectName: string;
  organizationName: string;
  assignerName: string;
}

// Union type of all possible job payloads
export type JobPayload =
  | InviteEmailJobPayload
  | TaskAssignedEmailJobPayload;