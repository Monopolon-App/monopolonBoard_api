import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { WithdrawalHistory } from './withdrawalHistory.entity';
import { WithdrawalHistoryController } from './withdrawalHistory.controller';
import { WithdrawalHistoryService } from './withdrawalHistory.service';

@Module({
  imports: [TypeOrmModule.forFeature([WithdrawalHistory]), ConfigModule],
  providers: [WithdrawalHistoryService, ConfigService],
  controllers: [WithdrawalHistoryController],
})
export class WithdrawalHistoryModule {}
