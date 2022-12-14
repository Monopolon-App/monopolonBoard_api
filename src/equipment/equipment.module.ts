import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Equipment } from './equipment.entity';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import { CharacterModule } from 'src/character/character.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Equipment]),
    ConfigModule,
    CharacterModule,
  ],
  providers: [EquipmentService, ConfigService],
  controllers: [EquipmentController],
})
export class EquipmentModule {}
