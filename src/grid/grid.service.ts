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
import { Grid } from './grid.entity';
import { UpdateGridDto } from './dto/update-grid.dto';
import { WanderingMerchantService } from 'src/WanderingMerchant/wanderingMerchant.service';

@Injectable()
export class GridService {
  @Inject(WanderingMerchantService)
  private wanderingMerchantService: WanderingMerchantService;

  monthToDays(arg0: number) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(Grid)
    private readonly gridRepository: Repository<Grid>
  ) {}

  async getById(userId: number): Promise<any> {
    try {
      const user = await this.gridRepository.findOne({ id: userId });

      if (user) {
        return 'data';
      }

      return new HttpException('User does not exist', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw error;
    }
  }

  async createGrid(
    grid: Grid,
    files: Array<Express.Multer.File>
  ): Promise<any> {
    try {
      const Grid = await this.gridRepository.save(grid);
      return {
        success: true,
        message: 'Grid created successfully.',
        result: Grid,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getUserById(walletAddress: string): Promise<any> {
    try {
      const [user, count] = await this.gridRepository.findAndCount({
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
      return new HttpException('Grid not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async updateGrid(
    walletAddress: string,
    gridData: UpdateGridDto
  ): Promise<any> {
    try {
      const user = new Grid();
      user.walletAddress = walletAddress;
      await this.gridRepository.update(
        { walletAddress: walletAddress },
        gridData
      );

      const updatesRecord = await this.gridRepository.findOne({
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

  async getEventByGridId(id: number) {
    try {
      // TODO: we need to add data for grid 1-25 in db
      const grid = await this.gridRepository.findOne({ id: id });

      if (!grid) {
        throw new HttpException(
          'grid does not exist for this id',
          HttpStatus.NOT_FOUND
        );
      }
      if (grid.description === 'Wandering Merchant') {
        const wanderingMerchant = this.wanderingMerchantService.getByStatus(1);
        if (wanderingMerchant) {
          return wanderingMerchant;
        }
        throw new HttpException(
          'wandering merchant does not exist for this id',
          HttpStatus.NOT_FOUND
        );
      } else {
        return grid;
      }
      return grid;
    } catch (error) {
      throw error;
    }
  }
}
