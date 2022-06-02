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

import { Community } from './community.entity';
import { UpdateCommunityDto } from './dto/update-community.dto';

import { CommunityService } from './community.service';

@ApiTags('community')
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('/getcommunityById')
  getUserById(@Query('id') id: number): Promise<any> {
    return this.communityService.getUserById(id);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('file'))
  createCommunity(
    @Body() userprofile: Community,
    @UploadedFiles() files: Array<Express.Multer.File>
  ): Promise<any> {
    return this.communityService.createCommunity(userprofile, files);
  }

  @Patch(':id')
  updateCommunity(
    @Param('id') userId: number,
    @Body() updatecommunityDto: UpdateCommunityDto
  ) {
    return this.communityService.updateCommunity(userId, updatecommunityDto);
  }
}
