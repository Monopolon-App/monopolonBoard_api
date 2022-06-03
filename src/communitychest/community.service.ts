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
import { Community } from './community.entity';
import { UpdateCommunityDto } from './dto/update-community.dto';

@Injectable()
export class CommunityService {
  monthToDays(arg0: number) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>
  ) {}

  async getById(userId: number): Promise<any> {
    try {
      const user = await this.communityRepository.findOne({ id: userId });

      if (user) {
        return 'data';
      }

      return new HttpException(
        'community does not exist',
        HttpStatus.NOT_FOUND
      );
    } catch (error) {
      throw error;
    }
  }

  async createCommunity(
    community: Community,
    files: Array<Express.Multer.File>
  ): Promise<any> {
    try {
      const communities = await this.communityRepository.save(community);
      return {
        success: true,
        message: 'community created successfully.',
        result: communities,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getUserById(walletAddress: string): Promise<any> {
    try {
      const [user, count] = await this.communityRepository.findAndCount({
        where: { walletAddress },
      });

      if (count > 0) {
        return new HttpException(
          {
            status: HttpStatus.OK,
            message: 'Success',
            data: user,
          },
          HttpStatus.OK
        );
      }
      return new HttpException('community not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async updateCommunity(
    walletAddress: string,
    communityData: UpdateCommunityDto
  ): Promise<any> {
    try {
      const community = new Community();
      community.walletAddress = walletAddress;
      await this.communityRepository.update(
        { walletAddress: walletAddress },
        community
      );

      const updatesRecord = await this.communityRepository.findOne({
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
