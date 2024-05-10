import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Intro } from '../intro/entity/intro.entity';
import { IntroController } from './intro.controller';
import { IntroService } from './intro.service';
import { OpenAIService } from './openai.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Intro
    ]),
  ],
  providers: [IntroService,OpenAIService,Object],
  controllers: [IntroController],
})
export class IntroModule {}
