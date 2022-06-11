import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import Web3 from 'web3';
import { InjectRepository } from '@nestjs/typeorm';
import { getManager, Repository } from 'typeorm';
import { Contract } from 'web3-eth-contract';
import HDWalletProvider from '@truffle/hdwallet-provider';

import { Withdrawal } from '../withdrawal/withdrawal.entity';
import { Transaction } from '../transaction/transaction.entity';

import mgmContractAbi from './constants/mgmContractAbi.json';
import {
  MGM_REWARD_COMPANY_ADDRESS,
  MGM_CONTRACT_ADDRESS,
  RPC_PROVIDER_URL,
} from '../constants/constants';
import { ConfigService } from '@nestjs/config';

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
      RPC_PROVIDER_URL[this.networkMode]
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

  @Cron(CronExpression.EVERY_5_SECONDS)
  handleCron() {
    this.logger.debug('Called when the current second is 5 minutes');
    this.withdrwalRepository
      .find({ where: { status: 'Approved' } })
      .then((withdrwals) => {
        for (const withdrawal of withdrwals) {
          try {
            getManager()
              .transaction(async (transactionalEntityManager) => {
                const withdrawalRecord = await transactionalEntityManager
                  .createQueryBuilder(Withdrawal, 'withdrawal')
                  .setLock('pessimistic_write')
                  .where('withdrawal.id = :id', {
                    id: withdrawal.id,
                  })
                  .getOne();
                // transferring the withdrawal amount to user wallet address from company address

                this.logger.verbose(
                  `Witdrawal:transferMgmReward:params:${JSON.stringify({
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
                    self.logger.debug(
                      `Witdrawal::transferMgmReward::transactionHash:${JSON.stringify(
                        {
                          hash,
                        }
                      )}`
                    );
                    await transactionalEntityManager
                      .createQueryBuilder(Withdrawal, 'withdrawal')
                      .update(Withdrawal)
                      .set({
                        status: 'Processing',
                      })
                      .where('withdrawal.id = :id', {
                        id: withdrawalRecord.id,
                      });
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
                    self.logger.log(
                      `Witdrawal::transferMgmReward::receipt:${JSON.stringify({
                        receipt,
                      })}`
                    );

                    const tTransferTransaction = new Transaction();
                    tTransferTransaction.amount = withdrawal.amount;
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
                  })
                  .on('error', async function (error, receipt) {
                    self.logger.error(
                      `Witdrawal::transferMgmReward::Error:${JSON.stringify({
                        error,
                        receipt,
                      })}`
                    );

                    const tTransferTransaction = new Transaction();
                    tTransferTransaction.amount = withdrawal.amount;
                    tTransferTransaction.walletAddress =
                      withdrawal.walletAddress;
                    tTransferTransaction.fromAddress =
                      MGM_REWARD_COMPANY_ADDRESS;
                    tTransferTransaction.userId = parseInt(withdrawal.userId);
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
                  });
              })
              .catch((error) => {
                this.logger.error(`::LOG::ERROR::${error?.message}:`);
                return new HttpException(
                  error?.message,
                  HttpStatus.BAD_REQUEST
                );
              });
          } catch (error) {}
        }
      });
  }
}
