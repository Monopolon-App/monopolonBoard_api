import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { ListenerService } from '../listener/listeners.service';
import { UsersModule } from '../usersprofile/usersprofile.module';
import { TransactionModule } from '../transaction/transaction.module';
import { Transaction } from '../transaction/transaction.entity';
import { UsersProfile } from '../usersprofile/usersprofile.entity';
import { SchedulerService } from './scheduler.service';
import { Withdrawal } from '../withdrawal/withdrawal.entity';
import { WithdrawalModule } from '../withdrawal/withdrawal.module';
import { ListenersModule } from 'src/listener/listeners.module';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Withdrawal])],
  providers: [SchedulerService],
  exports: [],
})
export class SchedulerModule {}
