import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getManager, Repository } from 'typeorm';
import { Looting } from './looting.entity';

@Injectable()
export class LootingService {
  constructor(
    @InjectRepository(Looting)
    private readonly lootingRepository: Repository<Looting>
  ) {}

  async getLootingByWalletAddress(walletAddress: string): Promise<any> {
    try {
      const [user, count] = await this.lootingRepository.findAndCount({
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
      return new HttpException('Loot not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async createLooting(looting: Looting): Promise<any> {
    try {
      const lootings = await this.lootingRepository.save(looting);
      return {
        success: true,
        message: 'Looting created successfully.',
        result: lootings,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getLootingById(lootingId: number): Promise<any> {
    const looting = await this.lootingRepository.findOne({
      relations: ['hq'],
      where: { id: lootingId },
    });

    return looting;
  }
}
