import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntroModule } from './modules/intro/intro.module';
require('dotenv').config();
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: parseInt(process.env.MYSQL_PORT) || 3306,
      username: 'intro',
      password: process.env.MYSQL_PASSWORD || '123456',
      database: process.env.MYSQL_DATABASE || 'intro',
      charset: 'utf8mb4', // 设置chatset编码为utf8mb4
      autoLoadEntities: true,
      synchronize: true,
    }),
    IntroModule
  ],
})
export class AppModule {}
