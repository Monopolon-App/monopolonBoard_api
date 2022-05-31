import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsersProfile } from './usersprofile.entity';
import { UsersProfileController } from './usersprofile.controller';
import { UsersProfileService } from './usersprofile.service';

@Module({
  imports: [TypeOrmModule.forFeature([UsersProfile]), ConfigModule],
  providers: [UsersProfileService, ConfigService],
  controllers: [UsersProfileController],
})
export class UsersModule {}
