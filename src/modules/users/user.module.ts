import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  // forFeature registers the User entity for this module
  // it gives UsersService access to the User repository
  providers: [UsersService],
  controllers:[UsersController],
  exports: [UsersService],   // export so AuthModule can use it
})
export class UsersModule {}