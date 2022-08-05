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
import { Character } from 'src/character/character.entity';
import { Team } from 'src/team/team.entity';
import { Hq } from 'src/hq/hq.entity';

import CONTRACT_ABI from './constants/contractABI.json';
import { CONTRACT_ADDRESS, WS_PROVIDER_URL } from 'src/constants/constants';
import { nftMetadata, nftMetadataDTO } from './nft-metadata.dto';

// mock data for testing
// import { staticEvent } from './mockData';

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
    @InjectRepository(UsersProfile)
    private readonly usersRepository: Repository<UsersProfile>
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
  }

  // fetch the nft metadata form the API.
  async getNftMetadata(tokenId: number, erc721: string): Promise<nftMetadata> {
    let metadataUrl = `https://marketplace.monopolon.io/api/nfts/tokenId/${tokenId}`;

    if (erc721 == '0x5E17561c297E75875b0362FaB3c9553F4d15D4ac') {
      metadataUrl = `https://companymp.monopolon.io/api/nfts/tokenId/${tokenId}`;
    }

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

  async getRandomInt(min, max): Promise<number> {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }

  async listenContractEvents(): Promise<void> {
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

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    this.tokenContract.events
      .Transfer({
        filter: {
          to: this.configService.get('COMPANY_ADDRESS'),
        },
        fromBlock: 'latest',
      })
      .on('connected', function (subscriptionId) {
        self.logger.verbose(
          'CONNECTED::event::subscriptionId::' + subscriptionId
        );
      })
      .on('data', async function (event) {
        return self.handleEvent(event);
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
            // when user is already exist and user wants to transfer another nft then
            // we create new character for that nft and
            // we add that character based on slots availability
            return transactionalEntityManager
              .createQueryBuilder(Character, 'character')
              .setLock('pessimistic_write')
              .where('character.tokenId = :tokenId', { tokenId: tokenId })
              .andWhere('character.walletAddress = :walletAddress', {
                walletAddress: walletUser.walletAddress,
              })
              .getCount()
              .then(async (trxCount) => {
                // if user try to add nft which has same tokenId then it throws an error that
                // Duplicate transaction record
                if (trxCount * 1 === 0) {
                  const user = await transactionalEntityManager
                    .createQueryBuilder(UsersProfile, 'users_profile')
                    .setLock('pessimistic_write')
                    .where('users_profile.walletAddress = :walletAddress', {
                      walletAddress: walletUser.walletAddress,
                    })
                    .getOne();

                  if (!user) {
                    throw new HttpException(
                      'User Does not Exist',
                      HttpStatus.BAD_REQUEST
                    );
                  }

                  const team = await transactionalEntityManager
                    .createQueryBuilder(Team, 'team')
                    .setLock('pessimistic_write')
                    .where('team.walletAddress = :walletAddress', {
                      walletAddress: walletUser.walletAddress,
                    })
                    .getOne();

                  if (!team) {
                    throw new HttpException(
                      'Team Does not Exist',
                      HttpStatus.BAD_REQUEST
                    );
                  }

                  // Create character records
                  const character = new Character();
                  character.walletAddress = trxData.from;
                  character.erc721 = CONTRACT_ADDRESS[this.networkMode];
                  character.usersProfileId = user.id;
                  if (tokenMeta.type == 1) {
                    // this will only store when we have the character as the token
                    character.tokenId = tokenId;
                    character.ImageURL = tokenMeta.imgUrl;

                    character.Luk =
                      tokenMeta.attributes.commonAttribute.luk?.toString();

                    character.str =
                      tokenMeta.attributes.commonAttribute.str?.toString();

                    character.dex =
                      tokenMeta.attributes.commonAttribute.dex?.toString();

                    character.prep =
                      tokenMeta.attributes.commonAttribute.prep?.toString();

                    character.mp =
                      tokenMeta.attributes.commonAttribute.mp?.toString();

                    character.hp =
                      tokenMeta.attributes.commonAttribute.hp?.toString();

                    // here we add character's all the stuff like dex, str, hp, etc.. to team's all the stuff
                    if (team.totalDex === null) {
                      team.totalDex = (
                        team.totalDex + parseFloat(character.dex)
                      ).toString();
                    } else {
                      team.totalDex = (
                        parseFloat(character.dex) + parseFloat(team.totalDex)
                      ).toString();
                    }

                    if (team.totalHp === null) {
                      team.totalHp = (
                        team.totalHp + parseFloat(character.hp)
                      ).toString();
                    } else {
                      team.totalHp = (
                        parseFloat(character.hp) + parseFloat(team.totalHp)
                      ).toString();
                    }

                    if (team.totalLuk === null) {
                      team.totalLuk = (
                        team.totalLuk + parseFloat(character.Luk)
                      ).toString();
                    } else {
                      team.totalLuk = (
                        parseFloat(character.Luk) + parseFloat(team.totalLuk)
                      ).toString();
                    }

                    if (team.totalPrep === null) {
                      team.totalPrep = (
                        team.totalPrep + parseFloat(character.prep)
                      ).toString();
                    } else {
                      team.totalPrep = (
                        parseFloat(character.prep) + parseFloat(team.totalPrep)
                      ).toString();
                    }

                    if (team.totalMp === null) {
                      team.totalMp = (
                        team.totalMp + parseFloat(character.mp)
                      ).toString();
                    } else {
                      team.totalMp = (
                        parseFloat(character.mp) + parseFloat(team.totalMp)
                      ).toString();
                    }

                    if (team.totalStr === null) {
                      team.totalStr = (
                        team.totalStr + parseFloat(character.str)
                      ).toString();
                    } else {
                      team.totalStr = (
                        parseFloat(character.str) + parseFloat(team.totalStr)
                      ).toString();
                    }
                  }

                  // Receiver : create transaction record (update it balance)
                  const characterResponse =
                    await transactionalEntityManager.save(character);

                  // here based on availability of the slot we are adding user's character id in that
                  if (team.slot1 === null) {
                    team.slot1 = characterResponse.id;
                  } else if (team.slot2 === null) {
                    team.slot2 = characterResponse.id;
                  } else if (team.slot3 === null) {
                    team.slot3 = characterResponse.id;
                  } else if (team.slot4 === null) {
                    team.slot4 = characterResponse.id;
                  } else if (team.slot5 === null) {
                    team.slot5 = characterResponse.id;
                  } else {
                    throw new HttpException(
                      'all the team slots are full',
                      HttpStatus.BAD_REQUEST
                    );
                  }

                  const teamRecord = await transactionalEntityManager.save(
                    team
                  );

                  console.log(
                    '::LOG::SUCCESS::Transaction Result:',
                    characterResponse
                  );

                  console.log('::LOG::SUCCESS::teamReord Result:', teamRecord);
                  if (characterResponse && walletUser.enterGameStatus === 0) {
                    await transactionalEntityManager
                      .createQueryBuilder(UsersProfile, 'users_profile')
                      .update(UsersProfile)
                      .set({
                        enterGameStatus: 1,
                      })
                      .where('users_profile.walletAddress = :walletAddress', {
                        walletAddress: walletUser.walletAddress,
                      })
                      .execute();
                  }

                  return characterResponse;
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
                transferTransaction.walletAddress = trxData.from;
                transferTransaction.erc721 = CONTRACT_ADDRESS[this.networkMode];
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
}
