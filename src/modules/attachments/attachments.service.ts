import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from './entities/attachment.entity';
import { StorageService } from '../storage/storage.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { TasksService } from '../tasks/tasks.service';
import { OrgRole } from '../organizations/entities/organization-member.entity';

// Allowed file types — whitelist approach is safer than blacklist
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
] as const;

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 10MB

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
    private storageService: StorageService,
    private orgsService: OrganizationsService,
    private tasksService: TasksService,
  ) {}

  // ─── Upload ───────────────────────────────────────────────────

  // async uploadAttachment(
  //   orgId: string,
  //   projectId: string,
  //   taskId: string,
  //   userId: string,
  //   file: UploadedFile,
  // ): Promise<Attachment> {
  //   // Any member can upload attachments
  //   await this.orgsService.verifyRole(orgId, userId, [
  //     OrgRole.OWNER,
  //     OrgRole.ADMIN,
  //     OrgRole.MEMBER,
  //   ]);

  //   // Verify task exists and belongs to this org/project
  //   await this.tasksService.findOne(orgId, projectId, taskId, userId);

  //   // Validate file type — never trust client-provided type
  //   if (!ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
  //     throw new BadRequestException(
  //       `File type not allowed. Allowed types: images, PDF, Word, Excel, text`,
  //     );
  //   }

  //   // Validate file size
  //   if (file.size > MAX_FILE_SIZE_BYTES) {
  //     throw new BadRequestException(
  //       `File too large. Maximum size is 5MB`,
  //     );
  //   }

  //   // Upload to R2
  //   const { key, url } = await this.storageService.uploadFile({
  //     buffer: file.buffer,
  //     originalName: file.originalname,
  //     mimeType: file.mimetype,
  //     folder: `tasks/${taskId}/attachments`,
  //   });

  //   // Save metadata to DB
  //   const attachment = this.attachmentRepository.create({
  //     originalName: file.originalname,
  //     storageKey: key,
  //     url,
  //     mimeType: file.mimetype,
  //     size: file.size,
  //     taskId,
  //     uploadedById: userId,
  //   });

  //   return this.attachmentRepository.save(attachment);
  // }

  // ─── List ─────────────────────────────────────────────────────

  // async listAttachments(
  //   orgId: string,
  //   projectId: string,
  //   taskId: string,
  //   userId: string,
  // ): Promise<Attachment[]> {
  //   // Any member can view attachments
  //   await this.orgsService.verifyMembership(orgId, userId);
  //   await this.tasksService.findOne(orgId, projectId, taskId, userId);

  //   return this.attachmentRepository.find({
  //     where: { taskId },
  //     relations: ['uploadedBy'],
  //     order: { createdAt: 'DESC' },
  //   });
  // }

  // ─── Delete ──────────────────────────────────────────────────

  // async deleteAttachment(
  //   orgId: string,
  //   projectId: string,
  //   taskId: string,
  //   attachmentId: string,
  //   userId: string,
  // ): Promise<void> {
  //   await this.orgsService.verifyMembership(orgId, userId);

  //   const attachment = await this.attachmentRepository.findOne({
  //     where: { id: attachmentId, taskId },
  //   });

  //   if (!attachment) {
  //     throw new NotFoundException('Attachment not found');
  //   }

  //   // Only uploader, Admin, or Owner can delete
  //   const membership = await this.orgsService.getMembership(orgId, userId);
  //   const isUploader = attachment.uploadedById === userId;
  //   const isAdminOrOwner = membership
  //     ? [OrgRole.OWNER, OrgRole.ADMIN].includes(membership.role)
  //     : false;

  //   if (!isUploader && !isAdminOrOwner) {
  //     throw new ForbiddenException(
  //       'Only the uploader or an admin can delete this attachment',
  //     );
  //   }

  //   // Delete from R2 first — if this fails, don't delete DB record
  //   // Better to have orphaned DB record than missing file
  //   await this.storageService.deleteFile(attachment.storageKey);

  //   // Delete from DB
  //   await this.attachmentRepository.remove(attachment);
  // }
}