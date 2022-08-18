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
import { Transaction, TransactionType } from './transaction.entity';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TeamService {
  monthToDays(arg0: number) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>
  ) {}

  async getById(walletAddress: string): Promise<any> {
    try {
      const user = await this.transactionRepository.findOne({
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

  async createTransaction(
    transactions: Transaction,
    files: Array<Express.Multer.File>
  ): Promise<any> {
    try {
      const transaction = await this.transactionRepository.save(transactions);
      return {
        success: true,
        message: 'Transaction created successfully.',
        result: transaction,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getTransactionById(walletAddress: string): Promise<any> {
    try {
      const [user, count] = await this.transactionRepository.findAndCount({
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

  async updateTransaction(
    walletAddress: string,
    TransactionData: UpdateTransactionDto
  ): Promise<any> {
    try {
      const user = new Transaction();
      user.walletAddress = walletAddress;
      await this.transactionRepository.update(
        { walletAddress: walletAddress },
        TransactionData
      );

      const updatesRecord = await this.transactionRepository.findOne({
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

  async getLootingHistoryByWalletAddress(
    walletAddress: string,
    type: TransactionType
  ): Promise<any> {
    try {
      const lootingHistory = await getManager().transaction(
        async (transactionalEntityManager) => {
          return await transactionalEntityManager
            .createQueryBuilder(Transaction, 'transaction')
            .setLock('pessimistic_write')
            .where('transaction.walletAddress = :walletAddress', {
              walletAddress: walletAddress,
            })
            .andWhere('transaction.type = :type', {
              type: type,
            })
            .getMany();
        }
      );

      if (!lootingHistory.length) {
        throw new HttpException(
          'No looting History found for this walletAddress',
          HttpStatus.NOT_FOUND
        );
      }

      return lootingHistory;
    } catch (error) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
