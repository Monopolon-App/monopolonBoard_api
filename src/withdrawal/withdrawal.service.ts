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
import { WithdrawalHistory } from '../withdrawalHistory/withdrawalHistory.entity';

@Injectable()
export class WithdrawalService {
  monthToDays(arg0: number) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(Withdrawal)
    private readonly withdrwalRepository: Repository<Withdrawal>,
    @InjectRepository(WithdrawalHistory)
    private readonly withdrawalHistoryRepository: Repository<WithdrawalHistory> // private readonly withdrawalHistoryService: WithdrawalHistoryService
  ) {}

  async getById(walletAddress: string): Promise<any> {
    try {
      const user = await this.withdrwalRepository.findOne({
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

  async createWithdrawal(
    withdrawal: Withdrawal,
    files: Array<Express.Multer.File>
  ): Promise<any> {
    try {
      const withdrawals = await this.withdrwalRepository.save(withdrawal);
      const withdrawalHistoryDto = {
        userId: withdrawals.userId,
        amount: withdrawals.amount,
        status: withdrawals.status,
        walletAddress: withdrawals.walletAddress,
        withdrawal: withdrawals,
      };

      await this.withdrawalHistoryRepository.save(withdrawalHistoryDto);

      return {
        success: true,
        message: 'Withdrawal created successfully.',
        result: withdrawals,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getUserById(walletAddress: string): Promise<any> {
    try {
      const [user, count] = await this.withdrwalRepository.findAndCount({
        relations: ['withdrawalHistory'],
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
      await this.withdrwalRepository.update(
        { walletAddress: walletAddress },
        withdrawalData
      );

      const updatesRecord = await this.withdrwalRepository.findOne({
        walletAddress: walletAddress,
      });

      const withdrawalHistoryDto = {
        userId: updatesRecord.userId,
        amount: updatesRecord.amount,
        status: updatesRecord.status,
        walletAddress: updatesRecord.walletAddress,
        withdrawal: updatesRecord,
      };

      const withdrawalHistory = await this.withdrawalHistoryRepository.save(
        withdrawalHistoryDto
      );

      return new HttpException(
        { message: 'Updated Successfully', data: updatesRecord },
        HttpStatus.NO_CONTENT
      );
    } catch (error) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
