import { Module } from '@nestjs/common';
import { ListenerService } from './listeners.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../usersprofile/usersprofile.module';
import { TransactionModule } from '../transaction/transaction.module';
import { Transaction } from '../transaction/transaction.entity';
import { UsersProfile } from '../usersprofile/usersprofile.entity';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    TransactionModule,
    TypeOrmModule.forFeature([UsersProfile, Transaction]),
  ],
  providers: [ListenerService],
  exports: [],
})
export class ListenersModule {}
