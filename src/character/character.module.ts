import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Character } from './character.entity';
import { UsersProfileController } from './character.controller';
import { CharacterService } from './character.service';

@Module({
  imports: [TypeOrmModule.forFeature([Character]), ConfigModule],
  providers: [CharacterService, ConfigService],
  controllers: [UsersProfileController],
})
export class CharacterModule {}
