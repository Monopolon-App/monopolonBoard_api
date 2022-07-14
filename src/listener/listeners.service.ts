import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import _ from 'lodash';
import { ConfigService } from '@nestjs/config';
import { getManager, Repository } from 'typeorm';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';

import { UsersProfile } from 'src/usersprofile/usersprofile.entity';
import { Character, StatusType } from 'src/character/character.entity';
import { Team } from 'src/team/team.entity';
import { Hq } from 'src/hq/hq.entity';

import CONTRACT_ABI from './constants/contractABI.json';
import { CONTRACT_ADDRESS, WS_PROVIDER_URL } from 'src/constants/constants';
import { nftMetadata, nftMetadataDTO } from './nft-metadata.dto';
import { Listener } from './listeners.entity';
import { Equipment } from 'src/equipment/equipment.entity';
import { WanderingMerchant } from 'src/WanderingMerchant/wanderingMerchant.entity';
// mock data for testing
// import { staticEvent, staticEventForNftTransfer } from './mockData';
import {
  Transaction,
  TransactionType,
} from '../transaction/transaction.entity';

type TrxDataType = {
  from: string;
  to: string;
  tokenId: number;
  transactionHash: string;
  blockNumber: number;
};

@Injectable()
export class ListenerService implements OnModuleInit {
  private readonly logger = new Logger(ListenerService.name);

  public web3;
  public tokenContract: Contract; // nft
  public networkMode;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Listener)
    private readonly listenersRepository: Repository<Listener>
  ) {
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
    } catch (error) {
      this.logger.error('Listener::Error:', error);
    }

    // if you want to test the below function then uncomment the below code.
    // this.handleEvent(staticEvent);

    // if you want to test the handleCompanyToUserNft function then uncomment the below code.
    // this is for the exit gameGame Functionality.
    // this.handleEvent(staticEventForNftTransfer);
  }

  // fetch the nft metadata form the API.
  async getNftMetadata(tokenId: number, erc721: string): Promise<nftMetadata> {
    let MP_API_URL = 'https://marketplace.monopolon.io/api';

    if (erc721 == '0x5E17561c297E75875b0362FaB3c9553F4d15D4ac') {
      MP_API_URL = `https://companymp.monopolon.io/api`;
    }

    const result = await axios.get<nftMetadataDTO>(`/nfts/tokenId/${tokenId}`, {
      baseURL: MP_API_URL,
    });

    if (result?.data?.data?.length === 0) {
      this.logger.log(`NFT metadata not found for tokenId ${tokenId}`);
      throw new HttpException(
        `NFT metadata not found for tokenId ${tokenId}`,
        HttpStatus.NOT_FOUND
      );
    }

    return result.data.data[0];
  }

  async getRandomInt(min, max): Promise<number> {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }

  async listenContractEvents(): Promise<void> {
    const lastBlockNumber = await this.getLastBlockNumberListener();

    const fromBlock = lastBlockNumber?.blockNumber
      ? lastBlockNumber?.blockNumber + 1
      : 'latest';

    this.logger.debug(
      `Started listen events Transfer at : ${new Date().toLocaleString()}`
    );
    this.logger.verbose('\n');
    this.logger.verbose(`INFO:`);
    this.logger.verbose(`-Network Mode: ${this.networkMode}`);
    this.logger.verbose(`-WSS Provider: ${WS_PROVIDER_URL[this.networkMode]}`);
    this.logger.verbose(
      `-Contract Address: ${CONTRACT_ADDRESS[this.networkMode]}`
    );
    this.logger.verbose(
      `-Company Address: ${this.configService.get('COMPANY_ADDRESS')}`
    );
    this.logger.verbose('\n');

    const companyAddress = this.configService.get('COMPANY_ADDRESS');

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    this.tokenContract.events
      .Transfer({})
      .on('connected', function (subscriptionId) {
        self.logger.verbose(
          'CONNECTED::event::subscriptionId::' + subscriptionId
        );
      })
      .on('data', async function (event) {
        const trxData: TrxDataType = {
          from: _.get(event, 'returnValues.0', undefined),
          to: self.web3.utils.fromWei(
            _.get(event, 'returnValues.1', undefined),
            'ether'
          ),
          tokenId: self.web3.utils.fromWei(
            _.get(event, 'returnValues.2', undefined),
            'ether'
          ),
          transactionHash: _.get(event, 'transactionHash', undefined),
          blockNumber: _.get(event, 'blockNumber', undefined),
        };
        if (trxData.to === companyAddress || trxData.from === companyAddress) {
          return self.handleEvent(event);
        } else {
          self.logger.log(`There is no event for company wallet address`);
        }
      })
      .on('changed', function (event) {
        self.logger.verbose('CHANGED::event::' + JSON.stringify(event));
        // remove event from local database
      })
      .on('error', function (error, receipt) {
        self.logger.log(
          'ERROR::error/receipt:' + JSON.stringify({ error, receipt })
        );
        // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
      });
  }

  async handleCompanyToUserNft(trxData: TrxDataType) {
    const tokenId = this.web3.utils.toWei(trxData.tokenId, 'ether');

    const tokenMeta = await this.getNftMetadata(
      tokenId,
      CONTRACT_ADDRESS[this.networkMode]
    );

    this.logger.debug(`-Listener:event:trxData:${JSON.stringify(trxData)}`);

    await this.setLastBlockNumberListener(trxData.blockNumber);

    return getManager().transaction(async (transactionalEntityManager) => {
      return transactionalEntityManager
        .createQueryBuilder(Character, 'character')
        .setLock('pessimistic_write')
        .where('character.tokenId = :tokenId', { tokenId: tokenId })
        .getOne()
        .then(async (character) => {
          if (character) {
            // Create transaction records
            // when person enter game then he registers the game. when he exists the game then gameStatus will beZero
            const transferTransaction = new Character();
            transferTransaction.walletAddress = trxData.from;
            transferTransaction.status = StatusType.NULL;
            transferTransaction.erc721 = CONTRACT_ADDRESS[this.networkMode];
            if (tokenMeta.type == 1) {
              // this will only store when we have the character as the token
              transferTransaction.tokenId = tokenId;
              transferTransaction.ImageURL = tokenMeta.imgUrl;
              transferTransaction.Luk =
                tokenMeta.attributes.commonAttribute.luk?.toString();
              transferTransaction.str =
                tokenMeta.attributes.commonAttribute.str?.toString();
              transferTransaction.dex =
                tokenMeta.attributes.commonAttribute.dex?.toString();
              transferTransaction.prep =
                tokenMeta.attributes.commonAttribute.prep?.toString();
              transferTransaction.mp =
                tokenMeta.attributes.commonAttribute.mp?.toString();
              transferTransaction.hp =
                tokenMeta.attributes.commonAttribute.hp?.toString();
            }
            // create transaction record
            const transactionResp = await transactionalEntityManager.save(
              transferTransaction
            );

            // here we change the status of character as REMOVED when user exit the game
            await transactionalEntityManager
              .createQueryBuilder(Character, 'character')
              .update(Character)
              .set({
                status: StatusType.REMOVED,
              })
              .where('character.id = :id', {
                id: character.id,
              })
              .execute();

            // here we set team slot null when NFT is transfer from company's walletAddress to user walletAddress
            await transactionalEntityManager
              .createQueryBuilder(Team, 'team')
              .update(Team)
              .set({
                slot1: null,
              })
              .where('team.walletAddress = :walletAddress', {
                walletAddress: character.walletAddress,
                // Or Query if character in slot 1 , slot 2 or any slot then make the slot null
                // we need to query based on the slotno which is characterId
                // slot1: character.id,
              })
              .execute();
            // first tim enter
            // first time exist
            // second time enter and then exist and so on
            // here if user does not have any ACTIVE nft to play then we set enterGameStatus == 0
            await transactionalEntityManager
              .createQueryBuilder(Character, 'character')
              .setLock('pessimistic_write')
              .where('character.walletAddress = :walletAddress', {
                walletAddress: character.walletAddress,
              })
              .andWhere([
                { status: StatusType.ACTIVATED },
                { status: StatusType.NULL },
              ])
              .getCount()
              .then(async (count) => {
                if (count === 0) {
                  await transactionalEntityManager
                    .createQueryBuilder(UsersProfile, 'users_profile')
                    .update(UsersProfile)
                    .set({
                      enterGameStatus: 0,
                    })
                    .where('users_profile.walletAddress = :walletAddress', {
                      walletAddress: character.walletAddress,
                    })
                    .execute();
                } else {
                  throw new HttpException(
                    'User has other NFT to play',
                    HttpStatus.BAD_REQUEST
                  );
                }
              })
              .catch((error) => {
                return new HttpException(
                  error?.message,
                  HttpStatus.BAD_REQUEST
                );
              });

            // here we create transaction entry for NFT Transfer event
            const tTransferTransaction = new Transaction();
            tTransferTransaction.type = TransactionType.NFT_TRANSFER;
            tTransferTransaction.description =
              'Transferring NFT from company walletAddress to User walletAddress';
            tTransferTransaction.walletAddress = character.walletAddress;
            tTransferTransaction.fromAddress = trxData.from;
            await transactionalEntityManager.save(tTransferTransaction);
          } else {
            console.log('::LOG::ERROR::Duplicate transaction record:');
            return new HttpException(
              'Duplicate transaction record',
              HttpStatus.BAD_REQUEST
            );
          }
        })
        .catch((error) => {
          console.log(`::LOG::ERROR::${error?.message}:`);
          return new HttpException(error?.message, HttpStatus.BAD_REQUEST);
        });
    });
  }

  async handleEvent(event) {
    this.logger.debug('DATA::event::', JSON.stringify(event));

    // we need the tokenIf for the Info
    const tokenId = event?.returnValues?.tokenId;
    const tokenMeta = await this.getNftMetadata(
      tokenId,
      CONTRACT_ADDRESS[this.networkMode]
    );

    const trxData: TrxDataType = {
      from: _.get(event, 'returnValues.0', undefined),
      to: this.web3.utils.fromWei(
        _.get(event, 'returnValues.1', undefined),
        'ether'
      ),
      tokenId: this.web3.utils.fromWei(
        _.get(event, 'returnValues.2', undefined),
        'ether'
      ),
      transactionHash: _.get(event, 'transactionHash', undefined),
      blockNumber: _.get(event, 'blockNumber', undefined),
    };

    if (trxData.from === this.configService.get('COMPANY_ADDRESS')) {
      return await this.handleCompanyToUserNft(trxData);
    }
    await this.setLastBlockNumberListener(trxData.blockNumber);

    this.logger.debug(`-Listener:event:trxData:${JSON.stringify(trxData)}`);

    return getManager().transaction(async (transactionalEntityManager) => {
      return transactionalEntityManager
        .createQueryBuilder(UsersProfile, 'users_profile')
        .setLock('pessimistic_write')
        .where('users_profile.walletAddress = :walletAddress', {
          walletAddress: trxData.from,
        })
        .getOne()
        .then(async (walletUser) => {
          if (walletUser) {
            throw new UnauthorizedException(
              'wallet address already registered'
            );
          }

          // if user not found with wallet address then register new user

          // cerate new team
          const team = new Team();
          team.walletAddress = trxData.from;
          const teamRecord = await transactionalEntityManager.save(team);
          this.logger.debug(
            `-Listener:Create:Team:${JSON.stringify(teamRecord)}`
          );

          // create new user record and assign team to user
          const lastRollActionTimeStamp = new Date();
          lastRollActionTimeStamp.setHours(new Date().getHours() - 6);
          const newUser = new UsersProfile();
          newUser.walletAddress = trxData.from;
          newUser.lastRollTimeStamp = lastRollActionTimeStamp; // 6 h before
          newUser.lastActionTimeStamp = lastRollActionTimeStamp;
          newUser.gridPosition = 0;
          newUser.noOfRoll = 1;
          newUser.enterGameStatus = 1;
          newUser.teamId = teamRecord.id;
          const newUserRecord = await transactionalEntityManager.save(newUser);
          this.logger.debug(
            `-Listener:Create:UserProfile:${JSON.stringify(newUserRecord)}`
          );

          // Create a new HQ for users, Randomly assigning a gridPosition.
          const newHQ = new Hq();
          newHQ.status = 1;
          newHQ.hqGridPosition = await this.getRandomInt(1, 126);
          newHQ.userId = newUserRecord.id;
          newHQ.walletAddress = newUserRecord.walletAddress;

          const newHQRecord = await transactionalEntityManager.save(newHQ);

          // create new player earning
          // const newPlayerEarning = new UsersProfile();
          // newPlayerEarning.id = newUserRecord.id;
          // newPlayerEarning.walletAddress = newUserRecord.walletAddress;

          // const newPlayerEarningRecord = await transactionalEntityManager.save(
          //   newPlayerEarning
          // );
          // this.logger.debug(
          //   `-Listener:Create:PlayerEarning:${JSON.stringify(
          //     newPlayerEarningRecord
          //   )}`
          // );

          return transactionalEntityManager
            .createQueryBuilder(Character, 'character')
            .setLock('pessimistic_write')
            .where('character.tokenId = :tokenId', { tokenId: tokenId })
            .getCount()
            .then(async (trxCount) => {
              if (trxCount * 1 === 0) {
                console.log('metadata', tokenMeta);
                // Create transaction records
                const transferTransaction = new Character();
                const transferEquipment = new Equipment();
                transferTransaction.walletAddress =
                  transferEquipment.walletAddress = trxData.from;
                transferTransaction.erc721 = transferEquipment.erc721 =
                  CONTRACT_ADDRESS[this.networkMode];
                transferTransaction.usersProfileId = newUserRecord.id;
                if (tokenMeta.type == 1) {
                  // this will only store when we have the character as the token
                  transferTransaction.tokenId = tokenId;
                  transferTransaction.ImageURL = tokenMeta.imgUrl;
                  transferTransaction.Luk =
                    tokenMeta.attributes.commonAttribute.luk?.toString();
                  transferTransaction.str =
                    tokenMeta.attributes.commonAttribute.str?.toString();
                  transferTransaction.dex =
                    tokenMeta.attributes.commonAttribute.dex?.toString();
                  transferTransaction.prep =
                    tokenMeta.attributes.commonAttribute.prep?.toString();
                  transferTransaction.mp =
                    tokenMeta.attributes.commonAttribute.mp?.toString();
                  transferTransaction.hp =
                    tokenMeta.attributes.commonAttribute.hp?.toString();
                  teamRecord.totalDex = transferTransaction.dex;
                  teamRecord.totalHp = transferTransaction.hp;
                  teamRecord.totalLuk = transferTransaction.Luk;
                  teamRecord.totalMp = transferTransaction.mp;
                  teamRecord.totalPrep = transferTransaction.prep;
                  teamRecord.totalStr = transferTransaction.str;
                }

                if (tokenMeta.type == 2) {
                  transferEquipment.tokenId = tokenId;

                  transferEquipment.charequiped =
                    transferTransaction.id.toString();

                  transferEquipment.str =
                    tokenMeta.attributes.commonAttribute.str?.toString();

                  transferEquipment.dex =
                    tokenMeta.attributes.commonAttribute.dex?.toString();

                  transferEquipment.Luk =
                    tokenMeta.attributes.commonAttribute.luk?.toString();

                  transferEquipment.prep =
                    tokenMeta.attributes.commonAttribute.prep?.toString();

                  transferEquipment.mp =
                    tokenMeta.attributes.commonAttribute.mp?.toString();

                  transferEquipment.hp =
                    tokenMeta.attributes.commonAttribute.hp?.toString();

                  transferEquipment.status = 'equiped';

                  teamRecord.totalDex = transferEquipment.dex;
                  teamRecord.totalHp = transferEquipment.hp;
                  teamRecord.totalLuk = transferEquipment.Luk;
                  teamRecord.totalMp = transferEquipment.mp;
                  teamRecord.totalPrep = transferEquipment.prep;
                  teamRecord.totalStr = transferEquipment.str;

                  const equipmentResp = await transactionalEntityManager.save(
                    transferEquipment
                  );
                  return equipmentResp;
                }

                // Receiver : create transaction record (update it balance)
                const transactionResp = await transactionalEntityManager.save(
                  transferTransaction
                );

                teamRecord.slot1 = transactionResp.id;

                const teamRecord1 = await transactionalEntityManager.save(
                  teamRecord
                );

                console.log(
                  '::LOG::SUCCESS::Transaction Result:',
                  transactionResp
                );

                console.log('::LOG::SUCCESS::teamReord Result:', teamRecord1);
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

  async getLastBlockNumberListener(): Promise<Listener> {
    const lastBlockNumberListener = await this.listenersRepository.findOne({
      order: { blockNumber: 'DESC' },
    });
    this.logger.debug(
      `Listener::getLastBlockNumberListener:Result=${
        lastBlockNumberListener ? JSON.stringify(lastBlockNumberListener) : `{}`
      }`
    );

    return lastBlockNumberListener;
  }

  async setLastBlockNumberListener(blockNumber: number): Promise<Listener> {
    try {
      const newBlockNumberListener = new Listener();
      newBlockNumberListener.blockNumber = blockNumber;

      const lastBlockNumberListener = await this.listenersRepository.save(
        newBlockNumberListener
      );

      this.logger.debug(
        `Listener::setLastBlockNumberListener:Result=${JSON.stringify(
          lastBlockNumberListener
        )}`
      );
      return lastBlockNumberListener;
    } catch (error) {
      this.logger.debug(
        `Listener::setLastBlockNumberListener::ERROR:${JSON.stringify(error)}`
      );
    }
  }
}
