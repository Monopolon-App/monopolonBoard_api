import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Hq } from './hq.entity';
import { HqController } from './hq.controller';
import { HqService } from './hq.service';
import { Looting } from '../looting/looting.entity';
import { LootingService } from '../looting/looting.service';

@Module({
  imports: [TypeOrmModule.forFeature([Hq, Looting]), ConfigModule],
  providers: [HqService, ConfigService, LootingService],
  controllers: [HqController],
})
export class HqModule {}
