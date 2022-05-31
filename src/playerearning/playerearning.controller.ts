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

import { PlayerEarning } from './playerearning.entity';
import { UpdatePlayerEarningDto } from './dto/update-player-earning.dto';

import { PlayerEarningService } from './playerearning.service';

@ApiTags('playeraning')
@Controller('playeraning')
export class UsersController {
  constructor(private readonly playerearningService: PlayerEarningService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('/getUserById')
  getPlayearningById(@Query('id') id: number): Promise<any> {
    return this.playerearningService.getPlayearningById(id);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('file'))
  createPlayEarning(
    @Body() userprofile: PlayerEarning,
    @UploadedFiles() files: Array<Express.Multer.File>
  ): Promise<any> {
    return this.playerearningService.createPlayearning(userprofile, files);
  }

  @Patch(':id')
  updatPlayseEarning(
    @Param('id') userId: number,
    @Body() updateplayerEarningDto: UpdatePlayerEarningDto
  ) {
    return this.playerearningService.updatPlayseEarning(
      userId,
      updateplayerEarningDto
    );
  }
}
