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
export class UsersProfileController {
  constructor(private readonly usersService: UsersProfileService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('/:walletAddress')
  getUserByWalletAddress(
    @Param('walletAddress') walletAddress: string
  ): Promise<any> {
    return this.usersService.getByWalletAddress(walletAddress);
  }

  // @UseGuards(JwtAuthGuard)
  @Get('/:userId')
  getUserById(@Param('userId') userId: number): Promise<any> {
    return this.usersService.getById(userId);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('file'))
  createUser(
    @Body() userprofile: UsersProfile,
    @UploadedFiles() files: Array<Express.Multer.File>
  ): Promise<any> {
    return this.usersService.createUserProfile(userprofile, files);
  }
}
