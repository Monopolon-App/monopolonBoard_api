import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Withdrawal } from '../withdrawal/withdrawal.entity';
import { getManager, Repository } from 'typeorm';
import { Transaction } from '../transaction/transaction.entity';
import { ListenerService } from './listeners.service';
import { MGM_REWARD_COMPANY_ADDRESS } from '../constants/constants';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(Withdrawal)
    private readonly withdrwalRepository: Repository<Withdrawal>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly listenerService: ListenerService
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  handleCron() {
    this.logger.debug('Called when the current second is 5 minutes');
    this.withdrwalRepository
      .find({ where: { status: 'Approved' } })
      .then((withdrwals) => {
        for (const withdrawal of withdrwals) {
          try {
            getManager().transaction(async (transactionalEntityManager) => {
              return transactionalEntityManager
                .createQueryBuilder(Withdrawal, 'withdrawal')
                .setLock('pessimistic_write')
                .where('withdrawal.id = :id', {
                  id: withdrawal.id,
                })
                .getOne()
                .then(async (withdrawal) => {
                  // transferring the withdrawal amount to user wallet address from company address
                  try {
                    await this.listenerService.transferMgmReward(
                      withdrawal.walletAddress,
                      parseInt(withdrawal.amount)
                    );
                  } catch (error) {
                    return new HttpException(
                      error?.message,
                      HttpStatus.BAD_REQUEST
                    );
                  }

                  //TODO: if transfer will fail then updating the Withdrawal status to fail?
                  const tTransferTransaction = new Transaction();
                  tTransferTransaction.amount = withdrawal.amount;
                  tTransferTransaction.walletAddress = withdrawal.walletAddress;
                  tTransferTransaction.fromAddress = MGM_REWARD_COMPANY_ADDRESS;
                  tTransferTransaction.userId = parseInt(withdrawal.userId);
                  tTransferTransaction.description = `Transfer ${withdrawal.amount} to ${withdrawal.walletAddress}`;

                  //Transfer : Create transaction record (update its balance)
                  const tTransferTransactionObj =
                    await this.transactionRepository.save(tTransferTransaction);

                  // updating Withdrawal if transaction is successfully done.
                  if (tTransferTransactionObj) {
                    await transactionalEntityManager
                      .createQueryBuilder(Withdrawal, 'withdrawal')
                      .update(Withdrawal)
                      .set({ status: 'Success' })
                      .where('withdrawal.id = :id', {
                        id: withdrawal.id,
                      })
                      .execute();
                  }
                })
                .catch((error) => {
                  console.log(`::LOG::ERROR::${error?.message}:`);
                  return new HttpException(
                    error?.message,
                    HttpStatus.BAD_REQUEST
                  );
                });
            });
          } catch (error) {}
        }
      });
  }
}
