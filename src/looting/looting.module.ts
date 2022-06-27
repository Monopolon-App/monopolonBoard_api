import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LootingService } from './looting.service';
import { Looting } from './looting.entity';
import { LootingController } from './looting.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Looting]), ConfigModule],
  providers: [LootingService, ConfigService],
  controllers: [LootingController],
})
export class LootingModule {}
