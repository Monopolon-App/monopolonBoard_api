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
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('Character')
@Controller('Character')
export class CharacterController {
  constructor(private readonly hqService: CharacterService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/getUserById')
  getUserById(@Query('walletAddress') walletAddress: string): Promise<any> {
    return this.hqService.getUserById(walletAddress);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('file'))
  createCharacter(
    @Body() character: Character,
    @UploadedFiles() files: Array<Express.Multer.File>
  ): Promise<any> {
    return this.hqService.createCharacter(character, files);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':walletAddress')
  updateCharacter(
    @Param('walletAddress') walletAddress: string,
    @Body() updategridDto: UpdateCharacterDto
  ) {
    return this.hqService.updateCharacter(walletAddress, updategridDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/update')
  removingNFTFromUserWallet(@Param('id') id: number) {
    return this.hqService.removingNFTFromUserWallet(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('game/exit/:walletAddress')
  exitGame(@Param('walletAddress') walletAddress: string) {
    return this.hqService.exitGame(walletAddress);
  }
}
