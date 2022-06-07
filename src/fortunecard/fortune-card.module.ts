import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Fortune } from './fortune-card.entity';
import { FortuneCardController } from './fortunecard.controller';
import { FortuneService } from './fortune-card.service';

@Module({
  imports: [TypeOrmModule.forFeature([Fortune]), ConfigModule],
  providers: [FortuneService, ConfigService],
  controllers: [FortuneCardController],
})
export class FortuneCardModule {}
