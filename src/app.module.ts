import { Module } from '@nestjs/common';
import { Connection } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ScheduleModule } from '@nestjs/schedule';
import { MulterModule } from '@nestjs/platform-express';

// Modules
import { FortuneCardModule } from './fortunecard/fortune-card.module';
import { PlayEarningModule } from './playerearning/playerearning.module';
import { WithdrawalModule } from './withdrawal/withdrawal.module';
import { EquipmentModule } from './equipment/equipment.module';
import { UsersModule } from './usersprofile/usersprofile.module';
import { TransactionModule } from './transaction/transaction.module';
import { TeamModule } from './team/team.module';
import { HqModule } from './hq/hq.module';
import { GridModule } from './grid/grid.module';
import { CharacterModule } from './character/character.module';
import { CommunityModule } from './communitychest/community.module';
import { SchedulerModule } from './scheduler/scheduler.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ListenersModule } from './listener/listeners.module';
import { DatabaseModule } from './database/database.module';
import { WithdrawalHistoryModule } from './withdrawalHistory/withdrawalHistory.module';
import { LootingModule } from './looting/looting.module';
import { ErrorModule } from './errorException/error.module';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './errorException/allException';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: ['.env.local'],
      validationSchema: Joi.object({
        ENV_TAG: Joi.string(),
        DATABASE_HOST: Joi.string().required(),
        DATABASE_PORT: Joi.string().required(),
        DATABASE_USER: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().required(),
        DATABASE_NAME: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION_TIME: Joi.number().required(),
        JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
        JWT_ACCESS_TOKEN_EXPIRATION_TIME: Joi.string().required(),
        JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
        JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.string().required(),
        COMPANY_PRIVATE_KEY: Joi.string().required(), // company private key for withdrawal
        COMPANY_ADDRESS: Joi.string().required(), // company nft wallet address for listener
      }),
    }),
    DatabaseModule,
    MulterModule.register({
      dest: './uploads',
    }),
    UsersModule,
    FortuneCardModule,
    TransactionModule,
    TeamModule,
    WithdrawalModule,
    PlayEarningModule,
    EquipmentModule,
    HqModule,
    GridModule,
    CharacterModule,
    CommunityModule,
    ListenersModule,
    SchedulerModule,
    WithdrawalHistoryModule,
    LootingModule,
    ErrorModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {
  constructor(private connection: Connection) {}
}
