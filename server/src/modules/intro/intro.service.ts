/** eslint-disable */
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Intro } from './entity/intro.entity';
import { RCode } from '../../common/tool/utils';
import * as fs from 'fs';
import * as path from 'path';
import { OpenAIService } from './openai.service';
import * as crypto from 'crypto';
@Injectable()
export class IntroService {
  private templateData: any;
  constructor(
    @InjectRepository(Intro)
    private readonly introRepository: Repository<Intro>,
    private openAI: OpenAIService = new OpenAIService(),
  ) {
    this.templateData  = {
      'intro-template': fs.readFileSync(path.join(__dirname, '../../../public', 'intro-template.txt'), 'utf8'),
      'introAssessmentStruct': fs.readFileSync(path.join(__dirname, '../../../public', 'introAssessmentStruct.txt'), 'utf8'),
    }
  }
  
  async getIntro(introId: string) {
    try {
      let res;
      if (introId) {
        res = await this.introRepository.findOne({
          where: { introId: introId },
        });
        return { msg: '获取简历成功', data:res };
      }
    } catch (e) {
      return { code: RCode.ERROR, msg: '获取简历失败', data: e };
    }
  }
  /**
   * 
   * @param introIds 
   * @param num 
   * @param page 
   * @returns 
   */
  async listIntros(introIds: string = '', num: number = 10, page: number = 1) {
    try {
      let queryBuilder = this.introRepository.createQueryBuilder('intro');
  
      if (introIds) {
        // If specific introIds are provided, filter by these IDs
        const introIdArr = introIds.split(',').filter(id => id.trim());
        queryBuilder = queryBuilder.where('intro.introId IN (:...introIdArr)', { introIdArr });
      }
  
      // Always calculate total count
      const totalCount = await queryBuilder.getCount();
  
      // Apply pagination if no specific introIds are provided
      if (!introIds) {
        queryBuilder = queryBuilder.skip((page - 1) * num).take(num);
      }
  
      const data = await queryBuilder.getMany();
      const totalPage = Math.ceil(totalCount / num); // Calculate total pages
  
      return { msg: '获取简历成功', data, totalPage, totalCount };
    } catch (e) {
      return { code: 'ERROR', msg: '获取简历失败', data: e };
    }
  }
  
  
  async postIntros(introIds: string) {
    try {
      if (introIds) {
        const introIdArr = introIds.split(',');
        const Arr = [];
        for (const introId of introIdArr) {
          if (introId) {
            const data = await this.introRepository.findOne({
              where: { introId: introId },
            });
            Arr.push(data);
          }
        }
        return { msg: '批量获取简历信息成功', data: Arr };
      }
      return { code: RCode.FAIL, msg: '批量获取简历信息失败', data: null };
    } catch (e) {
      return { code: RCode.ERROR, msg: '批量获取简历信息失败', data: e };
    }
  }

  async saveOne(intro: Intro) {
    try {
      let one = await this.introRepository.findOne({
        where: { introId: intro.introId },
      });
      if (!one) {
        one = this.introRepository.create(intro);
      } else {
        one = this.introRepository.merge(one, intro);
      }
      // Object.assign(user, updateData);
      const savedOne = await this.introRepository.save(one);
      return { code: RCode.OK, msg: '简历保存成功', data: savedOne };
    } catch (e) {
      console.error('Error saving the intro:', e);
      return { code: RCode.ERROR, msg: '保存简历失败', data: e };
    }
  }
  async getAssessment(fileContent: string) {
    const completion = await this.openAI.OpenAI.chat.completions.create({
      model: 'moonshot-v1-32k',
      temperature: 1,
      messages: [
        {
          role: 'system',
          content: `我是简历检查官，以下是优秀简历及评分参考
          -${this.templateData['intro-template']}`,
        },
        {
          role: 'system',
          content: `我的简历 ${fileContent}`,
        },
        {
          role: 'user',
          content: `你是简历检查官，你需要对上传的简历内容进行严格到一位小数评分（尖括号标签（angle bracket tag）标出我要的变量，如<num-xxx>10</num-xxx>）:
        这里有参考资料：x.毕业院校根据大学排行榜进行评分 x.学历分差要大 x.项目经历国家级省级校级之间分差也大 x.熟练技能的程度分差也要大
        我需要拿到以下变量
        -${this.templateData['introAssessmentStruct']}`,
        },
      ],
    });
    return completion.choices[0].message.content;
  }
  /**
   * 简历评分（第一次入库）
   * @param id 
   * @param file 
   * @returns 
   */
  async fetchAssessment(id: string, file: Express.Multer.File) {
    let intro: Intro = await this.introRepository.findOne({
      where: { introId: id },
    }); 
    if (intro) { // 已存在的
      
    }
    const md5Hash = crypto.createHash('md5').update(file.buffer).digest('hex'); 
    intro = await this.introRepository.findOne({
      where: { MD5: md5Hash },
    }) || new Intro(); //已经上传的就不用再上传了
    const newFilename = `${md5Hash}${path.extname(file.originalname)}`;
    const filePath = path.join(__dirname, '../../../', 'public', newFilename);
    let fileContent;
    if(!intro.context){ //数据库有数据，且简历内容被提取
      await fs.promises.writeFile(filePath, file.buffer);
      let fileObject = await this.openAI.OpenAI.files.create({
        file: fs.createReadStream(filePath)  as any,
        purpose: "file-extract"  as any
      });
      fileContent = await (await this.openAI.OpenAI.files.content(fileObject.id)).text();
    } else {
      fileContent = intro.context;
    }
    intro.context = fileContent;
    intro.MD5 = md5Hash;
    intro.fileURL = `/${newFilename}`;
    intro.assessment = intro.assessment || await this.getAssessment(intro.context)
    intro = this.matchIntro(intro);
    intro = await this.introRepository.save(intro); // assuming introId is the primary key and needs to be set manually
    return { code: RCode.OK, msg: '简历保存成功', data: intro };
  }
  /**
   * 简历评分排位 async calculateAssessment()
   * @param isAll=true 如果需要评分所有为true
   * @param ids 按给的ids评分
   */
  async calculateAssessment(isAll:boolean = true, ids:Array<string>) {
    let introResponeds: Intro[] = [];
    //复用函数设置对象
    // const saveIntros = async (object, intro:Intro) =>{
    //   for (const key in object) {
    //     if (object.hasOwnProperty(key)) {
    //       const element = object[key];
    //       if(element.score){
    //         intro.score = element.score;
    //         intro.name = element.name;
    //       }
    //     }
    //   }
    //   await this.introRepository.save(intro);
    //   introResponeds.push(intro);

    // }
    if(isAll){
      const introArr = await this.introRepository.find();
      for (const intro of  introArr) {
        let newIntro = this.matchIntro(intro)
        await this.introRepository.save(newIntro);
        introResponeds.push(newIntro);
      }
    } else {
      for (const id of ids) {
        let newIntro = await this.introRepository.findOne({
          where: { introId: id },
        });
        if (newIntro) {
          newIntro = this.matchIntro(newIntro)
          await this.introRepository.save(newIntro);
          introResponeds.push(newIntro);
        }
      }
    }
    return { code: RCode.OK, msg: '简历特殊分算法写入成功', data: introResponeds };
  }
  matchIntro(intro:Intro){ //匹配字段进数据库
    const score = intro.assessment.match(/<num-total-score>([^<]+)<\/num-total-score>/);
    const name = intro.assessment.match(/<str-name>([^<]+)<\/str-name>/);
    const school = intro.assessment.match(/<str-school>([^<]+)<\/str-school>/);
    const degree = intro.assessment.match(/<str-degree>([^<]+)<\/str-degree>/);
    const tag = intro.assessment.match(/<str-tag>([^<]+)<\/str-tag>/);
    if (score && score[1])  intro.score = parseFloat(score[1]);
    if (name && name[1])  intro.name = name[1];
    if (school && school[1])  intro.school = school[1];
    if (degree && degree[1])  intro.degree = degree[1];
    if (tag && tag[1])  intro.tag = tag[1];
    return intro;
  }
}
