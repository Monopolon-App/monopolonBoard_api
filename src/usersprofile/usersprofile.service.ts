import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { UsersProfile } from './usersprofile.entity';
import { UpdateUserDto } from './dto/update-user-profile.dto';

@Injectable()
export class UsersProfileService {
  constructor(
    @InjectRepository(UsersProfile)
    private readonly usersRepository: Repository<UsersProfile>
  ) {}

  async getByWalletAddress(walletAddress: string): Promise<any> {
    try {
      const user = await this.usersRepository.findOne({
        walletAddress: walletAddress,
      });
      if (user) {
        return user;
      }

      throw new HttpException('User does not exist', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(error?.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getById(id: number): Promise<any> {
    try {
      const user = await this.usersRepository.findOne({
        id,
      });
      if (user) {
        return user;
      }
      throw new HttpException('User does not exist', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(error?.message, HttpStatus.BAD_REQUEST);
    }
  }

  async createUserProfile(
    userprofile: UsersProfile,
    files: Array<Express.Multer.File>
  ): Promise<any> {
    try {
      const userProfile = await this.usersRepository.save(userprofile);
      return userProfile;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async updateUserProfile(
    walletAddress: string,
    userData: UpdateUserDto
  ): Promise<any> {
    try {
      const user = new UsersProfile();
      user.walletAddress = walletAddress;
      await this.usersRepository.update(
        { walletAddress: walletAddress },
        userData
      );

      const updatesRecord = await this.usersRepository.findOne({
        walletAddress: walletAddress,
      });

      return new HttpException(
        { message: 'Updated Successfully', data: updatesRecord },
        HttpStatus.NO_CONTENT
      );
    } catch (error) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async setCurrentRefreshToken(refreshToken: string, userId: number) {
    const currentHashedRefreshToken = await bcrypt.hashSync(refreshToken, 10);
    await this.usersRepository.update(
      { id: userId },
      {
        currentHashedRefreshToken,
      }
    );
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, userId: number) {
    const user = await this.usersRepository.findOne({ id: userId });

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.currentHashedRefreshToken
    );

    if (!isRefreshTokenMatching) {
      throw new HttpException('Incorrect refresh token!', HttpStatus.FORBIDDEN);
    }

    return user;
  }

  async removeRefreshToken(userId: number) {
    return this.usersRepository.update(
      { id: userId },
      {
        currentHashedRefreshToken: null,
      }
    );
  }
}
