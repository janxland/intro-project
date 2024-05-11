import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { IntroService } from './intro.service';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { readFile } from 'fs';
@Controller('intro')
// @UseGuards(AuthGuard('jwt'))
export class IntroController {
  constructor(private readonly introService: IntroService) {
      console.log('IntroController instantiated');
  }
  /**
   * 
   * @param introIds 
   * @param num 
   * @param page 
   * @returns 
  */
  @Get('/list')
  listIntros(@Query('introIds') introIds: string,@Query('num') num: number,@Query('page') page: number){
    return this.introService.listIntros(introIds,num,page);
  }

  @Get("/get")
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
    const updatedIntro = await this.introService.fetchAssessment(id, file);
    return { message: 'Assessment updated successfully', data: updatedIntro };
  }

  /**
   * 简历评分排位 async calculateAssessment()
   * @param isAll=true 如果需要评分所有为true
   * @param ids 按给的ids评分
   */
  @Post('/calculateAssessment')
  async calculateAssessment(@Body('isAll') isAll: boolean,@Body('ids') ids: string[]) {
    return this.introService.calculateAssessment(isAll,ids);
  }

}
