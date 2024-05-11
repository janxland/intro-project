import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity()
export class Intro {
  @PrimaryGeneratedColumn('uuid')
  introId: string;

  @Column({ default: '' })
  name: string;

  @Column({ default: '' })
  school: string;

  @Column({ default: '' })
  degree: string;

  @PrimaryColumn()
  @Column({ default: '' })
  MD5: string;

  @Column({ default: '' })
  fileURL: string;

  @Column({ type: 'text' })
  context: string;

  @Column({ type: 'text' })
  assessment: string;
  // 属于用户id
  @Column({ default: '' })
  userId: string;

  @Column({ default: 'on' })
  status: string;

  //简历评分 （特殊计算方法）小数
  @Column({ default: 0 , type: 'double'})
  score: number;

  @Column({ default: '' })
  tag: string;

  @Column({ type: 'double', default: new Date().valueOf() })
  createTime: number;

  @Column({ type: 'double', default: new Date().valueOf() })
  updateTime: number;
}
