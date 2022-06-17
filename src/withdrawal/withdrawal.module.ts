import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Withdrawal } from './withdrawal.entity';
import { WithdrawalController } from './withdrawal.controller';
import { WithdrawalService } from './withdrawal.service';
import { WithdrawalHistory } from '../withdrawalHistory/withdrawalHistory.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Withdrawal, WithdrawalHistory]),
    ConfigModule,
  ],
  providers: [WithdrawalService, ConfigService],
  controllers: [WithdrawalController],
})
export class WithdrawalModule {}
