import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { ListenerService } from '../listener/listeners.service';
import { UsersProfileModule } from '../usersprofile/usersprofile.module';
import { TransactionModule } from '../transaction/transaction.module';
import { Transaction } from '../transaction/transaction.entity';
import { UsersProfile } from '../usersprofile/usersprofile.entity';
import { SchedulerService } from './scheduler.service';
import { Withdrawal } from '../withdrawal/withdrawal.entity';
import { WithdrawalModule } from '../withdrawal/withdrawal.module';

@Module({
  imports: [
    ConfigModule,
    UsersProfileModule,
    TransactionModule,
    WithdrawalModule,
    TypeOrmModule.forFeature([UsersProfile, Transaction, Withdrawal]),
  ],
  providers: [SchedulerService, ListenerService],
  exports: [],
})
export class SchedulerModule {}
