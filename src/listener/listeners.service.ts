import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import Web3 from 'web3';
import { Contract, ContractOptions } from 'web3-eth-contract';

import CONTRACT_ABI from './constants/contractABI.json';
import {
  COMPANY_ADDRESS,
  CONTRACT_ADDRESS,
  WS_PROVIDER_URL,
} from 'src/constants/constants';
import { ConfigService } from '@nestjs/config';
import { nftMetadata, nftMetadataDTO } from './nft-metadata.dto';
import axios from 'axios';
import { getManager } from 'typeorm';
import { UsersProfile } from '../usersprofile/usersprofile.entity';
import { Character } from '../character/character.entity';

@Injectable()
export class ListenerService implements OnModuleInit {
  private readonly logger = new Logger(ListenerService.name);

  public web3;
  //
  public tokenContract: Contract;
  public networkMode;

  constructor(private readonly configService: ConfigService) {
    this.networkMode =
      this.configService.get('ENV_TAG') === 'production'
        ? 'MAINNET'
        : 'TESTNET';

    this.web3 = new Web3(
      new Web3.providers.WebsocketProvider(WS_PROVIDER_URL[this.networkMode], {
        reconnect: {
          auto: true,
          delay: 5000,
          maxAttempts: 5,
          onTimeout: false,
        },
      })
    );

    this.tokenContract = new this.web3.eth.Contract(
      CONTRACT_ABI as any,
      CONTRACT_ADDRESS[this.networkMode]
    );
  }

  async onModuleInit(): Promise<void> {
    this.logger.debug(
      `The module has been initialized at : ${new Date().toLocaleString()}`
    );

    try {
      await this.listenContractEvents();
    } catch (e) {
      console.log('error', e);
    }
    this.tokenContract.getPastEvents('Transfer').then((result) => {
      console.log('result======', result);
    });
  }

  // fetch the nft metadata form the API.
  async getNftMetadata(tokenId: number): Promise<nftMetadata> {
    const metadataUrl = `https://marketplace.monopolon.io/api/nfts/tokenId/${tokenId}`;

    const result = await axios.get<nftMetadataDTO>(metadataUrl);

    if (result?.data?.data?.length === 0) {
      this.logger.log(`NFT metadata not found for tokenId ${tokenId}`);
      throw new HttpException(
        `NFT metadata not found for tokenId ${tokenId}`,
        HttpStatus.NOT_FOUND
      );
    }

    return result.data.data[0];
  }

  async listenContractEvents(): Promise<void> {
    this.logger.debug(
      `Started listen events Transfer at : ${new Date().toLocaleString()}`
    );
    this.logger.verbose('\n');
    this.logger.verbose(`INFO:`);
    this.logger.verbose(`-Network Mode: ${this.networkMode}`);
    this.logger.verbose(`-WWS Provider: ${WS_PROVIDER_URL[this.networkMode]}`);
    this.logger.verbose(
      `-Contract Address: ${CONTRACT_ADDRESS[this.networkMode]}`
    );
    this.logger.verbose(`-Company Address: ${COMPANY_ADDRESS}`);
    this.logger.verbose('\n');

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    this.tokenContract.events
      .Transfer({
        filter: {
          to: COMPANY_ADDRESS,
        },
        fromBlock: 'latest',
      })
      .on('connected', function (subscriptionId) {
        console.log('CONNECTED::event::subscriptionId::', subscriptionId);
      })
      .on('data', async function (event) {
        console.log('DATA::event::', event);
        // we need the tokenIf for the Info
        const tokenId = event?.returnValues?.amount;
        const tokenMeta = await self.getNftMetadata(tokenId);

        const walletAddress = '0x' + event?.raw?.topics[1]?.substring(26);

        return getManager().transaction(async (transactionalEntityManager) => {
          return transactionalEntityManager
            .createQueryBuilder(UsersProfile, 'usersprofile')
            .setLock('pessimistic_write')
            .where('user.walletAddress = :walletAddress', { walletAddress })
            .getOne()
            .then(async (walletUser) => {
              let user = walletUser;
              if (!user) {
                // if user not found with wallet address then register new user
                user = new UsersProfile();
                user.walletAddress = walletAddress;
                user.gridPosition = 0;
                const [_, userWalletCount] =
                  await this.usersRepository.findAndCount({
                    where: {
                      walletAddress: walletAddress,
                    },
                  });

                if (userWalletCount > 0) {
                  throw new UnauthorizedException(
                    'wallet address already registered'
                  );
                }
                user = await transactionalEntityManager.save(user);
              }

              return transactionalEntityManager
                .createQueryBuilder(Character, 'character')
                .setLock('pessimistic_write')
                .where('transaction.tokenId = :tokenId', { tokenId: tokenId })
                .getCount()
                .then(async (trxCount) => {
                  if (trxCount * 1 === 0) {
                    // Create transaction records
                    const transferTransaction = new Character();
                    transferTransaction.walletAddress = walletAddress;
                    transferTransaction.tokenId = tokenId;
                    transferTransaction.usersProfileId = user.id;
                    if (tokenMeta.type == 2) {
                      // TODO: need to discuss with the lee how we are going to
                      transferTransaction.weapon = 1;
                    }
                    // Receiver : create transaction record (update it balance)
                    const transactionResp =
                      await transactionalEntityManager.save(
                        transferTransaction
                      );
                    console.log(
                      '::LOG::SUCCESS::Transaction Result:',
                      transactionResp
                    );
                    return transactionResp;
                  } else {
                    console.log('::LOG::ERROR::Duplicate transaction record:');
                    return new HttpException(
                      'Duplicate transaction record',
                      HttpStatus.BAD_REQUEST
                    );
                  }
                })
                .catch((error) => {
                  // get trx count
                  console.log(`::LOG::ERROR::${error?.message}:`);
                  return new HttpException(
                    error?.message,
                    HttpStatus.BAD_REQUEST
                  );
                });
            })
            .catch((error) => {
              // get user
              console.log(`::LOG::ERROR::${error?.message}:`);
              return new HttpException(error?.message, HttpStatus.BAD_REQUEST);
            });
        });
      })
      .on('changed', function (event) {
        console.log('CHANGED::event::', event);
        // remove event from local database
      })
      .on('error', function (error, receipt) {
        console.log('ERROR::error/receipt:', error, receipt);
        // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
      });
  }
}
