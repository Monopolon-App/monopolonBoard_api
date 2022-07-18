import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  Logger,
  Inject,
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
import { Equipment } from './equipment.entity';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { CharacterService } from 'src/character/character.service';

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
          { status: 'Unequiped' }
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
            { status: 'Unequiped' }
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
          { status: 'Equiped' }
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
}
