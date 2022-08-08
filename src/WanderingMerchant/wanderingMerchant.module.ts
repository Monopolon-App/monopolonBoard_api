import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { WanderingMerchant } from './wanderingMerchant.entity';
import { WanderingMerchantController } from './wanderingMerchant.controller';
import { WanderingMerchantService } from './wanderingMerchant.service';
import { ListenersModule } from '../listener/listeners.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WanderingMerchant]),
    ConfigModule,
    ListenersModule,
  ],
  providers: [WanderingMerchantService, ConfigService],
  controllers: [WanderingMerchantController],
  exports: [WanderingMerchantService],
})
export class WanderingMerchantModule {}
