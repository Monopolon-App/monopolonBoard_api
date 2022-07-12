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
import { WanderingMerchant } from './wanderingMerchant.entity';

@Injectable()
export class WanderingMerchantService {
  constructor(
    @InjectRepository(WanderingMerchant)
    private readonly wanderingMerchantRepository: Repository<WanderingMerchant>
  ) {}

  public async getByStatus(status: number): Promise<any> {
    try {
      const wanderingMerchant = await this.wanderingMerchantRepository.findOne({
        status: status,
      });
      if (wanderingMerchant) {
        return wanderingMerchant;
      }
      return new HttpException('User does not exist', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw error;
    }
  }
}
