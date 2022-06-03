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

  async getById(walletAddress: string): Promise<any> {
    try {
      const user = await this.TeamRepository.findOne({
        walletAddress: walletAddress,
      });

      if (user) {
        return 'data';
      }

      return new HttpException('Team does not exist', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw error;
    }
  }

  async createTeam(
    teams: Team,
    files: Array<Express.Multer.File>
  ): Promise<any> {
    try {
      const Team = await this.TeamRepository.save(teams);
      return {
        success: true,
        message: 'Team created successfully.',
        result: Team,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getTeamById(walletAddress: string): Promise<any> {
    try {
      const [user, count] = await this.TeamRepository.findAndCount({
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
      return new HttpException('Team not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async updateTeam(
    walletAddress: string,
    teamData: UpdateTeamDto
  ): Promise<any> {
    try {
      const user = new Team();
      user.walletAddress = walletAddress;
      await this.TeamRepository.update(
        { walletAddress: walletAddress },
        teamData
      );

      const updatesRecord = await this.TeamRepository.findOne({
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
