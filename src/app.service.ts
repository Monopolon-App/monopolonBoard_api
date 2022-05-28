import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealthCheck(): any {
    return {
      status: 200,
      message: 'Service is alive',
    };
  }
}
