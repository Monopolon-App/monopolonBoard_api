import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Hq } from '../hq/hq.entity';

@Entity()
export class Looting {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ default: null })
  userId?: number;

  @Column({ default: null })
  gridPosition?: number;

  @Column({ default: null })
  walletAddress?: string;

  @Column({ default: null })
  amount?: string;

  @ManyToOne(() => Hq, (hq) => hq.looting)
  hq?: Hq;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
