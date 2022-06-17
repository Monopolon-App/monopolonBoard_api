import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsersProfile } from './usersprofile.entity';
import { UsersProfileController } from './usersprofile.controller';
import { UsersProfileService } from './usersprofile.service';
import { ListenersModule } from '../listener/listeners.module';
import { ListenerService } from '../listener/listeners.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsersProfile]),
    ConfigModule,
    forwardRef(() => ListenersModule),
  ],
  providers: [UsersProfileService, ConfigService, ListenerService],
  controllers: [UsersProfileController],
})
export class UsersProfileModule {}
