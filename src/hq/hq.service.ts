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
import { Hq } from './hq.entity';
import { UpdateHqDto } from './dto/update-hq.dto';

@Injectable()
export class HqService {
  monthToDays(arg0: number) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(Hq)
    private readonly HqRepository: Repository<Hq>
  ) {}

  async getById(walletAddress: string): Promise<any> {
    try {
      const user = await this.HqRepository.findOne({
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

  async createHq(hq: Hq, files: Array<Express.Multer.File>): Promise<any> {
    try {
      const hQ = await this.HqRepository.save(hq);
      return {
        success: true,
        message: 'HQ created successfully.',
        result: hQ,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getHqById(walletAddress: string): Promise<any> {
    try {
      const [user, count] = await this.HqRepository.findAndCount({
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

  async updateHq(walletAddress: string, hqData: UpdateHqDto): Promise<any> {
    try {
      const user = new Hq();
      user.walletAddress = walletAddress;
      await this.HqRepository.update({ walletAddress: walletAddress }, hqData);

      const updatesRecord = await this.HqRepository.findOne({
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

  async getHqByGridPosition(hqGridPosition: number): Promise<any> {
    const [hq] = await this.HqRepository.findAndCount({
      where: { hqGridPosition },
    });
    // here we get All the Hqs for particular gridPosition
    return new HttpException(
      {
        status: HttpStatus.OK,
        message: 'Success',
        data: hq,
      },
      HttpStatus.OK
    );
  }
}
