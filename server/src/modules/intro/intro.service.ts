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
import { v4 as uuidv4 } from 'uuid';
import { Uploadable } from 'openai/uploads';
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
      let data;
      if (introId) {
        data = await this.introRepository.findOne({
          where: { introId: introId },
        });
        return { msg: '获取简历成功', data };
      }
    } catch (e) {
      return { code: RCode.ERROR, msg: '获取简历失败', data: e };
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

      return { code: 200, msg: '简历保存成功', data: savedOne };
    } catch (e) {
      console.error('Error saving the intro:', e);
      return { code: RCode.ERROR, msg: '保存简历失败', data: e };
    }
  }
  async fetchAssessment(id: string, file: Express.Multer.File) {
    if (id) {
      let intro: Intro = await this.introRepository.findOne({
        where: { introId: id },
      });
      if (intro) {
        throw new NotFoundException(`No Intro found with ID ${id}`);
        return this.introRepository.save(intro);
      }
    } else {
      if (!file) {
        throw new NotFoundException('No file uploaded.');
      }
      let intro = new Intro();
      const md5Hash = crypto.createHash('md5').update(file.buffer).digest('hex');
      const newFilename = `${md5Hash}${path.extname(file.originalname)}`;
      const filePath = path.join(__dirname, '../../../', 'public', newFilename);
      // 保存文件到服务器
      await fs.promises.writeFile(filePath, file.buffer);
      let fileObject = await this.openAI.OpenAI.files.create({
        file: fs.createReadStream(filePath)  as any,
        purpose: "file-extract"  as any
      });
      // 调用AI接口获取评估结果
      const fileContent = await (await this.openAI.OpenAI.files.content(fileObject.id)).text();
      const completion = await this.openAI.OpenAI.chat.completions.create({
        model: 'moonshot-v1-32k',
        temperature: 0.2,
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
      intro.assessment = completion.choices[0].message.content;
      intro = this.introRepository.create(intro); // assuming introId is the primary key and needs to be set manually
      return { code: 200, msg: '简历保存成功', data: intro };
    }
  }
}
