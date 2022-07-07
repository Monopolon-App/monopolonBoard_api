import {
  UseGuards,
  Body,
  Controller,
  Get,
  Post,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { RegisterDto } from './dto/register.dto';
import { UsersProfile } from '../usersprofile/usersprofile.entity';
import { AuthService } from './auth.service';
import { UsersProfileService } from '../usersprofile/usersprofile.service';
import { LocalAuthGuard } from './local-auth.guard';
import { HttpCode } from '@nestjs/common';
import { JwtRefreshGuard } from './jwt-refresh.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ObjectWithWalletAddress } from 'src/shared/ObjectWithWalletAddress';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userProfileService: UsersProfileService
  ) {}

  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  @Post()
  async login(@Request() request: any) {
    const { id: userId } = request.user;
    const accessTokenCookie =
      this.authService.getCookieWithJwtAccessToken(userId);
    const refreshTokenCookie =
      this.authService.getCookieWithJwtRefreshToken(userId);
    await this.userProfileService.setCurrentRefreshToken(
      refreshTokenCookie.token,
      userId
    );

    request.res.setHeader('Set-Cookie', [
      accessTokenCookie,
      refreshTokenCookie.cookie,
    ]);
    return {
      success: true,
      message: 'Authenticated',
      accessToken: accessTokenCookie,
      refreshToken: refreshTokenCookie,
      data: request.user,
    };
  }

  @UseGuards(JwtRefreshGuard)
  @Get('/refresh-token')
  refresh(@Request() request: any) {
    const { id: userId } = request.user;
    const accessTokenCookie =
      this.authService.getCookieWithJwtAccessToken(userId);

    request.res.setHeader('Set-Cookie', accessTokenCookie);
    return {
      success: true,
      message: 'Authenticated',
      accessToken: accessTokenCookie,
      data: request.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  @HttpCode(200)
  async logOut(@Request() request: any) {
    const { id: userId } = request.user;
    await this.userProfileService.removeRefreshToken(userId);
    request.res.setHeader('Set-Cookie', this.authService.getCookiesForLogOut());
  }

  @Get('/token')
  sessionToken(
    @Query() { walletAddress }: ObjectWithWalletAddress
  ): Promise<UsersProfile> {
    return this.authService.getSessionToken(walletAddress);
  }

  @Get('/signature')
  generateSignature(
    @Query('tokenSession') tokenSession: string
  ): Promise<UsersProfile> {
    return this.authService.generateSignature(tokenSession);
  }

  @Get('/validateToken')
  validateSessionToken(@Query('token') token: string): Promise<UsersProfile> {
    return this.authService.validateSessionToken(token);
  }

  @Post('/register')
  register(@Body() registerDto: RegisterDto): Promise<UsersProfile> {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/me')
  me(@Request() request: any) {
    const { id: adminId } = request.user;
    const resp = this.authService.getById(adminId);

    return resp;
  }
}
