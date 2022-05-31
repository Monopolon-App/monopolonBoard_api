import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Transaction } from './transaction.entity';
import { TransactionController } from './transaction.controller';
import { TeamService } from './transaction.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction]), ConfigModule],
  providers: [TeamService, ConfigService],
  controllers: [TransactionController],
})
export class UsersModule {}
