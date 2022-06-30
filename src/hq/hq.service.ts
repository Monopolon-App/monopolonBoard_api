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
import { Looting } from '../looting/looting.entity';
import {
  Transaction,
  TransactionType,
} from '../transaction/transaction.entity';
import { UsersProfile } from '../usersprofile/usersprofile.entity';
import { LootingService } from '../looting/looting.service';

@Injectable()
export class HqService {
  monthToDays(arg0: number) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(Hq)
    private readonly HqRepository: Repository<Hq>,
    private readonly lootingService: LootingService
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
      relations: ['team', 'user'],

      // we have to update there status is available and we have to add the code comment here so we can understand
      where: { hqGridPosition, status: 1 },
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

  /**
   * one User can loot only 3 Times. if they dont choose mining LastMinTime will be true then he can loot
   * if LastMinTime will be true then can loot so we have to add the condition in the create looting API here
   * @param looting
   */
  async createLooting(looting: Looting): Promise<any> {
    try {
      const hqId = looting.hq;
      const amount = looting.amount;
      return getManager().transaction(async (transactionalEntityManager) => {
        const hq = await getConnection()
          .createQueryBuilder()
          .select('hq')
          .from(Hq, 'hq')
          .where('hq.id = :id', {
            id: hqId,
          })
          .getOne();

        const user = await getConnection()
          .createQueryBuilder()
          .select('users_profile')
          .from(UsersProfile, 'users_profile')
          .where('users_profile.walletAddress = :walletAddress', {
            walletAddress: looting.walletAddress,
          })
          .getOne();

        if (hq.status === 0) {
          throw new HttpException(
            'This Hq is Being looted',
            HttpStatus.BAD_REQUEST
          );
        }

        if (!user) {
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        await transactionalEntityManager
          .createQueryBuilder(Hq, 'hq')
          .setLock('pessimistic_write')
          .update(Hq)
          .set({
            status: 0,
          })
          .where('hq.id = :id', {
            id: hqId,
          })
          .execute();

        const tTransferTransaction = new Transaction();
        tTransferTransaction.amount = `-${amount}`;
        tTransferTransaction.type = TransactionType.LOOTED;
        tTransferTransaction.walletAddress = hq.walletAddress;
        tTransferTransaction.userId = hq.userId;
        await transactionalEntityManager.save(tTransferTransaction);

        const tTransferTransactionForLootingUser = new Transaction();
        tTransferTransactionForLootingUser.amount = amount;
        tTransferTransactionForLootingUser.type = TransactionType.LOOTING;
        tTransferTransactionForLootingUser.walletAddress =
          looting.walletAddress;
        tTransferTransactionForLootingUser.userId = user.id;
        await transactionalEntityManager.save(
          tTransferTransactionForLootingUser
        );

        const lootings = new Looting();
        lootings.walletAddress = looting.walletAddress;
        lootings.userId = user.id;
        lootings.gridPosition = hq.hqGridPosition;
        lootings.amount = looting.amount;
        lootings.hq = hq;
        return transactionalEntityManager.save(lootings);
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async updateLooting(lootingId: number): Promise<any> {
    try {
      return getManager().transaction(async (transactionalEntityManager) => {
        const looting = await this.lootingService.getLootingById(lootingId);

        if (!looting) {
          throw new HttpException('looting not found', HttpStatus.NOT_FOUND);
        }
        const hqId = looting.hq.id;

        if (looting.hq.status === 1) {
          throw new HttpException(
            'User is already available to loot',
            HttpStatus.BAD_REQUEST
          );
        }

        return await transactionalEntityManager
          .createQueryBuilder(Hq, 'hq')
          .update(Hq)
          .set({
            status: 1,
          })
          .where('hq.id = :id', {
            id: hqId,
          })
          .execute();
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
