import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { ListenerService } from './listeners.service';
import { UsersModule } from '../usersprofile/usersprofile.module';
import { TransactionModule } from '../transaction/transaction.module';
import { Transaction } from '../transaction/transaction.entity';
import { UsersProfile } from '../usersprofile/usersprofile.entity';
import { Withdrawal } from '../withdrawal/withdrawal.entity';
import { WithdrawalModule } from '../withdrawal/withdrawal.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => UsersModule),
    TransactionModule,
    WithdrawalModule,
    TypeOrmModule.forFeature([UsersProfile, Transaction, Withdrawal]),
  ],
  providers: [ListenerService],
  exports: [],
})
export class ListenersModule {}
