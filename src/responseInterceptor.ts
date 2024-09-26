import {
  CallHandler,
  ExecutionContext,
  HttpException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface Response<T> {
  message: string;
  success: boolean;
  result: any;
  timeStamp: Date;
  statusCode: number;
}

export class TransformationInterception<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const statusCode = context.switchToHttp().getResponse().statusCode;
    const path = context.switchToHttp().getResponse().url;
    return next.handle().pipe(
      map((data) => ({
        message: data.message,
        success: data.success,
        result: data.result,
        timeStamp: new Date(),
        statusCode,
        path,
        error: null,
      })),
    );
  }
}
