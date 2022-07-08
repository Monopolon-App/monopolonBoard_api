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

import { Equipment } from './equipment.entity';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

import { EquipmentService } from './equipment.service';

@ApiTags('equipment')
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('/getUserById')
  getUserById(@Query('walletAddress') walletAddress: string): Promise<any> {
    return this.equipmentService.getUserById(walletAddress);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('file'))
  createEquipment(
    @Body() equipment: Equipment,
    @UploadedFiles() files: Array<Express.Multer.File>
  ): Promise<any> {
    return this.equipmentService.createEquipment(equipment, files);
  }

  @Patch(':walletAddress')
  updateEquipmentl(
    @Param('walletAddress') walletAddress: string,
    @Body() updateEquipmentDto: UpdateEquipmentDto
  ) {
    return this.equipmentService.updateEquipment(
      walletAddress,
      updateEquipmentDto
    );
  }

  @Get(':walletAddress')
  getEquipmentByWalledtAddress(@Param('walletAddress') walletAddress: string) {
    return this.equipmentService.getById(walletAddress);
  }
}
