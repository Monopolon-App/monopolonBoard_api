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
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('fortunecard')
@Controller('fortunecard')
export class FortuneCardController {
  constructor(private readonly FortuneService: FortuneService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('/getUserById')
  getUserById(@Query('walletAddress') walletAddress: string): Promise<any> {
    return this.FortuneService.getUserById(walletAddress);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('file'))
  createFortune(
    @Body() userprofile: Fortune,
    @UploadedFiles() files: Array<Express.Multer.File>
  ): Promise<any> {
    return this.FortuneService.createFortune(userprofile, files);
  }

  // @UseGuards(JwtAuthGuard)
  @Patch(':walletAddress')
  updateFortune(
    @Param('walletAddress') walletAddress: string,
    @Body() updatefortuneDto: UpdateFortuneDto
  ) {
    return this.FortuneService.updateFortune(walletAddress, updatefortuneDto);
  }
}
