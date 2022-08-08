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

import { Hq } from './hq.entity';
import { UpdateHqDto } from './dto/update-hq.dto';

import { HqService } from './hq.service';
import { Looting } from '../looting/looting.entity';

@ApiTags('hq')
@Controller('hq')
export class HqController {
  constructor(private readonly hqService: HqService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('/getUserById')
  getHqById(@Query('wallwtAddress') wallwtAddress: string): Promise<any> {
    return this.hqService.getHqById(wallwtAddress);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('file'))
  createHq(
    @Body() userprofile: Hq,
    @UploadedFiles() files: Array<Express.Multer.File>
  ): Promise<any> {
    return this.hqService.createHq(userprofile, files);
  }

  // @UseGuards(JwtAuthGuard)
  @Patch(':wallwtAddress')
  updateHq(
    @Param('wallwtAddress') wallwtAddress: string,
    @Body() updategridDto: UpdateHqDto
  ) {
    return this.hqService.updateHq(wallwtAddress, updategridDto);
  }

  /**
   * Api for get all the Hq which is present in given GridPosition.
   * @param hqGridPosition
   */
  // @UseGuards(JwtAuthGuard)
  @Get('/getHqByGrid')
  getHqByGridPosition(
    @Query('gridPosition') hqGridPosition: number
  ): Promise<any> {
    return this.hqService.getHqByGridPosition(hqGridPosition);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/looting/create')
  createLooting(
    @Body()
    looting: Looting
  ): Promise<any> {
    return this.hqService.createLooting(looting);
  }

  // @UseGuards(JwtAuthGuard)
  @Put('/looting/update/:id')
  updateLooting(
    @Param('id') lootingId: number,
    @Body()
    looting: Looting
  ): Promise<any> {
    return this.hqService.updateLooting(lootingId, looting);
  }
}
