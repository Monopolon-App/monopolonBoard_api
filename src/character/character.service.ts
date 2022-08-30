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
      const char = await this.characterRepository.findOne({
        id: equipment.characterId,
      });

      if (equip) {
        char.str = (
          parseFloat(char.str) + parseFloat(equipment.str)
        ).toString();
        char.dex = (
          parseFloat(char.dex) + parseFloat(equipment.dex)
        ).toString();
        char.Luk = (
          parseFloat(char.Luk) + parseFloat(equipment.Luk)
        ).toString();
        char.prep = (
          parseFloat(char.prep) + parseFloat(equipment.prep)
        ).toString();
        char.hp = (parseFloat(char.hp) + parseFloat(equipment.hp)).toString();
        char.mp = (parseFloat(char.mp) + parseFloat(equipment.mp)).toString();
        if (equipment.category === 'Weapon') {
          char.weapon = equipment.id;
        } else if (equipment.category === 'Helmet') {
          char.helmet = equipment.id;
        } else if (equipment.category === 'Armour') {
          char.armor = equipment.id;
        } else if (equipment.category === 'Wing') {
          char.wings = equipment.id;
        } else if (equipment.category === 'Shoes') {
          char.shoes = equipment.id;
        }
      } else {
        if (parseFloat(char.str) < parseFloat(equipment.str)) {
          throw new HttpException(
            'Character does not have sufficient str',
            HttpStatus.BAD_REQUEST
          );
        } else if (parseFloat(char.dex) < parseFloat(equipment.dex)) {
          throw new HttpException(
            'Character does not have sufficient dex',
            HttpStatus.BAD_REQUEST
          );
        } else if (parseFloat(char.Luk) < parseFloat(equipment.Luk)) {
          throw new HttpException(
            'Character does not have sufficient Luk',
            HttpStatus.BAD_REQUEST
          );
        } else if (parseFloat(char.prep) < parseFloat(equipment.prep)) {
          throw new HttpException(
            'Character does not have sufficient prep',
            HttpStatus.BAD_REQUEST
          );
        } else if (parseFloat(char.hp) < parseFloat(equipment.hp)) {
          throw new HttpException(
            'Character does not have sufficient hp',
            HttpStatus.BAD_REQUEST
          );
        } else if (parseFloat(char.mp) < parseFloat(equipment.mp)) {
          throw new HttpException(
            'Character does not have sufficient mp',
            HttpStatus.BAD_REQUEST
          );
        }
        char.str = (
          parseFloat(char.str) - parseFloat(equipment.str)
        ).toString();

        char.prep = (
          parseFloat(char.prep) - parseFloat(equipment.prep)
        ).toString();

        char.mp = (parseFloat(char.mp) - parseFloat(equipment.mp)).toString();

        char.hp = (parseFloat(char.hp) - parseFloat(equipment.hp)).toString();

        char.Luk = (
          parseFloat(char.Luk) - parseFloat(equipment.Luk)
        ).toString();

        char.dex = (
          parseFloat(char.dex) - parseFloat(equipment.dex)
        ).toString();
      }

      const updateChar = await this.characterRepository.update(
        { id: equipment.characterId },
        char
      );

      if (updateChar) {
        const updatedRecord = await this.characterRepository.findOne({
          id: equipment.characterId,
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

        await transactionalEntityManager
          .createQueryBuilder(UsersProfile, 'users_profile')
          .setLock('pessimistic_write')
          .update(UsersProfile)
          .set({
            enterGameStatus: 0,
          })
          .where('users_profile.walletAddress = :walletAddress', {
            walletAddress: walletAddress,
          })
          .execute();

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
