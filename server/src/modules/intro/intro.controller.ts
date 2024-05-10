import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { IntroService } from './intro.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
@Controller('intro')
// @UseGuards(AuthGuard('jwt'))
export class IntroController {
  constructor(private readonly introService: IntroService) {
      console.log('IntroController instantiated');
  }

  @Get()
  getIntro(@Query('introId') introId: string) {
    return this.introService.getIntro(introId);
  }

  @Post()
  postIntros(@Body('introIds') introIds: string) {
    return this.introService.postIntros(introIds);
  }
  @Post('/update')
  saveOne(@Body() intro) {
    return this.introService.saveOne(intro);
  }

  @Post('/fetchAssessment')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAndAssess(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Simply pass the file to the service
    const updatedIntro = await this.introService.fetchAssessment(id, file);
    return { message: 'Assessment updated successfully', data: updatedIntro };
  }
}
