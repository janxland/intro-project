import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Intro {
  @PrimaryGeneratedColumn('uuid')
  introId: string;

  //保存文件的MD5
  @Column({ default: '' })
  MD5: string;

  @Column({ default: '' })
  flieURL: string;
  // 简历内容（OCR）
  @Column({ default: '' })
  context: string;
  // 评分返回
  @Column({ default: '' })
  assessment: string;
  // 属于用户id
  @Column({ default: '' })
  userId: string;

  @Column({ default: 'on' })
  status: string;

  @Column({ default: '' })
  tag: string;

  @Column({ type: 'double', default: new Date().valueOf() })
  createTime: number;

  @Column({ type: 'double', default: new Date().valueOf() })
  updateTime: number;
}
