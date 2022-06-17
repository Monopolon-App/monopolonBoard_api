import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import DatabaseLogger from './databaseLogger';

// Entities
import { UsersProfile } from 'src/usersprofile/usersprofile.entity';
import { Fortune } from 'src/fortunecard/fortune-card.entity';
import { Withdrawal } from 'src/withdrawal/withdrawal.entity';
import { Equipment } from 'src/equipment/equipment.entity';
import { Transaction } from 'src/transaction/transaction.entity';
import { Team } from 'src/team/team.entity';
import { Hq } from 'src/hq/hq.entity';
import { Grid } from 'src/grid/grid.entity';
import { Character } from 'src/character/character.entity';
import { PlayerEarning } from 'src/playerearning/playerearning.entity';
import { Community } from 'src/communitychest/community.entity';
import { WithdrawalHistory } from '../withdrawalHistory/withdrawalHistory.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService) => ({
        type: 'mysql',
        host: configService.get('DATABASE_HOST'),
        port: parseInt(configService.get('DATABASE_PORT'), 10) || 3306,
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [
          UsersProfile,
          Transaction,
          Fortune,
          Withdrawal,
          Equipment,
          Team,
          Hq,
          PlayerEarning,
          Grid,
          Character,
          Community,
          WithdrawalHistory,
        ],
        synchronize: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
