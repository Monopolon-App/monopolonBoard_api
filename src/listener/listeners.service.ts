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
import CONTRACT_MGM_ABI from './constants/contractMgmTokenForNewAddress.json';
import {
  CONTRACT_ADDRESS,
  MGM_CONTRACT_ADDRESS_FOR_NEW_COMPANY_ADDRESS,
  WS_PROVIDER_URL,
} from 'src/constants/constants';
import { nftMetadata, nftMetadataDTO } from './nft-metadata.dto';
import { Listener } from './listeners.entity';
import { Equipment, EquipmentStatusType } from 'src/equipment/equipment.entity';
import { WanderingMerchant } from 'src/WanderingMerchant/wanderingMerchant.entity';
// mock data for testing
// import {
//   staticEvent,
//   staticEventForNftTransfer,
//   mgmTransferEvent,
// } from './mockData';
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

function equalsIgnoringCase(text, other) {
  return text.localeCompare(other, undefined, { sensitivity: 'base' }) === 0;
}

@Injectable()
export class ListenerService implements OnModuleInit {
  private readonly logger = new Logger(ListenerService.name);

  public web3;
  public tokenContract: Contract; // nft
  public mgmContractX: Contract; // mgmReward
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

    this.mgmContractX = new this.web3.eth.Contract(
      CONTRACT_MGM_ABI as any,
      MGM_CONTRACT_ADDRESS_FOR_NEW_COMPANY_ADDRESS[this.networkMode]
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

    // if you want to test the below function then uncomment the below code.
    // this is for transferring mgm to user walletAddress from mgmContractX
    // this.handleEventForMgmContractX(mgmTransferEvent);

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

    const companyAddressForMgmTransfer = this.configService.get(
      'COMPANY_ADDRESS_FOR_MGMC'
    );

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
          to: _.get(event, 'returnValues.1', undefined),
          tokenId: self.web3.utils.fromWei(
            _.get(event, 'returnValues.2', undefined),
            'ether'
          ),
          transactionHash: _.get(event, 'transactionHash', undefined),
          blockNumber: _.get(event, 'blockNumber', undefined),
        };

        if (
          equalsIgnoringCase(trxData.to, companyAddress) ||
          equalsIgnoringCase(trxData.from, companyAddress) ||
          trxData.to === companyAddress ||
          trxData.from === companyAddress
        ) {
          return self.handleEvent(event);
        } else {
          self.logger.log(
            `There is no event for company wallet address` +
              JSON.stringify(event)
          );
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

    // listen from 0x7d6ccb5a4c212498ae46563492033c9903e96a5e to any User Address
    // this is the token address : 0x45aB600606AfbE64EcF41a45E29fD3cf3eB13Dbe
    // 20% of the transfer amount will goes and all below API with the wallet address will be user or any User address
    // an amount will be 20% of the what amount we get in the Transaction from the event
    // call the MGM reward Payout API https://prod-api-mgmreward.monopolon.io/api/#/users/UsersController_mgmRewardPayout

    this.mgmContractX.events
      .Transfer({})
      .on('connected', function (subscriptionId) {
        self.logger.verbose(
          'CONNECTED::event::For::MGMContractX::subscriptionId::' +
            subscriptionId
        );
      })
      .on('data', async function (event) {
        const trxData = {
          from: _.get(event, 'returnValues.0', undefined),
          to: _.get(event, 'returnValues.1', undefined),
          value: self.web3.utils.fromWei(
            _.get(event, 'returnValues.2', undefined),
            'ether'
          ),
          transactionHash: _.get(event, 'transactionHash', undefined),
          blockNumber: _.get(event, 'blockNumber', undefined),
        };

        if (
          trxData.from === companyAddressForMgmTransfer ||
          equalsIgnoringCase(trxData.from, companyAddressForMgmTransfer)
        ) {
          return self.handleEventForMgmContractX(event);
        } else {
          self.logger.log(
            `There is no mgm Transfer event for company wallet address` +
              JSON.stringify(event)
          );
        }
      })
      .on('changed', function (event) {
        self.logger.verbose(
          'CHANGED::event::For::MGMContractX::' + JSON.stringify(event)
        );
        // remove event from local database
      })
      .on('error', function (error, receipt) {
        self.logger.log(
          'ERROR::error/receipt:For::MGMContractX::' +
            JSON.stringify({ error, receipt })
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
        .andWhere('character.walletAddress = :walletAddress', {
          walletAddress: trxData.to,
        })
        .getOne()
        .then(async (character) => {
          if (character) {
            const team = await transactionalEntityManager
              .createQueryBuilder(Team, 'team')
              .setLock('pessimistic_write')
              .where('team.walletAddress = :walletAddress', {
                walletAddress: character.walletAddress,
              })
              .getOne();

            if (!team) {
              throw new HttpException(
                'Team Does not Exist',
                HttpStatus.BAD_REQUEST
              );
            }

            // here in all the condition we are checking that user has sufficient amount of all the stuff
            // like totalStr, totalStr, totalStr, etc...
            if (parseFloat(team.totalStr) < parseFloat(character.str)) {
              throw new HttpException(
                'Team does not have sufficient str',
                HttpStatus.BAD_REQUEST
              );
            } else if (parseFloat(team.totalDex) < parseFloat(character.dex)) {
              throw new HttpException(
                'Team does not have sufficient dex',
                HttpStatus.BAD_REQUEST
              );
            } else if (parseFloat(team.totalLuk) < parseFloat(character.Luk)) {
              throw new HttpException(
                'Team does not have sufficient Luk',
                HttpStatus.BAD_REQUEST
              );
            } else if (
              parseFloat(team.totalPrep) < parseFloat(character.prep)
            ) {
              throw new HttpException(
                'Team does not have sufficient prep',
                HttpStatus.BAD_REQUEST
              );
            } else if (parseFloat(team.totalHp) < parseFloat(character.hp)) {
              throw new HttpException(
                'Team does not have sufficient hp',
                HttpStatus.BAD_REQUEST
              );
            } else if (parseFloat(team.totalMp) < parseFloat(character.mp)) {
              throw new HttpException(
                'Team does not have sufficient mp',
                HttpStatus.BAD_REQUEST
              );
            }
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

            // here we are checking that user's character is in which slot
            // based on characterId we update the slot as null
            if (team.slot1 === character.id) {
              team.slot1 = null;
            } else if (team.slot2 === character.id) {
              team.slot2 = null;
            } else if (team.slot3 === character.id) {
              team.slot3 = null;
            } else if (team.slot4 === character.id) {
              team.slot4 = null;
            } else if (team.slot5 === character.id) {
              team.slot5 = null;
            } else {
              throw new HttpException(
                'No slot found with character id',
                HttpStatus.BAD_REQUEST
              );
            }

            // if user remove the character then we reduce the team's total stuff
            // like totalStr, totalPrep, etc..
            team.totalStr = (
              parseFloat(team.totalStr) - parseFloat(character.str)
            ).toString();

            team.totalPrep = (
              parseFloat(team.totalPrep) - parseFloat(character.prep)
            ).toString();

            team.totalMp = (
              parseFloat(team.totalMp) - parseFloat(character.mp)
            ).toString();

            team.totalHp = (
              parseFloat(team.totalHp) - parseFloat(character.hp)
            ).toString();

            team.totalLuk = (
              parseFloat(team.totalLuk) - parseFloat(character.Luk)
            ).toString();

            team.totalDex = (
              parseFloat(team.totalDex) - parseFloat(character.dex)
            ).toString();

            await transactionalEntityManager.save(team);

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
      trxData.to = _.get(event, 'returnValues.1', undefined);
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
                  const equipment = new Equipment();
                  character.walletAddress = equipment.walletAddress =
                    trxData.from;
                  character.erc721 = equipment.erc721 =
                    CONTRACT_ADDRESS[this.networkMode];
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

                  if (tokenMeta.type == 2) {
                    equipment.tokenId = tokenId;

                    equipment.charequiped = character.id.toString();

                    equipment.str =
                      tokenMeta.attributes.commonAttribute.str?.toString();

                    equipment.dex =
                      tokenMeta.attributes.commonAttribute.dex?.toString();

                    equipment.Luk =
                      tokenMeta.attributes.commonAttribute.luk?.toString();

                    equipment.prep =
                      tokenMeta.attributes.commonAttribute.prep?.toString();

                    equipment.mp =
                      tokenMeta.attributes.commonAttribute.mp?.toString();

                    equipment.hp =
                      tokenMeta.attributes.commonAttribute.hp?.toString();

                    equipment.status = EquipmentStatusType.UNEQUIPPED;

                    const equipmentResp = await transactionalEntityManager.save(
                      equipment
                    );
                    return equipmentResp;
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
                  const character = await transactionalEntityManager
                    .createQueryBuilder(Character, 'character')
                    .setLock('pessimistic_write')
                    .update(Character)
                    .set({
                      status: StatusType.ACTIVATED,
                    })
                    .where('character.tokenId = :tokenId', {
                      tokenId: tokenId,
                    })
                    .execute();

                  if (character && walletUser.enterGameStatus === 0) {
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
          newUser.mgmRewardsAccumulated = '0';
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
            .andWhere('character.walletAddress = :walletAddress', {
              walletAddress: newUser.walletAddress,
            })
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

                  transferEquipment.status = EquipmentStatusType.UNEQUIPPED;

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

  async handleEventForMgmContractX(event) {
    const base_url = 'https://prod-api-mgmreward.monopolon.io';
    const trxData = {
      from: _.get(event, 'returnValues.0', undefined),
      to: _.get(event, 'returnValues.1', undefined),
      amount: this.web3.utils.fromWei(
        _.get(event, 'returnValues.2', undefined),
        'ether'
      ),
      transactionHash: _.get(event, 'transactionHash', undefined),
      blockNumber: _.get(event, 'blockNumber', undefined),
    };

    if (!trxData.to || !trxData.amount) {
      return new HttpException(
        'walletAddress or amount is not found',
        HttpStatus.NOT_FOUND
      );
    }
    // here we send 2/3 of amount to user walletAddress
    const updatedAmount = trxData.amount * 0.666666666667;

    return await axios.post(
      `${base_url}/users/mgmRewardPayout?walletAddress=${trxData.to}&mgmTokenAmount=${updatedAmount}`
    );
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
