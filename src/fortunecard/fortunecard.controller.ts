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

import { Fortune } from './fortune-card.entity';
import { UpdateFortuneDto } from './dto/update-fortune-card.dto';

import { FortuneService } from './fortune-card.service';

@ApiTags('hq')
@Controller('hq')
export class UsersProfileController {
  constructor(private readonly FortuneService: FortuneService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('/getUserById')
  getUserById(@Query('id') id: number): Promise<any> {
    return this.FortuneService.getUserById(id);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('file'))
  createFortune(
    @Body() userprofile: Fortune,
    @UploadedFiles() files: Array<Express.Multer.File>
  ): Promise<any> {
    console.log('files==========', files);
    return this.FortuneService.createFortune(userprofile, files);
  }

  @Patch(':id')
  updateFortune(
    @Param('id') userId: number,
    @Body() updategridDto: UpdateFortuneDto
  ) {
    return this.FortuneService.updateFortune(userId, updategridDto);
  }
}
