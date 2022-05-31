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

import { Character } from './character.entity';
import { UpdateHqDto } from './dto/update-character.dto';

import { CharacterService } from './character.service';

@ApiTags('hq')
@Controller('hq')
export class UsersProfileController {
  constructor(private readonly hqService: CharacterService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('/getUserById')
  getUserById(@Query('id') id: number): Promise<any> {
    return this.hqService.getUserById(id);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('file'))
  createUser(
    @Body() userprofile: Character,
    @UploadedFiles() files: Array<Express.Multer.File>
  ): Promise<any> {
    console.log('files==========', files);
    return this.hqService.createUser(userprofile, files);
  }

  @Patch(':id')
  updateUserProfile(
    @Param('id') userId: number,
    @Body() updategridDto: UpdateHqDto
  ) {
    return this.hqService.updateUserProfile(userId, updategridDto);
  }
}
