import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Grid } from './grid.entity';
import { GridController } from './grid.controller';
import { GridService } from './grid.service';
import { WanderingMerchantModule } from 'src/WanderingMerchant/wanderingMerchant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Grid]),
    ConfigModule,
    WanderingMerchantModule,
  ],
  providers: [GridService, ConfigService],
  controllers: [GridController],
})
export class GridModule {}
