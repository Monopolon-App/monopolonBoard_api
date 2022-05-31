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

@ApiTags('hq')
@Controller('hq')
export class UsersProfileController {
  constructor(private readonly hqService: HqService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('/getUserById')
  getHqById(@Query('id') id: number): Promise<any> {
    return this.hqService.getHqById(id);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('file'))
  createHq(
    @Body() userprofile: Hq,
    @UploadedFiles() files: Array<Express.Multer.File>
  ): Promise<any> {
    console.log('files==========', files);
    return this.hqService.createHq(userprofile, files);
  }

  @Patch(':id')
  updateHq(@Param('id') userId: number, @Body() updategridDto: UpdateHqDto) {
    return this.hqService.updateHq(userId, updategridDto);
  }
}
