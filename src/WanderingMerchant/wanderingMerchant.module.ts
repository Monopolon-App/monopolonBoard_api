import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { WanderingMerchant } from './wanderingMerchant.entity';
import { WanderingMerchantController } from './wanderingMerchant.controller';
import { WanderingMerchantService } from './wanderingMerchant.service';

@Module({
  imports: [TypeOrmModule.forFeature([WanderingMerchant]), ConfigModule],
  providers: [WanderingMerchantService, ConfigService],
  controllers: [WanderingMerchantController],
  exports: [WanderingMerchantService],
})
export class WanderingMerchantModule {}
