import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Team } from './team.entity';
import { UsersProfileController } from './team.controller';
import { TeamService } from './team.service';

@Module({
  imports: [TypeOrmModule.forFeature([Team]), ConfigModule],
  providers: [TeamService, ConfigService],
  controllers: [UsersProfileController],
})
export class UsersModule {}
