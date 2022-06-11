import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import Web3 from 'web3';
import { InjectRepository } from '@nestjs/typeorm';
import { getConnection, getManager, Repository } from 'typeorm';
import { Contract } from 'web3-eth-contract';
import HDWalletProvider from '@truffle/hdwallet-provider';

import { Withdrawal } from '../withdrawal/withdrawal.entity';
import {
  Transaction,
  TransactionType,
} from '../transaction/transaction.entity';

import mgmContractAbi from './constants/mgmContractAbi.json';
import {
  MGM_CONTRACT_ADDRESS,
  MGM_REWARD_COMPANY_ADDRESS,
  RPC_PROVIDER_URL,
} from '../constants/constants';
import { ConfigService } from '@nestjs/config';

declare interface PromiseConstructor {
  allSettled(
    promises: Array<Promise<any>>
  ): Promise<
    Array<{ status: 'fulfilled' | 'rejected'; value?: any; reason?: any }>
  >;
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
      this.configService.get('ENV_TAG') !== 'production'
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

  @Cron(CronExpression.EVERY_5_MINUTES)
  handleCron() {
    this.logger.debug('Called when the current second is 5 minutes');
    this.withdrwalRepository
      .find({ where: { status: 'Approved' } })
      .then((withdrwals) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        Promise.allSettled(
          withdrwals.map(async (withdrawal) => {
            try {
              const withdrawalRecord = await getConnection()
                .createQueryBuilder(Withdrawal, 'withdrawal')
                .where('withdrawal.id = :id', {
                  id: withdrawal.id,
                })
                .getOne();

              // transferring the withdrawal amount to user wallet address from company address
              this.logger.verbose(
                `Withdrawal:transferMgmReward:params:${JSON.stringify({
                  to: withdrawalRecord.walletAddress,
                  amount: withdrawalRecord.amount,
                  from: this.account.address,
                })}`
              );

              // eslint-disable-next-line @typescript-eslint/no-this-alias
              const self = this;

              this.mgmContract.methods
                .transfer(
                  withdrawalRecord.walletAddress,
                  withdrawalRecord.amount
                )
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
                        const process = await transactionalEntityManager
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
                      }
                    );
                  } catch (error) {
                    this.logger.error(`::LOG::ERROR::${error?.message}:`);
                    return new HttpException(
                      error?.message,
                      HttpStatus.BAD_REQUEST
                    );
                  }
                })
                .on(
                  'confirmation',
                  async function (confirmationNumber, receipt) {
                    self.logger.warn(
                      `Witdrawal::transferMgmReward::confirmation:${JSON.stringify(
                        {
                          confirmationNumber,
                          receipt,
                        }
                      )}`
                    );
                  }
                )
                .on('receipt', async function (receipt) {
                  /**
                   * When Transaction is Successful then we will get the Event from here
                   */
                  self.logger.log(
                    `Withdrawal::transferMgmReward::receipt:${JSON.stringify({
                      receipt,
                    })}`
                  );

                  await getManager().transaction(
                    async (transactionalEntityManager) => {
                      const tTransferTransaction = new Transaction();
                      tTransferTransaction.amount = withdrawal.amount;
                      tTransferTransaction.type = TransactionType.WITHDRAWAL;
                      tTransferTransaction.hash =
                        receipt.receipt?.transactionHash;
                      tTransferTransaction.walletAddress =
                        withdrawal.walletAddress;
                      tTransferTransaction.fromAddress =
                        MGM_REWARD_COMPANY_ADDRESS;
                      tTransferTransaction.userId = parseInt(withdrawal.userId);
                      tTransferTransaction.description = `Success: Transfer ${withdrawal.amount} to ${withdrawal.walletAddress}`;

                      //Transfer : Create transaction record (update its balance)
                      const tTransferTransactionObj =
                        await transactionalEntityManager.save(
                          tTransferTransaction
                        );

                      // updating Withdrawal if transaction is successfully done.
                      if (tTransferTransactionObj) {
                        await transactionalEntityManager
                          .createQueryBuilder(Withdrawal, 'withdrawal')
                          .update(Withdrawal)
                          .set({ status: 'Success' })
                          .where('withdrawal.id = :id', {
                            id: withdrawalRecord.id,
                          })
                          .execute();
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
                      tTransferTransaction.fromAddress =
                        MGM_REWARD_COMPANY_ADDRESS;
                      tTransferTransaction.userId = parseInt(withdrawal.userId);
                      tTransferTransaction.type = TransactionType.WITHDRAWAL;
                      tTransferTransaction.description = `Error: Transfer ${withdrawal.amount} to ${withdrawal.walletAddress}`;

                      //Transfer : Create transaction record (update its balance)
                      const tTransferTransactionObj =
                        await transactionalEntityManager.save(
                          tTransferTransaction
                        );

                      if (tTransferTransactionObj) {
                        await transactionalEntityManager
                          .createQueryBuilder(Withdrawal, 'withdrawal')
                          .update(Withdrawal)
                          .set({ status: 'Failed' })
                          .where('withdrawal.id = :id', {
                            id: withdrawalRecord.id,
                          })
                          .execute();
                      }
                    }
                  );
                })
                .catch((error) => {
                  this.logger.error(`::LOG::ERROR::${error?.message}:`);
                  return new HttpException(
                    error?.message,
                    HttpStatus.BAD_REQUEST
                  );
                });
            } catch (error) {
              this.logger.error(`::LOG::ERROR::${error?.message}:`);
            }
          })
        )
          .then((success) => {
            this.logger.verbose(
              `:::Success withdrawal ${JSON.stringify(success)}`
            );
            // success.length;
          })
          .catch((failed) => {
            this.logger.error(`:::Success withrawal ${JSON.stringify(failed)}`);
          });
      });
  }
}
