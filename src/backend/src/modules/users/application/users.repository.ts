import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../domain/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async create(data: Partial<User>): Promise<User> {
    const user = this.repository.create(data);
    return this.repository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
    });
  }

  async findByEmailIncludingDeleted(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
      withDeleted: true,
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.repository.update(id, data);
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found after update');
    }
    return user;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.repository.restore(id);
  }

  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.repository.findOne({
      where: { googleId },
    });
  }

  async count(): Promise<number> {
    return this.repository.count();
  }
}
