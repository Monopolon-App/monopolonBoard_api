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
import { EnterGame } from './entergame.entity';
import { UpdateEnterGameDto } from './dto/update-entergame.dto';

@Injectable()
export class EnterGameService {
  constructor(
    @InjectRepository(EnterGame)
    private readonly EnterGameRepository: Repository<EnterGame>
  ) {}

  async getById(walletAddress: string): Promise<any> {
    try {
      const user = await this.EnterGameRepository.findOne({
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

  async createEnterGame(
    enterGames: EnterGame,
    files: Array<Express.Multer.File>
  ): Promise<any> {
    try {
      const game = await this.EnterGameRepository.save(enterGames);
      return {
        success: true,
        message: 'EnterGame created successfully.',
        result: game,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getUserById(walletAddress: string): Promise<any> {
    try {
      const [user, count] = await this.EnterGameRepository.findAndCount({
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

  async updateEnterGame(
    walletAddress: string,
    EnterGameData: UpdateEnterGameDto
  ): Promise<any> {
    try {
      const user = new EnterGame();
      user.walletAddress = walletAddress;
      await this.EnterGameRepository.update(
        { walletAddress: walletAddress },
        EnterGameData
      );

      const updatesRecord = await this.EnterGameRepository.findOne({
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
