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

      return new HttpException('User does not exist', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw error;
    }
  }

  async createFortune(
    fortune: Fortune,
    files: Array<Express.Multer.File>
  ): Promise<any> {
    try {
      console.log('files services=======', files);
      const userProfile = await this.fortuneRepository.save(fortune);
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
      const [user, count] = await this.fortuneRepository.findAndCount({
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

  async updateFortune(Id: number, fortuneData: UpdateFortuneDto): Promise<any> {
    try {
      const user = new Fortune();
      user.id = Id;
      await this.fortuneRepository.update({ id: Id }, fortuneData);

      const updatesRecord = await this.fortuneRepository.findOne({ id: Id });

      return new HttpException(
        { message: 'Updated Successfully', data: updatesRecord },
        HttpStatus.NO_CONTENT
      );
    } catch (error) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
