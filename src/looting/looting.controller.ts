import { ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LootingService } from './looting.service';
import { Looting } from './looting.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('looting')
@Controller('looting')
export class LootingController {
  constructor(private readonly lootingService: LootingService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/getLootingByWalletAddress')
  getLootingById(@Query('walletAddress') walletAddress: string): Promise<any> {
    return this.lootingService.getLootingByWalletAddress(walletAddress);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/create')
  createLooting(@Body() looting: Looting): Promise<any> {
    return this.lootingService.createLooting(looting);
  }
}
