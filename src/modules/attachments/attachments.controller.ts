import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AttachmentsService } from './attachments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { AttachmentResponseDto } from './dto/attachment-response.dto';

@ApiTags('attachments')
@ApiBearerAuth('access-token')
@Controller(
  'organizations/:orgId/projects/:projectId/tasks/:taskId/attachments',
)
export class AttachmentsController {
  constructor(private attachmentsService: AttachmentsService) {}

  // @Post()
  // @ApiOperation({ summary: 'Upload a file attachment to a task' })
  // @ApiCreatedResponse({
  //   description: 'File uploaded',
  //   type: AttachmentResponseDto,
  // })
  // @ApiConsumes('multipart/form-data')
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       file: {
  //         type: 'string',
  //         format: 'binary',
  //       },
  //     },
  //   },
  // })
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     storage: memoryStorage(),
  //     // memoryStorage keeps file in memory as Buffer
  //     // Fine for files up to ~5MB
  //     // For larger files you'd stream directly to R2
  //     limits: {
  //       fileSize: 5 * 1024 * 1024, // 10MB hard limit at Multer level
  //     },
  //   }),
  // )
  // async upload(
  //   @CurrentUser() user: User,
  //   @Param('orgId', ParseUUIDPipe) orgId: string,
  //   @Param('projectId', ParseUUIDPipe) projectId: string,
  //   @Param('taskId', ParseUUIDPipe) taskId: string,
  //   @UploadedFile() file: Express.Multer.File,
  // ) {
  //   if (!file) {
  //     throw new BadRequestException('No file provided');
  //   }

  //   return this.attachmentsService.uploadAttachment(
  //     orgId,
  //     projectId,
  //     taskId,
  //     user.id,
  //     file,
  //   );
  // }

  // @Get()
  // @ApiOperation({ summary: 'List all attachments for a task' })
  // @ApiOkResponse({
  //   description: 'Attachment list',
  //   type: [AttachmentResponseDto],
  // })
  // async list(
  //   @CurrentUser() user: User,
  //   @Param('orgId', ParseUUIDPipe) orgId: string,
  //   @Param('projectId', ParseUUIDPipe) projectId: string,
  //   @Param('taskId', ParseUUIDPipe) taskId: string,
  // ) {
  //   return this.attachmentsService.listAttachments(
  //     orgId,
  //     projectId,
  //     taskId,
  //     user.id,
  //   );
  // }

  // @Delete(':attachmentId')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // @ApiOperation({ summary: 'Delete an attachment' })
  // async delete(
  //   @CurrentUser() user: User,
  //   @Param('orgId', ParseUUIDPipe) orgId: string,
  //   @Param('projectId', ParseUUIDPipe) projectId: string,
  //   @Param('taskId', ParseUUIDPipe) taskId: string,
  //   @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
  // ) {
  //   return this.attachmentsService.deleteAttachment(
  //     orgId,
  //     projectId,
  //     taskId,
  //     attachmentId,
  //     user.id,
  //   );
  // }
}