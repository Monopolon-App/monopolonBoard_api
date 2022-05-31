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

  async getById(userId: number): Promise<any> {
    try {
      const user = await this.EnterGameRepository.findOne({ id: userId });

      if (user) {
        return 'data';
      }

      return new HttpException('User does not exist', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw error;
    }
  }

  async createEnterGame(
    userprofile: EnterGame,
    files: Array<Express.Multer.File>
  ): Promise<any> {
    try {
      const userProfile = await this.EnterGameRepository.save(userprofile);
      return {
        success: true,
        message: 'UserProfile created successfully.',
        result: userProfile,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getUserById(id: number): Promise<any> {
    try {
      const [user, count] = await this.EnterGameRepository.findAndCount({
        where: { id },
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
    userId: number,
    EnterGameData: UpdateEnterGameDto
  ): Promise<any> {
    try {
      const user = new EnterGame();
      user.id = userId;
      await this.EnterGameRepository.update({ id: userId }, EnterGameData);

      const updatesRecord = await this.EnterGameRepository.findOne({
        id: userId,
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
