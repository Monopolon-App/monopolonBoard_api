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

import { WanderingMerchantService } from './wanderingMerchant.service';

@ApiTags('wanderingMerchant')
@Controller('wanderingMerchant')
export class WanderingMerchantController {
  constructor(private readonly equipmentService: WanderingMerchantService) {}
}
