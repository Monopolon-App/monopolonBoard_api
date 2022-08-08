import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import { UsersProfileService } from '../usersprofile/usersprofile.service';
import { TokenPayload } from './interfaces/tokenPayload.interface';

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh-token'
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userProfileService: UsersProfileService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return (
            request?.cookies?.refresh_token || request?.headers.authorization
          );
        },
      ]),
      secretOrKey: configService.get('JWT_REFRESH_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: TokenPayload) {
    const refreshToken =
      request.cookies?.refresh_token || request?.headers.authorization;
    return this.userProfileService.getUserIfRefreshTokenMatches(
      refreshToken,
      payload.userId
    );
  }
}
