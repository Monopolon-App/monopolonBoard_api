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
import { Withdrawal } from './withdrawal.entity';
import { UpdateWithdrawalDto } from './dto/update-withdrawal.dto';

@Injectable()
export class WithdrawalService {
  monthToDays(arg0: number) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(Withdrawal)
    private readonly fortuneRepository: Repository<Withdrawal>
  ) {}

  async getById(walletAddress: string): Promise<any> {
    try {
      const user = await this.fortuneRepository.findOne({
        walletAddress: walletAddress,
      });

      if (user) {
        return {
          success: true,
          message: 'Withdrawal get successfully.',
          result: user,
        };
      }
      return new HttpException(
        'Withdrawal does not exist',
        HttpStatus.NOT_FOUND
      );
    } catch (error) {
      throw error;
    }
  }

  async createWithdrawa(
    withdrawal: Withdrawal,
    files: Array<Express.Multer.File>
  ): Promise<any> {
    try {
      const fortunecard = await this.fortuneRepository.save(withdrawal);
      return {
        success: true,
        message: 'Withdrawal created successfully.',
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

  async updateWithdrawal(
    walletAddress: string,
    withdrawalData: UpdateWithdrawalDto
  ): Promise<any> {
    try {
      const user = new Withdrawal();
      user.walletAddress = walletAddress;
      await this.fortuneRepository.update(
        { walletAddress: walletAddress },
        withdrawalData
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
