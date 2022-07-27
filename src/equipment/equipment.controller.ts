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
  Inject,
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';

import { Equipment } from './equipment.entity';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

import { EquipmentService } from './equipment.service';
import { CharacterService } from 'src/character/character.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('equipment')
@Controller('equipment')
export class EquipmentController {
  @Inject(CharacterService)
  private characterService: CharacterService;

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

  // @UseGuards(JwtAuthGuard)
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

  // @UseGuards(JwtAuthGuard)
  @Get(':walletAddress')
  getEquipmentByWalledtAddress(@Param('walletAddress') walletAddress: string) {
    return this.equipmentService.getById(walletAddress);
  }

  // @UseGuards(JwtAuthGuard)
  @Get('getEquipmentByTokenId/:tokenId')
  getEquipmentByTokenId(@Param('tokenId') tokenId: string) {
    return this.equipmentService.getEquipmentByTokenId(tokenId);
  }

  // @UseGuards(JwtAuthGuard)
  @Put('equipNew')
  equipeNew(
    @Query('oldEquipmentId') oldEquipmentId: number,
    @Query('newEquipmentId') newEquipmentId: number
  ) {
    return this.equipmentService.updateEquipmentStatus(
      oldEquipmentId,
      newEquipmentId
    );
  }

  // @UseGuards(JwtAuthGuard)
  @Post(':id/removeEquipment')
  removeEquipment(@Param('id') id: number) {
    return this.equipmentService.removeEquipment(id);
  }
}
