import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Withdrawal } from './withdrawal.entity';
import { WithdrawalController } from './withdrawal.controller';
import { WithdrawalService } from './withdrawal.service';

@Module({
  imports: [TypeOrmModule.forFeature([Withdrawal]), ConfigModule],
  providers: [WithdrawalService, ConfigService],
  controllers: [WithdrawalController],
})
export class WithdrawalModule {}
