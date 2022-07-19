import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Param,
  Request,
  Put,
  Patch,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';

import { WanderingMerchant } from './wanderingMerchant.entity';

import {
  WanderingMerchantBody,
  WanderingMerchantService,
} from './wanderingMerchant.service';

@ApiTags('wanderingMerchant')
@Controller('wanderingMerchant')
export class WanderingMerchantController {
  constructor(
    private readonly wanderingMerchantService: WanderingMerchantService
  ) {}

  @Post(':id/purchaseEquipment')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('file'))
  purchaseEquipment(
    @Param('id') id: number,
    @Body() wanderingMerchantData: WanderingMerchantBody
  ) {
    return this.wanderingMerchantService.purchaseEquipment(
      id,
      wanderingMerchantData
    );
  }
}
