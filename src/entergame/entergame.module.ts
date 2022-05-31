import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { EnterGame } from './entergame.entity';
import { UsersProfileController } from './entergame.controller';
import { EnterGameService } from './entergame.service';

@Module({
  imports: [TypeOrmModule.forFeature([EnterGame]), ConfigModule],
  providers: [EnterGameService, ConfigService],
  controllers: [UsersProfileController],
})
export class EnterGameModule {}
