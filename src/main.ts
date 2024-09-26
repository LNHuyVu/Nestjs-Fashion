import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import config from 'config';
import { TransformationInterception } from './responseInterceptor';
import cookieParser from 'cookie-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  
  app.setGlobalPrefix(config.get('prefix'));
  app.useGlobalInterceptors(new TransformationInterception());

  await app.listen(config.get('port'), () => {
    return console.log(`Server in running on port ${config.get('port')}`);
  });
}
bootstrap();
