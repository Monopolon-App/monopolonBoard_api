import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import {
  Repository,
  getConnection,
  getManager,
  TreeRepository,
  Like,
} from 'typeorm';
import { UsersProfile } from './usersprofile.entity';
import { UpdateUserDto } from './dto/update-user-profile.dto';
import { Team } from '../team/team.entity';
import { Hq } from '../hq/hq.entity';
import { Character } from '../character/character.entity';
import { CONTRACT_ADDRESS } from '../constants/constants';
import { ListenerService } from '../listener/listeners.service';

@Injectable()
export class UsersProfileService {
  private readonly logger = new Logger(UsersProfileService.name);
  public networkMode;

  constructor(
    @InjectRepository(UsersProfile)
    private readonly usersRepository: Repository<UsersProfile>,
    private readonly configService: ConfigService,
    private readonly listenerService: ListenerService
  ) {
    this.networkMode =
      this.configService.get('ENV_TAG') === 'production'
        ? 'MAINNET'
        : 'TESTNET';
  }

  async getById(id: number): Promise<any> {
    try {
      const user = await this.usersRepository.findOne({
        id,
      });
      if (!user) {
        return new HttpException(
          {
            status: HttpStatus.OK,
            message: 'USer Not Found',
          },
          HttpStatus.OK
        );
      }

      return new HttpException(
        {
          status: HttpStatus.OK,
          message: 'Success',
          data: user,
        },
        HttpStatus.OK
      );
    } catch (error) {
      throw new HttpException(error?.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getByWalletAddress(walletAddress: string): Promise<any> {
    try {
      const user = await this.usersRepository.findOne({
        walletAddress: walletAddress,
      });

      if (user) {
        return user;
      }

      throw new HttpException('User does not exist', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(error?.message, HttpStatus.BAD_REQUEST);
    }
  }

  async createUser(
    userprofile: UsersProfile,
    files: Array<Express.Multer.File>
  ): Promise<any> {
    try {
      const userProfile = await this.usersRepository.save(userprofile);
      return {
        success: true,
        message: 'UserProfile created successfully.',
        result: userProfile,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getUserById(walletAddress: string): Promise<any> {
    try {
      const user = await this.usersRepository.findOne({
        relations: ['character'],
        where: { walletAddress },
      });
      if (user) {
        return new HttpException(
          {
            status: HttpStatus.OK,
            message: 'Success',
            data: user,
          },
          HttpStatus.OK
        );
      } else {
        return new HttpException(
          {
            status: HttpStatus.OK,
            message: 'USer Not Found',
          },
          HttpStatus.OK
        );
      }
    } catch (error) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async updateUserProfile(
    walletAddress: string,
    userData: UpdateUserDto
  ): Promise<any> {
    try {
      const user = new UsersProfile();
      user.walletAddress = walletAddress;
      await this.usersRepository.update(
        { walletAddress: walletAddress },
        userData
      );

      const updatesRecord = await this.usersRepository.findOne({
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

  async setCurrentRefreshToken(refreshToken: string, userId: number) {
    const currentHashedRefreshToken = await bcrypt.hashSync(refreshToken, 10);
    await this.usersRepository.update(
      { id: userId },
      {
        currentHashedRefreshToken,
      }
    );
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, userId: number) {
    const user = await this.usersRepository.findOne({ id: userId });

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.currentHashedRefreshToken
    );

    if (!isRefreshTokenMatching) {
      throw new HttpException('Incorrect refresh token!', HttpStatus.FORBIDDEN);
    }

    return user;
  }

  async removeRefreshToken(userId: number) {
    return this.usersRepository.update(
      { id: userId },
      {
        currentHashedRefreshToken: null,
      }
    );
  }

  async rollingDice(walletAddress: string, rollDice: number): Promise<any> {
    try {
      const user = await this.getByWalletAddress(walletAddress);

      if (user.noOfRoll === 1) {
        user.lastRollTimeStamp = new Date();
      }

      if (user.noOfRoll > 1) {
        user.noOfRoll = Number.parseInt(user.noOfRoll) - 1;
      }

      const updatesRecord = await this.usersRepository.save(user);

      return new HttpException(
        { message: 'Updated Successfully', data: updatesRecord },
        HttpStatus.NO_CONTENT
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async enterMining(walletAddress: string): Promise<any> {
    try {
      const user = await this.getByWalletAddress(walletAddress);

      if (user.noOfLastAction === 1) {
        user.lastActionTimeStamp = new Date();
      } else if (user.noOfLastAction > 1) {
        user.noOfLastAction -= 1;
      }

      const updatesRecord = await this.usersRepository.save(user);

      return new HttpException(
        { message: 'Updated Successfully', data: updatesRecord },
        HttpStatus.NO_CONTENT
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async registerUser(walletAddress: string, tokenId: number) {
    try {
      const tokenMeta = await this.listenerService.getNftMetadata(
        tokenId,
        CONTRACT_ADDRESS[this.networkMode]
      );

      return getManager().transaction(async (transactionalEntityManager) => {
        return transactionalEntityManager
          .createQueryBuilder(UsersProfile, 'users_profile')
          .setLock('pessimistic_write')
          .where('users_profile.walletAddress = :walletAddress', {
            walletAddress: walletAddress,
          })
          .getOne()
          .then(async (walletUser) => {
            if (walletUser) {
              throw new UnauthorizedException(
                'wallet address already registered'
              );
            }

            // if user not found with wallet address then register new user
            // create new team
            const team = new Team();
            team.walletAddress = walletAddress;
            const teamRecord = await transactionalEntityManager.save(team);
            this.logger.debug(
              `-Listener:Create:Team:${JSON.stringify(teamRecord)}`
            );

            // create new user record and assign team to user
            const lastRollActionTimeStamp = new Date();
            lastRollActionTimeStamp.setHours(new Date().getHours() - 6);
            const newUser = new UsersProfile();
            newUser.walletAddress = walletAddress;
            newUser.lastRollTimeStamp = lastRollActionTimeStamp; // 6 h before
            newUser.lastActionTimeStamp = lastRollActionTimeStamp;
            newUser.mlonRewardsAccumulated = '0';
            newUser.gridPosition = 0;
            newUser.noOfRoll = 1;
            newUser.enterGameStatus = 1;
            newUser.teamId = teamRecord.id;
            const newUserRecord = await transactionalEntityManager.save(
              newUser
            );
            this.logger.debug(
              `-Listener:Create:UserProfile:${JSON.stringify(newUserRecord)}`
            );

            // Create a new HQ for users, Randomly assigning a gridPosition.
            const newHQ = new Hq();
            newHQ.status = 1;
            newHQ.hqGridPosition = await this.listenerService.getRandomInt(
              1,
              126
            );
            newHQ.userId = newUserRecord.id;
            newHQ.walletAddress = newUserRecord.walletAddress;

            await transactionalEntityManager.save(newHQ);

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
                  transferTransaction.erc721 =
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

                  console.log(
                    '::LOG::SUCCESS::teamRecord Result:',
                    teamRecord1
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
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
