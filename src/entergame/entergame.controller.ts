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

import { EnterGame } from './entergame.entity';
import { UpdateEnterGameDto } from './dto/update-entergame.dto';

import { EnterGameService } from './entergame.service';

@ApiTags('enterGame')
@Controller('enterGame')
export class UsersProfileController {
  constructor(private readonly entergameService: EnterGameService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('/getUserById')
  getUserById(@Query('id') id: number): Promise<any> {
    return this.entergameService.getUserById(id);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('file'))
  createEnterGame(
    @Body() userprofile: EnterGame,
    @UploadedFiles() files: Array<Express.Multer.File>
  ): Promise<any> {
    return this.entergameService.createEnterGame(userprofile, files);
  }

  @Patch(':id')
  updateEnterGame(
    @Param('id') userId: number,
    @Body() updateEnterGameDto: UpdateEnterGameDto
  ) {
    return this.entergameService.updateEnterGame(userId, updateEnterGameDto);
  }
}
