import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Grid } from './grid.entity';
import { UsersProfileController } from './grid.controller';
import { GridService } from './grid.service';

@Module({
  imports: [TypeOrmModule.forFeature([Grid]), ConfigModule],
  providers: [GridService, ConfigService],
  controllers: [UsersProfileController],
})
export class UsersModule {}
