import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { ErrorEntity } from './error.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectRepository(ErrorEntity)
    private readonly errorRepository: Repository<ErrorEntity>
  ) {}
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const [statusCode, errorCode, message] = exception
      ? [exception.getStatus(), exception.constructor.name, exception.message]
      : [HttpStatus.INTERNAL_SERVER_ERROR, 'Unknown', 'internal server error'];

    this.errorRepository.save({
      errorCode: statusCode.toString(),
      timeStamp: new Date(),
      message: message,
      stackTrace: JSON.stringify(exception.stack),
    });
    response.status(statusCode).json({
      errorCode: errorCode,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
