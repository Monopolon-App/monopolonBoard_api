import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsersProfile } from './usersprofile.entity';
import { UsersProfileController } from './usersprofile.controller';
import { UsersProfileService } from './usersprofile.service';
import { ListenersModule } from '../listener/listeners.module';
import { Listener } from 'src/listener/listeners.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([UsersProfile, Listener]),
    ListenersModule,
  ],
  providers: [UsersProfileService],
  controllers: [UsersProfileController],
})
export class UsersModule {}
