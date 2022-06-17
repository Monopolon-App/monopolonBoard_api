import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { ScheduleModule } from '@nestjs/schedule';

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
import { MulterModule } from '@nestjs/platform-express';
import { ListenersModule } from './listener/listeners.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: ['.env.production'],
      validationSchema: Joi.object({
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private connection: Connection) {}
}
