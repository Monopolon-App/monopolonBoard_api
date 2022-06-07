import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

// Entities
import { UsersProfile } from './usersprofile/usersprofile.entity';
import { Fortune } from './fortunecard/fortune-card.entity';

import { PlayerEarning } from './playerearning/playerearning.entity';
import { EnterGame } from './entergame/entergame.entity';
import { Transaction } from './transaction/transaction.entity';
import { Team } from './team/team.entity';
import { Hq } from './hq/hq.entity';
import { Grid } from './grid/grid.entity';
import { Character } from './character/character.entity';
import { Community } from './communitychest/community.entity';

// Modules
import { FortuneCardModule } from './fortunecard/fortune-card.module';

import { UsersModule } from './usersprofile/usersprofile.module';
import { PlayEarningModule } from './playerearning/playerearning.module';
import { EnterGameModule } from './entergame/entergame.module';
import { TransactionModule } from './transaction/transaction.module';
import { TeamModule } from './team/team.module';
import { HqModule } from './hq/hq.module';
import { GridModule } from './grid/grid.module';
import { CharacterModule } from './character/character.module';
import { CommunityModule } from './communitychest/community.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MulterModule } from '@nestjs/platform-express';
import { ListenersModule } from './listener/listeners.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.local'],
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
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService, _configModule) => ({
        type: 'mysql',
        host: configService.get('DATABASE_HOST'),
        port: parseInt(configService.get('DATABASE_PORT'), 10) || 3306,
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [
          UsersProfile,
          PlayerEarning,
          EnterGame,
          Transaction,
          Fortune,
          Team,
          Hq,
          Grid,
          Character,
          Community,
        ],
        synchronize: true,
      }),
    }),
    UsersModule,
    FortuneCardModule,
    PlayEarningModule,
    EnterGameModule,
    TransactionModule,
    TeamModule,
    HqModule,
    GridModule,
    CharacterModule,
    CommunityModule,
    MulterModule.register({
      dest: './uploads',
    }),
    ListenersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private connection: Connection) {}
}
