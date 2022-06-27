import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
