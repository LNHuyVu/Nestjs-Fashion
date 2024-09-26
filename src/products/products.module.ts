import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Products, ProductShema } from 'src/shared/schema/products';
import { Users, UserSchema } from 'src/shared/schema/users';
import { StripeModule } from 'nestjs-stripe';
import config from 'config';
import { AuthMiddleware } from 'src/shared/middleware/auth';
import { ProductRespository } from 'src/shared/repositories/product.respository';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/shared/middleware/roles.guard';
import { License, LicenseSchema } from 'src/shared/schema/license';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductRespository,
    UserRepository,
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  imports: [
    MongooseModule.forFeature([{ name: Products.name, schema: ProductShema }]),
    MongooseModule.forFeature([
      {
        name: Users.name,
        schema: UserSchema,
      },
    ]),
    MongooseModule.forFeature([{ name: License.name, schema: LicenseSchema }]),
    // StripeModule.forRoot({
    //   apiKey: config.get('stripe.secret_key'),
    //   apiVersion: '2024-06-20',
    // }),
  ],
})
export class ProductsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        {
          path: `${config.get('prefix')}/products`,
          method: RequestMethod.GET,
        },
        {
          path: `${config.get('prefix')}/products/:id`,
          method: RequestMethod.GET,
        },
      )
      .forRoutes(ProductsController);
  }
}
