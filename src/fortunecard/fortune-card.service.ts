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
import { Fortune } from './fortune-card.entity';
import { UpdateFortuneDto } from './dto/update-fortune-card.dto';

@Injectable()
export class FortuneService {
  monthToDays(arg0: number) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(Fortune)
    private readonly fortuneRepository: Repository<Fortune>
  ) {}

  async getById(userId: number): Promise<any> {
    try {
      const user = await this.fortuneRepository.findOne({ id: userId });

      if (user) {
        return 'data';
      }

      return new HttpException(
        'fortunecard does not exist',
        HttpStatus.NOT_FOUND
      );
    } catch (error) {
      throw error;
    }
  }

  async createFortune(
    fortune: Fortune,
    files: Array<Express.Multer.File>
  ): Promise<any> {
    try {
      const fortunecard = await this.fortuneRepository.save(fortune);
      return {
        success: true,
        message: 'fortunecard created successfully.',
        result: fortunecard,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getUserById(walletAddress: string): Promise<any> {
    try {
      const [user, count] = await this.fortuneRepository.findAndCount({
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
      return new HttpException('User not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async updateFortune(
    walletAddress: string,
    fortuneData: UpdateFortuneDto
  ): Promise<any> {
    try {
      const user = new Fortune();
      user.walletAddress = walletAddress;
      await this.fortuneRepository.update(
        { walletAddress: walletAddress },
        fortuneData
      );

      const updatesRecord = await this.fortuneRepository.findOne({
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
