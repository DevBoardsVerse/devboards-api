import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Attachment } from './entities/attachment.entity';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { StorageModule } from '../storage/storage.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { TasksModule } from '../tasks/task.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment]),
    MulterModule.register({}),
    StorageModule,
    OrganizationsModule,
    TasksModule,
  ],
  providers: [AttachmentsService],
  controllers: [AttachmentsController],
})
export class AttachmentsModule {}