import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PlayerEarning } from './playerearning.entity';
import { UsersController } from './playerearning.controller';
import { PlayerEarningService } from './playerearning.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlayerEarning]),
    ConfigModule,
  ],
  providers: [PlayerEarningService, ConfigService],
  controllers: [UsersController],
})
export class PlayEarningModule {}
