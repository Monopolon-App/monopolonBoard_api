import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { getConnection, getManager, Repository } from 'typeorm';
import { WanderingMerchant } from './wanderingMerchant.entity';
import { UsersProfile } from '../usersprofile/usersprofile.entity';
import { Equipment, EquipmentStatusType } from '../equipment/equipment.entity';
import { CONTRACT_ADDRESS } from '../constants/constants';
import { ListenerService } from '../listener/listeners.service';
import { ApiProperty } from '@nestjs/swagger';
import {
  Transaction,
  TransactionType,
} from '../transaction/transaction.entity';

export class WanderingMerchantBody {
  @ApiProperty()
  walletAddress: string;
}

@Injectable()
export class WanderingMerchantService {
  public networkMode;

  constructor(
    @InjectRepository(WanderingMerchant)
    private readonly wanderingMerchantRepository: Repository<WanderingMerchant>,
    private readonly listenerService: ListenerService,
    private readonly configService: ConfigService
  ) {
    this.networkMode =
      this.configService.get('ENV_TAG') === 'production'
        ? 'MAINNET'
        : 'TESTNET';
  }

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

  async purchaseEquipment(
    id: number,
    wanderingMerchantData: WanderingMerchantBody
  ) {
    try {
      const user = await getConnection()
        .createQueryBuilder()
        .select('users_profile')
        .from(UsersProfile, 'users_profile')
        .where('users_profile.walletAddress = :walletAddress', {
          walletAddress: wanderingMerchantData.walletAddress,
        })
        .getOne();

      const wanderingMerchant = await this.wanderingMerchantRepository.findOne({
        id: id,
      });

      const tokenId = parseInt(wanderingMerchant.tokenId);

      const tokenMeta = await this.listenerService.getNftMetadata(
        tokenId,
        CONTRACT_ADDRESS[this.networkMode]
      );

      const userMgmRewards = user.mgmRewardsAccumulated;
      const equipmentDiscountedPrice = wanderingMerchant.discountedPrice;

      if (wanderingMerchant.status === 0) {
        throw new HttpException(
          'This equipment is already purchased',
          HttpStatus.BAD_REQUEST
        );
      }

      if (userMgmRewards > equipmentDiscountedPrice) {
        return getManager().transaction(async (transactionalEntityManager) => {
          await transactionalEntityManager
            .createQueryBuilder(UsersProfile, 'users_profile')
            .setLock('pessimistic_write')
            .update(UsersProfile)
            .set({
              mgmRewardsAccumulated: (
                parseFloat(userMgmRewards) -
                parseFloat(equipmentDiscountedPrice)
              ).toString(),
            })
            .where('users_profile.walletAddress = :walletAddress', {
              walletAddress: wanderingMerchantData.walletAddress,
            })
            .execute();

          await transactionalEntityManager
            .createQueryBuilder(WanderingMerchant, 'wandering_merchant')
            .setLock('pessimistic_write')
            .update(WanderingMerchant)
            .set({
              status: 0,
            })
            .where('wandering_merchant.id = :id', {
              id: id,
            })
            .execute();

          const equipment = new Equipment();
          equipment.walletAddress = user.walletAddress;
          equipment.tokenId = wanderingMerchant.tokenId;
          equipment.charequiped = user.id.toString();
          equipment.erc721 = CONTRACT_ADDRESS[this.networkMode];
          equipment.Luk = tokenMeta.attributes.commonAttribute.luk?.toString();
          equipment.str = tokenMeta.attributes.commonAttribute.str?.toString();
          equipment.dex = tokenMeta.attributes.commonAttribute.dex?.toString();
          equipment.prep =
            tokenMeta.attributes.commonAttribute.prep?.toString();
          equipment.mp = tokenMeta.attributes.commonAttribute.mp?.toString();
          equipment.hp = tokenMeta.attributes.commonAttribute.hp?.toString();
          equipment.category = tokenMeta.attributes.category;
          equipment.thumburl = wanderingMerchant.imageURL;
          equipment.status = EquipmentStatusType.EQUIPPED;

          const equipmentResp = await transactionalEntityManager.save(
            equipment
          );

          const transaction = new Transaction();
          transaction.walletAddress = user.walletAddress;
          transaction.description = 'Transfer Equipment to User WalletAddress';
          transaction.userId = user.id;
          transaction.type = TransactionType.EQUIPMENT_TRANSFER;

          await transactionalEntityManager.save(transaction);

          return {
            status: true,
            message: 'Equipment Received SuccessFully',
            data: equipmentResp,
          };
        });
      } else {
        throw new HttpException(
          'User does not have sufficient balance to buy this equipment',
          HttpStatus.BAD_REQUEST
        );
      }
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
