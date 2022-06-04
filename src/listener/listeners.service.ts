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
import { getManager, Repository } from 'typeorm';
import { UsersProfile } from '../usersprofile/usersprofile.entity';
import { Character } from '../character/character.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Team } from '../team/team.entity';

const staticEvent = {
  address: '0x5f8f682A9dd9dc399acBdfcf3393aff680f1F22F',
  blockNumber: 18399996,
  transactionHash:
    '0x060fa1d06bfed189d135345b5ebe26a3f4fc7ba8e4926f7d9db305d3ce220406',
  transactionIndex: 43,
  blockHash:
    '0x8117c72780d24f4eaa2e3a999581fd56d7ce9176816b5ab4eaee5ad43c721a16',
  logIndex: 134,
  removed: false,
  id: 'log_92f7a21c',
  returnValues: {
    '0': '0x33784523Ff246Db56DCe26C7ad6836C84A7C7218',
    '1': '0xCc99855481022fCc44037DC50b48e3D7415613AD',
    '2': '1479',
    from: '0x33784523Ff246Db56DCe26C7ad6836C84A7C7218',
    to: '0xCc99855481022fCc44037DC50b48e3D7415613AD',
    tokenId: '1479',
  },
  event: 'Transfer',
  signature:
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  raw: {
    data: '0x',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x00000000000000000000000033784523ff246db56dce26c7ad6836c84a7c7218',
      '0x000000000000000000000000cc99855481022fcc44037dc50b48e3d7415613ad',
      '0x00000000000000000000000000000000000000000000000000000000000005c7',
    ],
  },
};

@Injectable()
export class ListenerService implements OnModuleInit {
  private readonly logger = new Logger(ListenerService.name);

  public web3;
  //
  public tokenContract: Contract;
  public networkMode;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UsersProfile)
    private readonly usersRepository: Repository<UsersProfile>
  ) {
    this.networkMode =
      this.configService.get('ENV_TAG') !== 'production'
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
    // if you want to test the below function then uncomment the below code.
    // this.handleEvent(staticEvent);
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
        return await self.handleEvent(event);
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

  async handleEvent(event) {
    console.log('DATA::event::', event);
    console.log('event=======', JSON.stringify(event));
    // we need the tokenIf for the Info
    const tokenId = event?.returnValues?.tokenId;
    const tokenMeta = await this.getNftMetadata(tokenId);

    const walletAddress = '0x' + event?.raw?.topics[1]?.substring(26);

    return getManager().transaction(async (transactionalEntityManager) => {
      return transactionalEntityManager
        .createQueryBuilder(UsersProfile, 'users_profile')
        .setLock('pessimistic_write')
        .where('users_profile.walletAddress = :walletAddress', {
          walletAddress,
        })
        .getOne()
        .then(async (walletUser) => {
          let user = walletUser;
          if (!user) {
            // if user not found with wallet address then register new user

            let team = new Team();
            team.walletAddress = walletAddress;

            user = new UsersProfile();
            user.walletAddress = walletAddress;
            user.lastRollTimeStamp = new Date();
            user.lastActionTimeStamp = new Date();
            user.gridPosition = 0;
            user.noOfRoll = 1;
            user.teamID = team.id;
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
            team.userId = user.id;
            team = await transactionalEntityManager.save(team);
            user.teamID = team.id;
            user = await transactionalEntityManager.save(user);
          }

          return transactionalEntityManager
            .createQueryBuilder(Character, 'character')
            .setLock('pessimistic_write')
            .where('character.tokenId = :tokenId', { tokenId: tokenId })
            .getCount()
            .then(async (trxCount) => {
              if (trxCount * 1 === 0) {
                // Create transaction records
                const transferTransaction = new Character();
                transferTransaction.walletAddress = walletAddress;
                transferTransaction.erc721 = CONTRACT_ADDRESS[this.networkMode];
                transferTransaction.usersProfileId = user.id;
                if (tokenMeta.type == 2) {
                  // we need to have the tokenId as the WeaponId
                  transferTransaction.weapon = parseInt(tokenId);
                } else if (tokenMeta.type == 1) {
                  // this will only store when we have the character as the token
                  transferTransaction.tokenId = tokenId;
                }
                // Receiver : create transaction record (update it balance)
                const transactionResp = await transactionalEntityManager.save(
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
              return new HttpException(error?.message, HttpStatus.BAD_REQUEST);
            });
        })
        .catch((error) => {
          // get user
          console.log(`::LOG::ERROR::${error?.message}:`);
          return new HttpException(error?.message, HttpStatus.BAD_REQUEST);
        });
    });
  }
}
