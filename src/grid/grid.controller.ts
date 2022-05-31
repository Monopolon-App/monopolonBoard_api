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

import { Grid } from './grid.entity';
import { UpdateGridDto } from './dto/update-grid.dto';

import { GridService } from './grid.service';

@ApiTags('grid')
@Controller('grid')
export class UsersProfileController {
  constructor(private readonly usersService: GridService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('/getUserById')
  getUserById(@Query('id') id: number): Promise<any> {
    return this.usersService.getUserById(id);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('file'))
  createUser(
    @Body() userprofile: Grid,
    @UploadedFiles() files: Array<Express.Multer.File>
  ): Promise<any> {
    console.log('files==========', files);
    return this.usersService.createUser(userprofile, files);
  }

  @Patch(':id')
  updateUserProfile(
    @Param('id') userId: number,
    @Body() updategridDto: UpdateGridDto
  ) {
    return this.usersService.updateUserProfile(userId, updategridDto);
  }
}
