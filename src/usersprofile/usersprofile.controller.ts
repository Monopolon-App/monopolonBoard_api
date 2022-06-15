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
import { registerUserParams } from './interfaces/params.interface';

@ApiTags('usersprofile')
@Controller('usersprofile')
export class UsersProfileController {
  constructor(private readonly usersService: UsersProfileService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('/getUserById')
  getUserById(@Query('walletAddress') walletAddress: string): Promise<any> {
    return this.usersService.getUserById(walletAddress);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('file'))
  createUser(
    @Body() userprofile: UsersProfile,
    @UploadedFiles() files: Array<Express.Multer.File>
  ): Promise<any> {
    return this.usersService.createUser(userprofile, files);
  }

  @Patch(':walletAddress')
  updateUserProfile(
    @Param('walletAddress') walletAddress: string,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.usersService.updateUserProfile(walletAddress, updateUserDto);
  }

  @Put('/enterMining/:walletAddress')
  enterMining(@Param('walletAddress') walletAddress: string) {
    return this.usersService.enterMining(walletAddress);
  }

  @Put('/rollingDice/:walletAddress')
  rollingDice(
    @Param('walletAddress') walletAddress: string,
    @Query('rollDice') rollDice: number
  ) {
    return this.usersService.rollingDice(walletAddress, rollDice);
  }

  @Post('/registerUser/:walletAddress/tokenId/:tokenId')
  registerUser(
    @Param() { walletAddress, tokenId }: registerUserParams
  ): Promise<any> {
    return this.usersService.registerUser(walletAddress, tokenId);
  }
}
