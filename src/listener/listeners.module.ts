import { Module } from '@nestjs/common';
import { ListenerService } from './listeners.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../usersprofile/usersprofile.module';
import { TransactionModule } from '../transaction/transaction.module';
import { Transaction } from '../transaction/transaction.entity';
import { UsersProfile } from '../usersprofile/usersprofile.entity';
import { SchedulerService } from './scheduler.service';
import { Withdrawal } from '../withdrawal/withdrawal.entity';
import { WithdrawalModule } from '../withdrawal/withdrawal.module';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    TransactionModule,
    WithdrawalModule,
    TypeOrmModule.forFeature([UsersProfile, Transaction, Withdrawal]),
  ],
  providers: [ListenerService, SchedulerService],
  exports: [],
})
export class ListenersModule {}
