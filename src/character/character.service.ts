import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  Repository,
  getConnection,
  getManager,
  TreeRepository,
  Like,
} from 'typeorm';
import { Character, StatusType } from './character.entity';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { Equipment } from 'src/equipment/equipment.entity';
import { UsersProfile } from '../usersprofile/usersprofile.entity';

@Injectable()
export class CharacterService {
  monthToDays(arg0: number) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(Character)
    private readonly characterRepository: Repository<Character>
  ) {}

  async getById(userId: number): Promise<any> {
    try {
      const user = await this.characterRepository.findOne({ id: userId });

      if (user) {
        return 'data';
      }

      return new HttpException(
        'character does not exist',
        HttpStatus.NOT_FOUND
      );
    } catch (error) {
      throw error;
    }
  }

  async createCharacter(
    characters: Character,
    files: Array<Express.Multer.File>
  ): Promise<any> {
    try {
      const char = await this.characterRepository.save(characters);
      return {
        success: true,
        message: 'Character created successfully.',
        result: char,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getUserById(walletAddress: string): Promise<any> {
    try {
      const [user, count] = await this.characterRepository.findAndCount({
        where: { walletAddress },
      });

      if (count > 0) {
        return new HttpException(
          {
            status: HttpStatus.OK,
            message: 'Success',
            data: user,
          },
          HttpStatus.OK
        );
      }
      return new HttpException('User not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async updateCharacter(
    WalletAddress: string,
    characterData: UpdateCharacterDto
  ): Promise<any> {
    try {
      const char = new Character();
      char.walletAddress = WalletAddress;
      await this.characterRepository.update(
        { walletAddress: WalletAddress },
        characterData
      );

      const updatesRecord = await this.characterRepository.findOne({
        walletAddress: WalletAddress,
      });

      return new HttpException(
        { message: 'Updated Successfully', data: updatesRecord },
        HttpStatus.NO_CONTENT
      );
    } catch (error) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  public async updateCharacterStrength(
    equipment: Equipment,
    equip: boolean
  ): Promise<any> {
    try {
      console.log(equipment);
      const char = await this.characterRepository.findOne({
        id: +equipment.charequiped,
      });

      if (equip) {
        char.str = (+char.str + +equipment.str).toString();
        char.dex = (+char.dex + +equipment.dex).toString();
        char.Luk = (+char.Luk + +equipment.Luk).toString();
        char.prep = (+char.prep + +equipment.prep).toString();
        char.hp = (+char.hp + +equipment.hp).toString();
        char.mp = (+char.mp + +equipment.mp).toString();
      } else {
        char.str =
          char.str && +char.str > 0 && (+char.str - +equipment.str).toString();
        char.dex =
          char.dex && +char.dex > 0 && (+char.dex - +equipment.dex).toString();
        char.Luk =
          char.Luk && +char.Luk > 0 && (+char.Luk - +equipment.Luk).toString();
        char.prep =
          char.prep &&
          +char.prep > 0 &&
          (+char.prep - +equipment.prep).toString();
        char.hp =
          char.hp && +char.hp > 0 && (+char.hp - +equipment.hp).toString();
        char.mp =
          char.mp && +char.mp > 0 && (+char.mp - +equipment.mp).toString();
      }

      const updateChar = await this.characterRepository.update(
        { id: +equipment.charequiped },
        char
      );

      if (updateChar) {
        const updatedRecord = await this.characterRepository.findOne({
          id: +equipment.charequiped,
        });

        return updatedRecord;
      }
    } catch (error) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async removingNFTFromUserWallet(characterId: number) {
    try {
      return getManager().transaction(async (transactionalEntityManager) => {
        return await this.characterRepository
          .findOne({
            id: characterId,
          })
          .then(async (character) => {
            await transactionalEntityManager
              .createQueryBuilder(Character, 'character')
              .update(Character)
              .set({
                status: StatusType.REMOVING,
              })
              .where('character.id = :id', {
                id: character.id,
              })
              .execute();

            const remainingCharacter = await transactionalEntityManager
              .createQueryBuilder(Character, 'character')
              .where('character.walletAddress = :walletAddress', {
                walletAddress: character.walletAddress,
              })
              .andWhere([
                { status: StatusType.ACTIVATED },
                { status: StatusType.NULL },
              ])
              .getCount();

            if (remainingCharacter === 0) {
              await transactionalEntityManager
                .createQueryBuilder(UsersProfile, 'users_profile')
                .setLock('pessimistic_write')
                .update(UsersProfile)
                .set({
                  enterGameStatus: 0,
                })
                .where('users_profile.walletAddress = :walletAddress', {
                  walletAddress: character.walletAddress,
                })
                .execute();
            }
            return {
              status: true,
              message: 'updated SuccessFully',
            };
          })
          .catch(() => {
            throw new HttpException(
              {
                status: false,
                message: 'No character found for this id',
              },
              HttpStatus.NOT_FOUND
            );
          });
      });
    } catch (error) {
      throw new HttpException(
        {
          status: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async exitGame(walletAddress: string) {
    try {
      return getManager().transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager
          .createQueryBuilder(Character, 'character')
          .where('character.walletAddress = :walletAddress', {
            walletAddress: walletAddress,
          })
          .andWhere([
            { status: StatusType.ACTIVATED },
            { status: StatusType.NULL },
          ])
          .update(Character)
          .set({
            status: StatusType.REMOVING,
          })
          .execute();

        // once we are schedule nft transfer event automatically them we uncomment this part
        // according to nikhil

        // await transactionalEntityManager
        //   .createQueryBuilder(UsersProfile, 'users_profile')
        //   .setLock('pessimistic_write')
        //   .update(UsersProfile)
        //   .set({
        //     enterGameStatus: 0,
        //   })
        //   .where('users_profile.walletAddress = :walletAddress', {
        //     walletAddress: walletAddress,
        //   })
        //   .execute();

        return {
          status: true,
          message: 'updated SuccessFully',
        };
      });
    } catch (error) {
      throw new HttpException(
        {
          status: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
