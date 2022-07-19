import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getManager, Repository } from 'typeorm';
import { Equipment, EquipmentStatusType } from './equipment.entity';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { CharacterService } from 'src/character/character.service';
import { Character } from '../character/character.entity';

@Injectable()
export class EquipmentService {
  @Inject(CharacterService)
  private characterService: CharacterService;

  monthToDays(arg0: number) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>
  ) {}

  async getById(walletAddress: string): Promise<any> {
    try {
      const user = await this.equipmentRepository.find({
        walletAddress: walletAddress,
      });

      if (user) {
        return {
          success: true,
          message: 'Equipment received successfully.',
          result: user,
        };
      }
      return new HttpException(
        'Equipment does not exist',
        HttpStatus.NOT_FOUND
      );
    } catch (error) {
      throw error;
    }
  }

  async createEquipment(
    withdrawal: UpdateEquipmentDto,
    files: Array<Express.Multer.File>
  ): Promise<any> {
    try {
      const fortunecard = await this.equipmentRepository.save(withdrawal);
      return {
        success: true,
        message: 'Equipment created successfully.',
        result: fortunecard,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getUserById(walletAddress: string): Promise<any> {
    try {
      const [user, count] = await this.equipmentRepository.findAndCount({
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

  async getEquipmentByTokenId(tokenId: string): Promise<any> {
    try {
      const equipments = await this.equipmentRepository.find({
        select: ['category'],
        where: { tokenId: tokenId },
      });

      if (equipments) {
        const diffEquipments = {};
        for (let i = 0; i < equipments.length; i++) {
          diffEquipments[equipments[i].category] =
            await this.equipmentRepository.find({
              where: { category: equipments[i].category, tokenId: tokenId },
            });
        }
        return new HttpException(
          {
            status: HttpStatus.OK,
            message: 'Success',
            data: diffEquipments,
          },
          HttpStatus.OK
        );
      }
      return new HttpException('User not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async updateEquipment(
    walletAddress: string,
    equipmentData: UpdateEquipmentDto
  ): Promise<any> {
    try {
      const user = new Equipment();
      user.walletAddress = walletAddress;
      await this.equipmentRepository.update(
        { walletAddress: walletAddress },
        equipmentData
      );

      const updatesRecord = await this.equipmentRepository.findOne({
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

  async updateEquipmentStatus(
    oldEquipmentId: number,
    newEquipmentId: number
  ): Promise<any> {
    try {
      if (oldEquipmentId && !newEquipmentId) {
        await this.equipmentRepository.update(
          {
            id: oldEquipmentId,
          },
          { status: EquipmentStatusType.UNEQUIPPED }
        );

        const oldEquipment = await this.equipmentRepository.findOne({
          id: oldEquipmentId,
        });

        const unEquipFromChar =
          await this.characterService.updateCharacterStrength(
            oldEquipment,
            false
          );
        return new HttpException(
          {
            message: 'Unequiped Successfully',
            data: {
              updateCharacter: unEquipFromChar,
              updatedEquipmet: oldEquipment,
            },
          },
          HttpStatus.NO_CONTENT
        );
      } else {
        if (oldEquipmentId) {
          await this.equipmentRepository.update(
            {
              id: oldEquipmentId,
            },
            { status: EquipmentStatusType.UNEQUIPPED }
          );

          const oldEquipment = await this.equipmentRepository.findOne({
            id: oldEquipmentId,
          });
          await this.characterService.updateCharacterStrength(
            oldEquipment,
            false
          );
        }

        const equipNew = await this.equipmentRepository.update(
          {
            id: newEquipmentId,
          },
          { status: EquipmentStatusType.EQUIPPED }
        );

        if (equipNew) {
          const updatedRecord = await this.equipmentRepository.findOne({
            id: newEquipmentId,
          });

          const updateCharacter =
            await this.characterService.updateCharacterStrength(
              updatedRecord,
              true
            );
          if (updateCharacter) {
            return new HttpException(
              {
                message: 'Updated Successfully',
                data: {
                  updateCharacter: updateCharacter,
                  updatedEquipmet: updatedRecord,
                },
              },
              HttpStatus.NO_CONTENT
            );
          }
        }

        return new HttpException(
          'Something went wrong',
          HttpStatus.BAD_REQUEST
        );
      }
    } catch (error) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async removeEquipment(id: number) {
    try {
      const equipment = await this.equipmentRepository.findOne({
        id: id,
      });

      if (!equipment) {
        throw new HttpException(
          'Equipment Does not Exist',
          HttpStatus.BAD_REQUEST
        );
      }

      if (equipment.status === EquipmentStatusType.REMOVED) {
        throw new HttpException(
          'Equipment is already Removed',
          HttpStatus.BAD_REQUEST
        );
      }

      return getManager().transaction(async (transactionalEntityManager) => {
        // here if equipment status is Equipped then we decrease character str, dex, Luk, prep, hp, mp
        if (equipment.status === EquipmentStatusType.EQUIPPED) {
          const character = await transactionalEntityManager
            .createQueryBuilder(Character, 'character')
            .setLock('pessimistic_write')
            .where('character.walletAddress = :walletAddress', {
              walletAddress: equipment.walletAddress,
            })
            .getOne();

          if (!character) {
            throw new HttpException(
              'Character does not Exist',
              HttpStatus.BAD_REQUEST
            );
          }

          if (character.str < equipment.str) {
            throw new HttpException(
              'Character does not have sufficient str',
              HttpStatus.BAD_REQUEST
            );
          } else if (character.dex < equipment.dex) {
            throw new HttpException(
              'Character does not have sufficient dex',
              HttpStatus.BAD_REQUEST
            );
          } else if (character.Luk < equipment.Luk) {
            throw new HttpException(
              'Character does not have sufficient Luk',
              HttpStatus.BAD_REQUEST
            );
          } else if (character.prep < equipment.prep) {
            throw new HttpException(
              'Character does not have sufficient prep',
              HttpStatus.BAD_REQUEST
            );
          } else if (character.hp < equipment.hp) {
            throw new HttpException(
              'Character does not have sufficient hp',
              HttpStatus.BAD_REQUEST
            );
          } else if (character.mp < equipment.mp) {
            throw new HttpException(
              'Character does not have sufficient mp',
              HttpStatus.BAD_REQUEST
            );
          }

          character.str = (
            parseFloat(character.str) - parseFloat(equipment.str)
          ).toString();

          character.dex = (
            parseFloat(character.dex) - parseFloat(equipment.dex)
          ).toString();

          character.Luk = (
            parseFloat(character.Luk) - parseFloat(equipment.Luk)
          ).toString();

          character.prep = (
            parseFloat(character.prep) - parseFloat(equipment.prep)
          ).toString();

          character.hp = (
            parseFloat(character.hp) - parseFloat(equipment.hp)
          ).toString();

          character.mp = (
            parseFloat(character.mp) - parseFloat(equipment.mp)
          ).toString();

          await transactionalEntityManager.save(character);
        }

        // then we set status as Removed for that character
        return transactionalEntityManager
          .createQueryBuilder(Equipment, 'equipment')
          .setLock('pessimistic_write')
          .update(Equipment)
          .set({
            status: EquipmentStatusType.REMOVED,
          })
          .where('equipment.id = :id', {
            id: id,
          })
          .execute()
          .then((equipment) => {
            return {
              status: true,
              message: 'Equipment Removed SuccessFully',
              data: equipment,
            };
          })
          .catch((error) => {
            throw new HttpException(
              {
                status: false,
                message: error.message,
              },
              HttpStatus.BAD_REQUEST
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
}
