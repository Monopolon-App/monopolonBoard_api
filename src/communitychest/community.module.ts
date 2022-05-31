import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Community } from './community.entity';
import { UsersProfileController } from './community.controller';
import { CommunityService } from './community.service';

@Module({
  imports: [TypeOrmModule.forFeature([Community]), ConfigModule],
  providers: [CommunityService, ConfigService],
  controllers: [UsersProfileController],
})
export class UsersModule {}
