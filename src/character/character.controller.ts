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
import { UpdateCharacterDto } from './dto/update-character.dto';

import { CharacterService } from './character.service';

@ApiTags('hq')
@Controller('hq')
export class CharacterController {
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
  createCharacter(
    @Body() character: Character,
    @UploadedFiles() files: Array<Express.Multer.File>
  ): Promise<any> {
    return this.hqService.createCharacter(character, files);
  }

  @Patch(':id')
  updateCharacter(
    @Param('id') userId: number,
    @Body() updategridDto: UpdateCharacterDto
  ) {
    return this.hqService.updateCharacter(userId, updategridDto);
  }
}
