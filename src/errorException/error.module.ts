import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ErrorEntity } from './error.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ErrorEntity]), ConfigModule],
  providers: [],
  controllers: [],
  exports: [TypeOrmModule.forFeature([ErrorEntity])],
})
export class ErrorModule {}
