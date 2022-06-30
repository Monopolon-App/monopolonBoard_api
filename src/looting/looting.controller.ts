import { ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { LootingService } from './looting.service';
import { Looting } from './looting.entity';
import { UpdateLootingDto } from './dto/update-looting.dto';

@ApiTags('looting')
@Controller('looting')
export class LootingController {
  constructor(private readonly lootingService: LootingService) {}

  @Get('/getLootingById')
  getLootingById(@Query('walletAddress') walletAddress: string): Promise<any> {
    return this.lootingService.getLootingById(walletAddress);
  }

  @Post('/create')
  createLooting(@Body() looting: Looting): Promise<any> {
    return this.lootingService.createLooting(looting);
  }
}
