import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { NextFunction } from 'express';
import { decodeAuthToken } from '../utility/token-generator';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    @Inject(UserRepository) private readonly userDB: UserRepository,
  ) {}
  async use(req: Request | any, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.auth_token;
      if (!token) {
        throw new UnauthorizedException('Missing auth token');
      }
      const decode: any = decodeAuthToken(token);
      console.log('decode', decode);
      const user = await this.userDB.findById(decode._id);
      if (!user) {
        throw new UnauthorizedException('Unauthorized');
      }
      user.password = undefined;
      req.user = user;
      next();
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException(error.message);
    }
  }
}
