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
import { Character } from './character.entity';
import { UpdateCharacterDto } from './dto/update-character.dto';

@Injectable()
export class CharacterService {
  monthToDays(arg0: number) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(Character)
    private readonly usersRepository: Repository<Character>
  ) {}

  async getById(userId: number): Promise<any> {
    try {
      const user = await this.usersRepository.findOne({ id: userId });

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
      const char = await this.usersRepository.save(characters);
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
      const [user, count] = await this.usersRepository.findAndCount({
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
      await this.usersRepository.update(
        { walletAddress: WalletAddress },
        characterData
      );

      const updatesRecord = await this.usersRepository.findOne({
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
}
