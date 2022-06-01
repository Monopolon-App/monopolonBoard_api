import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Hq } from './hq.entity';
import { HqController } from './hq.controller';
import { HqService } from './hq.service';

@Module({
  imports: [TypeOrmModule.forFeature([Hq]), ConfigModule],
  providers: [HqService, ConfigService],
  controllers: [HqController],
})
export class HqModule {}
