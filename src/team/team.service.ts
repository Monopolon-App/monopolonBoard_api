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
import { Team } from './team.entity';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamService {
  monthToDays(arg0: number) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(Team)
    private readonly TeamRepository: Repository<Team>
  ) {}

  async getById(userId: number): Promise<any> {
    try {
      const user = await this.TeamRepository.findOne({ id: userId });

      if (user) {
        return 'data';
      }

      return new HttpException('User does not exist', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw error;
    }
  }

  async createTeam(
    grid: Team,
    files: Array<Express.Multer.File>
  ): Promise<any> {
    try {
      console.log('files services=======', files);
      const userProfile = await this.TeamRepository.save(grid);
      return {
        success: true,
        message: 'UserProfile created successfully.',
        result: userProfile,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getTeamById(id: number): Promise<any> {
    try {
      const [user, count] = await this.TeamRepository.findAndCount({
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

  async updateTeam(userId: number, teamData: UpdateTeamDto): Promise<any> {
    try {
      const user = new Team();
      user.id = userId;
      await this.TeamRepository.update({ id: userId }, teamData);

      const updatesRecord = await this.TeamRepository.findOne({ id: userId });

      return new HttpException(
        { message: 'Updated Successfully', data: updatesRecord },
        HttpStatus.NO_CONTENT
      );
    } catch (error) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
