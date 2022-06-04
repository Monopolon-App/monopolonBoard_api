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
import { PlayerEarning } from './playerearning.entity';
import { UpdatePlayerEarningDto } from './dto/update-player-earning.dto';

@Injectable()
export class PlayerEarningService {
  monthToDays(arg0: number) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(PlayerEarning)
    private readonly PlayearningRepository: Repository<PlayerEarning>
  ) {}

  async getPlayearningById(walletAddress: string): Promise<any> {
    try {
      const user = await this.PlayearningRepository.findOne({
        walletAddress: walletAddress,
      });
      if (user) {
        return {
          success: true,
          message: 'playearEarning Listed.',
          result: user,
        };
      } else {
        return new HttpException('User does not exist', HttpStatus.NOT_FOUND);
      }
    } catch (error) {
      throw error;
    }
  }

  async createPlayearning(
    playerEarning: PlayerEarning,
    files: Array<Express.Multer.File>
  ): Promise<any> {
    try {
      const playearEarning = await this.PlayearningRepository.save(
        playerEarning
      );
      return {
        success: true,
        message: 'playearEarning created successfully.',
        result: playearEarning,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getUserById(walletAddress: string): Promise<any> {
    try {
      const [user, count] = await this.PlayearningRepository.findAndCount({
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

  async updatPlayseEarning(
    walletAddress: string,
    udatePlayerEarningDto: UpdatePlayerEarningDto
  ): Promise<any> {
    try {
      const user = new PlayerEarning();
      user.walletAddress = walletAddress;
      await this.PlayearningRepository.update(
        { walletAddress: walletAddress },
        udatePlayerEarningDto
      );

      const updatesRecord = await this.PlayearningRepository.findOne({
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
