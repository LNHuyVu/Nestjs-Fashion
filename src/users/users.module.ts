import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Users, UserSchema } from 'src/shared/schema/users';
import { MailService } from 'src/emails/email.service';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/shared/middleware/roles.guard';
import { AuthMiddleware } from 'src/shared/middleware/auth';
import { AllExceptionFilter } from 'src/httpExceptionFilter';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    UserRepository,
    MailService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  imports: [
    MongooseModule.forFeature([
      {
        name: Users.name,
        schema: UserSchema,
      },
    ]),
  ],
})
export class UsersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '/users', method: RequestMethod.GET });
  }
}
