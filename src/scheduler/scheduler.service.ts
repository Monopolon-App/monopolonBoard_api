import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import Web3 from 'web3';
import { InjectRepository } from '@nestjs/typeorm';
import { getConnection, getManager, Repository } from 'typeorm';
import { Contract } from 'web3-eth-contract';
import HDWalletProvider from '@truffle/hdwallet-provider';
import * as _ from 'lodash';
import { ConfigService } from '@nestjs/config';

import {
  Transaction,
  TransactionType,
} from 'src/transaction/transaction.entity';
import { Withdrawal } from 'src/withdrawal/withdrawal.entity';
import {
  MGM_CONTRACT_ADDRESS,
  RPC_PROVIDER_URL,
} from 'src/constants/constants';
import mgmContractAbi from './constants/mgmContractAbi.json';
import { UsersProfile } from 'src/usersprofile/usersprofile.entity';
import { WithdrawalHistory } from '../withdrawalHistory/withdrawalHistory.entity';

declare interface PromiseConstructor {
  allSettled(
    promises: Array<Promise<any>>
  ): Promise<
    Array<{ status: 'fulfilled' | 'rejected'; value?: any; reason?: any }>
  >;
}

export interface WithdrawalHistoryParams {
  userId: string;
  amount: string;
  status: string;
  walletAddress: string;
  withdrawal: Withdrawal;
}

@Injectable()
export class SchedulerService {
  private web3;
  private mgmContract: Contract;
  private account;
  private hdProvider;
  public networkMode;
  private companyPrivateKey;
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Withdrawal)
    private readonly withdrwalRepository: Repository<Withdrawal>
  ) {
    this.networkMode =
      this.configService.get('ENV_TAG') === 'production'
        ? 'MAINNET'
        : 'TESTNET';

    this.companyPrivateKey = this.configService.get('COMPANY_PRIVATE_KEY');

    this.hdProvider = new HDWalletProvider(
      this.companyPrivateKey,
      RPC_PROVIDER_URL[this.networkMode],
      0,
      1
    );

    this.web3 = new Web3(this.hdProvider);

    this.account = this.web3.eth.accounts.privateKeyToAccount(
      this.companyPrivateKey
    );

    this.mgmContract = new this.web3.eth.Contract(
      mgmContractAbi as any,
      MGM_CONTRACT_ADDRESS[this.networkMode] as any,
      {
        from: this.account.address,
      }
    );
  }

  async createWithdrawalHistory(
    transactionalEntityManager,
    withdrawal: WithdrawalHistoryParams
  ): Promise<any> {
    const withdrawalHistory = new WithdrawalHistory();
    withdrawalHistory.userId = withdrawal.userId;
    withdrawalHistory.amount = withdrawal.amount;
    withdrawalHistory.status = withdrawal.status;
    withdrawalHistory.walletAddress = withdrawal.walletAddress;
    withdrawalHistory.withdrawal = withdrawal.withdrawal;

    //WithdrawalHistory : Create WithdrawalHistory record.
    return await transactionalEntityManager.save(withdrawalHistory);
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  handleCron() {
    this.logger.debug('Called when the current second is 5 minutes');
    this.withdrwalRepository
      .find({ where: { status: 'Approved' } })
      .then((withdrwals) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore

        if (withdrwals.length) {
          this.logger.verbose(
            `Withdrawal::findApprovedWithdrawal::results::Found > ${JSON.stringify(
              withdrwals
            )}`
          );
          return Promise.all(
            withdrwals.map(async (withdrawal) => {
              try {
                const withdrawalRecord = await getConnection()
                  .createQueryBuilder(Withdrawal, 'withdrawal')
                  .where('withdrawal.id = :id', {
                    id: withdrawal.id,
                  })
                  .getOne();

                const toWalletAddress = _.get(
                  withdrawalRecord,
                  'walletAddress',
                  '0000-00-00 00:00:00'
                );
                const amountWei = this.web3.utils.toWei(
                  withdrawalRecord.amount
                );

                let withdrawalStatus;

                // transferring the withdrawal amount to user wallet address from company address
                this.logger.verbose(
                  `Withdrawal:transferMgmReward:params:${JSON.stringify({
                    to: toWalletAddress,
                    amount: amountWei,
                    from: this.account.address,
                  })}`
                );

                // eslint-disable-next-line @typescript-eslint/no-this-alias
                const self = this;

                this.mgmContract.methods
                  .transfer(toWalletAddress, amountWei)
                  .send({ from: this.account.address })
                  .on('transactionHash', async function (hash) {
                    /**
                     * when we get the Transaction but confirmation is waiting then we will get this hash but this is not 100%correct may be
                     * according to the blockchain. we have to wait for 3 confirmation
                     */

                    try {
                      self.logger.debug(
                        `Withdrawal::transferMgmReward::transactionHash:${JSON.stringify(
                          {
                            hash,
                          }
                        )}`
                      );

                      await getManager().transaction(
                        async (transactionalEntityManager) => {
                          withdrawalStatus = await transactionalEntityManager
                            .createQueryBuilder(Withdrawal, 'withdrawal')
                            .update(Withdrawal)
                            .set({
                              status: 'Processing',
                              hash: hash,
                            })
                            .where('withdrawal.id = :id', {
                              id: withdrawalRecord.id,
                            })
                            .execute();

                          const history = await self.createWithdrawalHistory(
                            transactionalEntityManager,
                            {
                              amount: withdrawalRecord.amount,
                              status: 'Processing',
                              userId: withdrawalRecord.userId,
                              walletAddress: withdrawalRecord.walletAddress,
                              withdrawal: withdrawalRecord,
                            }
                          );

                          self.logger.verbose(
                            `Witdrawal::transferMgmReward::Status::Proceess:${JSON.stringify(
                              withdrawalStatus
                            )}:`
                          );
                        }
                      );
                    } catch (error) {
                      self.logger.error(
                        `Witdrawal::transferMgmReward::Error::${error?.message}:`
                      );

                      return new HttpException(
                        error?.message,
                        HttpStatus.BAD_REQUEST
                      );
                    }
                  })
                  // .on(
                  //   'confirmation',
                  //   async function (confirmationNumber, receipt) {
                  //     self.logger.warn(
                  //       `Witdrawal::transferMgmReward::confirmation:${JSON.stringify(
                  //         {
                  //           confirmationNumber,
                  //           receipt,
                  //         }
                  //       )}`
                  //     );
                  //   }
                  // )
                  .on('receipt', async function (receipt) {
                    /**
                     * When Transaction is Successful then we will get the Event from here
                     */
                    self.logger.log(
                      `Withdrawal::transferMgmReward::receipt:${JSON.stringify(
                        receipt
                      )}`
                    );

                    await getManager().transaction(
                      async (transactionalEntityManager) => {
                        const tTransferTransaction = new Transaction();
                        tTransferTransaction.amount = withdrawal.amount;
                        tTransferTransaction.type = TransactionType.WITHDRAWAL;
                        tTransferTransaction.hash = receipt?.transactionHash;
                        tTransferTransaction.walletAddress =
                          withdrawal.walletAddress;
                        tTransferTransaction.fromAddress = self.account.address;
                        tTransferTransaction.userId = parseInt(
                          withdrawal.userId
                        );
                        tTransferTransaction.description = `Success: Transfer ${withdrawal.amount} to ${withdrawal.walletAddress}`;

                        //Transfer : Create transaction record (update its balance)
                        const tTransferTransactionObj =
                          await transactionalEntityManager.save(
                            tTransferTransaction
                          );

                        self.logger.log(
                          `Withdrawal::transferMgmReward::createTrx::Success:${JSON.stringify(
                            tTransferTransactionObj
                          )}`
                        );

                        // updating Withdrawal if transaction is successfully done.
                        if (tTransferTransactionObj) {
                          withdrawalStatus = await transactionalEntityManager
                            .createQueryBuilder(Withdrawal, 'withdrawal')
                            .update(Withdrawal)
                            .set({ status: 'Success' })
                            .where('withdrawal.id = :id', {
                              id: withdrawalRecord.id,
                            })
                            .execute();

                          const history = await self.createWithdrawalHistory(
                            transactionalEntityManager,
                            {
                              amount: withdrawalRecord.amount,
                              status: 'Success',
                              userId: withdrawalRecord.userId,
                              walletAddress: withdrawalRecord.walletAddress,
                              withdrawal: withdrawalRecord,
                            }
                          );

                          self.logger.log(
                            `Withdrawal::transferMgmReward::Status::Success:${JSON.stringify(
                              withdrawalStatus
                            )}`
                          );
                        }
                      }
                    );
                  })
                  .on('error', async function (error, receipt) {
                    /**
                     * when we get the Error from the Transfering the MGM reward
                     */
                    self.logger.error(
                      `Withdrawal::transferMgmReward::Error:${JSON.stringify({
                        error,
                        receipt,
                      })}`
                    );

                    await getManager().transaction(
                      async (transactionalEntityManager) => {
                        const tTransferTransaction = new Transaction();
                        tTransferTransaction.amount = withdrawal.amount;
                        tTransferTransaction.walletAddress =
                          withdrawal.walletAddress;
                        tTransferTransaction.fromAddress = self.account.address;
                        tTransferTransaction.userId = parseInt(
                          withdrawal.userId
                        );
                        tTransferTransaction.type = TransactionType.WITHDRAWAL;
                        tTransferTransaction.description = `Failed: Transfer ${withdrawal.amount} to ${withdrawal.walletAddress}`;
                        tTransferTransaction.hash = receipt?.hash;

                        //Transfer : Create transaction record (update its balance)
                        const tTransferTransactionObj =
                          await transactionalEntityManager.save(
                            tTransferTransaction
                          );

                        if (tTransferTransactionObj) {
                          withdrawalStatus = await transactionalEntityManager
                            .createQueryBuilder(Withdrawal, 'withdrawal')
                            .update(Withdrawal)
                            .set({ status: 'Failed' })
                            .where('withdrawal.id = :id', {
                              id: withdrawalRecord.id,
                            })
                            .execute();

                          const history = await self.createWithdrawalHistory(
                            transactionalEntityManager,
                            {
                              amount: withdrawalRecord.amount,
                              status: 'Failed',
                              userId: withdrawalRecord.userId,
                              walletAddress: withdrawalRecord.walletAddress,
                              withdrawal: withdrawalRecord,
                            }
                          );
                        }
                      }
                    );
                  })
                  .then((result) => {
                    this.logger.verbose(
                      `Withdrawal::transferMgmReward::Status::Success:${JSON.stringify(
                        withdrawal
                      )}`
                    );
                    return result;
                  })
                  .catch((error) => {
                    this.logger.error(`Withdrawal::Error:${error?.message}:`);
                    throw new HttpException(
                      error?.message,
                      HttpStatus.BAD_REQUEST
                    );
                  });

                return withdrawalStatus;
              } catch (error) {
                this.logger.error(`Withdrawal::Error: ${error?.message}:`);
                throw new Error(error);
              }
            })
          )
            .then((success) => {
              this.logger.verbose(
                `Withdrawal::Success: ${JSON.stringify(success)}`
              );
            })
            .catch((error) => {
              this.logger.error(`Withdrawal::Error: ${JSON.stringify(error)}`);
            });
        }
      });
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  updateLastActionJob() {
    return getConnection()
      .createQueryBuilder(UsersProfile, 'userProfile')
      .where('userProfile.lastActionTimeStamp = :lastActionTimeStamp', {
        lastActionTimeStamp: '0000-00-00 00:00:00',
      })
      .getManyAndCount()
      .then(([users, count]) => {
        if (count > 0) {
          this.logger.debug(
            `updateLastActionJob::users::result: ${JSON.stringify({
              users,
              count,
            })}`
          );
          users.forEach(async (user) => {
            try {
              const data = await getConnection()
                .createQueryBuilder()
                .update(UsersProfile)
                .set({ lastActionTimeStamp: new Date() })
                .where('id = :id', {
                  id: user.id,
                })
                .execute();

              this.logger.debug(
                `updateLastActionJob::users::data: ${JSON.stringify(data)}`
              );

              return data;
            } catch (error) {
              this.logger.error(
                `updateLastActionJob::users::error: ${error?.message}`
              );
            }
          });
        }
      });
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  updateLastRollJob() {
    return getConnection()
      .createQueryBuilder(UsersProfile, 'userProfile')
      .where('userProfile.lastRollTimeStamp = :lastRollTimeStamp', {
        lastRollTimeStamp: '0000-00-00 00:00:00',
      })
      .getManyAndCount()
      .then(([users, count]) => {
        if (count > 0) {
          this.logger.debug(
            `updateLastRollJob::users::result: ${JSON.stringify({
              users,
              count,
            })}`
          );
          users.forEach(async (user) => {
            try {
              const data = await getConnection()
                .createQueryBuilder()
                .update(UsersProfile)
                .set({ lastRollTimeStamp: new Date() })
                .where('id = :id', {
                  id: user.id,
                })
                .execute();

              this.logger.debug(
                `updateLastRollJob::users::data: ${JSON.stringify(data)}`
              );

              return data;
            } catch (error) {
              this.logger.error(
                `updateLastRollJob::users::error: ${error?.message}`
              );
            }
          });
        }
      });
  }
}
