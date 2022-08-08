import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ListenerService } from './listeners.service';
import { Listener } from './listeners.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Listener])],
  providers: [ListenerService],
  exports: [ListenerService],
})
export class ListenersModule {}
