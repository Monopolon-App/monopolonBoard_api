import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  Repository,
  getConnection,
  getManager,
  TreeRepository,
  Like,
} from 'typeorm';
import { UsersProfile } from './usersprofile.entity';
import { UpdateUserDto } from './dto/update-user-profile.dto';

@Injectable()
export class UsersProfileService {
  constructor(
    @InjectRepository(UsersProfile)
    private readonly usersRepository: Repository<UsersProfile>
  ) {}

  async getById(walletAddress: string): Promise<any> {
    try {
      const user = await this.usersRepository.findOne({
        walletAddress: walletAddress,
      });
      if (user) {
        return 'data';
      }
      return new HttpException('User does not exist', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw error;
    }
  }

  async createUser(
    userprofile: UsersProfile,
    files: Array<Express.Multer.File>
  ): Promise<any> {
    try {
      const userProfile = await this.usersRepository.save(userprofile);
      return {
        success: true,
        message: 'UserProfile created successfully.',
        result: userProfile,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getUserById(walletAddress: string): Promise<any> {
    try {
      const user = await this.usersRepository.findOne({
        relations: ['character'],
        where: { walletAddress },
      });
      return new HttpException(
        {
          status: HttpStatus.OK,
          message: 'Success',
          data: user,
        },
        HttpStatus.OK
      );
    } catch (error) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
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
}
