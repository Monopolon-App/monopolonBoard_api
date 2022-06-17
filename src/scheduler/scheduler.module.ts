import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { SchedulerService } from './scheduler.service';
import { Withdrawal } from '../withdrawal/withdrawal.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Withdrawal])],
  providers: [SchedulerService],
  exports: [],
})
export class SchedulerModule {}
