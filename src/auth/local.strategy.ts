import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'walletAddress', passwordField: 'signature' });
  }

  async validate(walletAddress: string, signature: string): Promise<any> {
    const payloadLogin: LoginDto = { walletAddress, signature };
    const resp = await this.authService.login(payloadLogin);

    if (!resp) {
      throw new UnauthorizedException();
    }

    return resp;
  }
}
