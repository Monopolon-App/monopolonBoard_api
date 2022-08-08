import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WithdrawalHistory } from './withdrawalHistory.entity';
import { UpdateWithdrawalHistoryDto } from './dto/update-withdrawalHistory.dto';

@Injectable()
export class WithdrawalHistoryService {
  constructor(
    @InjectRepository(WithdrawalHistory)
    private readonly withdrawalHistoryRepository: Repository<WithdrawalHistory>
  ) {}

  async getById(walletAddress: string): Promise<any> {
    try {
      const user = await this.withdrawalHistoryRepository.findOne({
        walletAddress: walletAddress,
      });

      if (user) {
        return {
          success: true,
          message: 'Withdrawal history get successfully.',
          result: user,
        };
      }
      return new HttpException(
        'Withdrawal history does not exist',
        HttpStatus.NOT_FOUND
      );
    } catch (error) {
      throw error;
    }
  }

  async createWithdrawalHistory(
    withdrawalHistory: WithdrawalHistory
  ): Promise<any> {
    try {
      const withdrawals = await this.withdrawalHistoryRepository.save(
        withdrawalHistory
      );
      return {
        success: true,
        message: 'Withdrawal history created successfully.',
        result: withdrawals,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getWithdrawalHistoryByWalletAddress(
    walletAddress: string
  ): Promise<any> {
    try {
      const [user, count] = await this.withdrawalHistoryRepository.findAndCount(
        {
          where: { walletAddress },
        }
      );

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

  async updateWithdrawalHistory(
    walletAddress: string,
    withdrawalData: UpdateWithdrawalHistoryDto
  ): Promise<any> {
    try {
      const user = new WithdrawalHistory();
      user.walletAddress = walletAddress;
      await this.withdrawalHistoryRepository.update(
        { walletAddress: walletAddress },
        withdrawalData
      );

      const updatesRecord = await this.withdrawalHistoryRepository.findOne({
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
