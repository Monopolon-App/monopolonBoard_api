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

import { UsersProfile } from './usersprofile.entity';
import { UpdateUserDto } from './dto/update-user-profile.dto';

import { UsersProfileService } from './usersprofile.service';

@ApiTags('usersprofile')
@Controller('usersprofile')
export class UsersController {
  constructor(private readonly usersService: UsersProfileService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('/getUserById')
  getUserById(@Query('id') id: number): Promise<any> {
    return this.usersService.getUserById(id);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('file'))
  createUser(@Body() userprofile: UsersProfile,@UploadedFiles() files: Array<Express.Multer.File>,): Promise<any> {
    return this.usersService.createUser(userprofile,files);
  }

  @Patch(':id')
  updateUserProfile(
    @Param('id') userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUserProfile(userId, updateUserDto);
  }
 
}
