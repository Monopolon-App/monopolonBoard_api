import {
  HttpException,
  Injectable,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as ethUtils from 'ethereumjs-util';
import Web3 from 'web3';
import HDWalletProvider from '@truffle/hdwallet-provider';

import { RegisterDto } from './dto/register.dto';
import { UsersProfile } from '../usersprofile/usersprofile.entity';
import { TokenPayload } from './interfaces/tokenPayload.interface';
import { LoginDto } from './dto/login.dto';
import { RPC_PROVIDER_URL } from 'src/constants/constants';
import { Verify } from 'crypto';

export const MESSAGE_DATA = '123qwe';

@Injectable()
export class AuthService {
  private networkMode;
  private hdProvider;
  private web3;
  private companyPrivateKey;
  constructor(
    @InjectRepository(UsersProfile)
    private readonly userProfileRepository: Repository<UsersProfile>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.networkMode =
      this.configService.get('ENV_TAG') !== 'production'
        ? 'MAINNET'
        : 'TESTNET';

    this.companyPrivateKey = this.configService.get('COMPANY_PRIVATE_KEY');
    this.hdProvider = new HDWalletProvider(
      this.companyPrivateKey,
      RPC_PROVIDER_URL[this.networkMode],
      0,
      1
    );

    this.web3 = new Web3(this.hdProvider);
  }

  public async getSessionToken(walletAddress: string): Promise<any> {
    try {
      const token = await this.jwtService.signAsync(
        { walletAddress },
        {
          secret: this.configService.get('JWT_SESSION_TOKEN_SECRET'),
          expiresIn: `${this.configService.get(
            'JWT_SESSION_TOKEN_EXPIRATION_TIME'
          )}s`,
        }
      );

      const user = await this.userProfileRepository.findOne({
        walletAddress,
      });

      if (user) {
        await this.userProfileRepository.update(
          { walletAddress },
          {
            lastLoginAttemptToken: token,
          }
        );
      } else {
        throw new UnauthorizedException('User not registered!');
      }

      return { token };
    } catch (error) {
      throw new HttpException(error?.message, HttpStatus.BAD_REQUEST);
    }
  }

  public async validateSessionToken(token: string): Promise<any> {
    try {
      const validatedToken = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SESSION_TOKEN_SECRET'),
      });

      return validatedToken;
    } catch (error) {
      throw new HttpException(error?.message, HttpStatus.BAD_REQUEST);
    }
  }

  public async generateSignature(sessionToken: string): Promise<any> {
    try {
      const signature = await this.web3.eth.accounts.sign(
        sessionToken,
        this.companyPrivateKey
      );

      return signature;
    } catch (error) {
      throw new HttpException(error?.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   *
   * @param userId
   * @returns string
   */
  public getCookieWithJwtAccessToken(userId: number): any {
    const payload: TokenPayload = { userId };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_ACCESS_TOKEN_EXPIRATION_TIME'
      )}s`,
    });

    return `access_token=${token}; Path=/; SameSite=None; Secure; Max-Age=${this.configService.get(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME'
    )}`;
  }

  /**
   *
   * @param userId
   * @returns object of cookie and token
   */
  public getCookieWithJwtRefreshToken(userId: number): {
    token: string;
    cookie: string;
  } {
    const payload: TokenPayload = { userId };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_REFRESH_TOKEN_EXPIRATION_TIME'
      )}s`,
    });
    const cookie = `refresh_token=${token}; Path=/; SameSite=None; Secure; Max-Age=${this.configService.get(
      'JWT_REFRESH_TOKEN_EXPIRATION_TIME'
    )}`;
    return {
      cookie,
      token,
    };
  }

  public getCookiesForLogOut() {
    return [
      'access_token=; Path=/; SameSite=None; Secure; Max-Age=0',
      'refresh_token=; Path=/; SameSite=None; Secure; Max-Age=0',
    ];
  }

  async register(registerDto: RegisterDto): Promise<any> {
    try {
      const user = new UsersProfile();
      user.walletAddress = registerDto.walletAddress;

      const userProfile = await this.userProfileRepository.findOne({
        where: {
          walletAddress: registerDto.walletAddress,
        },
      });

      if (!userProfile) {
        throw new UnauthorizedException('Wallet address already registered');
      }

      const userResp = await this.userProfileRepository.save(user);

      return userResp;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * validateSignature
   * @param sig
   * @param accountAddress
   * @returns string account address
   * @description custom validation signature
   */
  async validateSignature(sig) {
    try {
      const msg = await this.web3.utils.sha3(MESSAGE_DATA);
      const signature = ethUtils.fromRpcSig(sig);
      const pubKey = ethUtils.ecrecover(
        msg,
        signature.v,
        signature.r,
        signature.s
      );
      const foundAddress = '0x' + ethUtils.pubToAddress(pubKey).toString('hex');

      return foundAddress;
    } catch (error) {
      return undefined;
    }
  }

  async login({ walletAddress, signature }: LoginDto): Promise<any> {
    try {
      const userData = await this.userProfileRepository.findOne({
        walletAddress,
      });

      await this.validateSessionToken(userData.lastLoginAttemptToken);

      if (!userData) {
        throw new HttpException(
          'Wallet address not registered!',
          HttpStatus.UNAUTHORIZED
        );
      }

      const recoveredAddress = await this.web3.eth.accounts.recover(
        userData.lastLoginAttemptToken,
        signature
      );

      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new HttpException(
          'Signature is not correct.',
          HttpStatus.UNAUTHORIZED
        );
      }

      userData.lastLoginAttemptToken = null;

      const userProfleData = await this.userProfileRepository.save(userData);

      return userProfleData;
    } catch (error) {
      throw new HttpException(error?.message, HttpStatus.UNAUTHORIZED);
    }
  }

  async getById(userId): Promise<any> {
    try {
      const resp = await this.userProfileRepository.findOne({ id: userId });

      if (!resp) {
        return new UnauthorizedException();
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { currentHashedRefreshToken, ...result } = resp;

      return new HttpException(
        {
          status: HttpStatus.OK,
          message: 'Success',
          data: result,
        },
        HttpStatus.OK
      );
    } catch (error) {
      throw error;
    }
  }
}
