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
import { Grid } from './grid.entity';
import { UpdateGridDto } from './dto/update-grid.dto';

@Injectable()
export class GridService {
  monthToDays(arg0: number) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(Grid)
    private readonly usersRepository: Repository<Grid>
  ) {}

  async getById(userId: number): Promise<any> {
    try {
      const user = await this.usersRepository.findOne({ id: userId });

      if (user) {
        return 'data';
      }

      return new HttpException('User does not exist', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw error;
    }
  }

  async createUser(
    grid: Grid,
    files: Array<Express.Multer.File>
  ): Promise<any> {
    try {
      console.log('files services=======', files);
      const userProfile = await this.usersRepository.save(grid);
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
      const [user, count] = await this.usersRepository.findAndCount({
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

  async updateUserProfile(
    userId: number,
    gridData: UpdateGridDto
  ): Promise<any> {
    try {
      const user = new Grid();
      user.id = userId;
      await this.usersRepository.update({ id: userId }, gridData);

      const updatesRecord = await this.usersRepository.findOne({ id: userId });

      return new HttpException(
        { message: 'Updated Successfully', data: updatesRecord },
        HttpStatus.NO_CONTENT
      );
    } catch (error) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
