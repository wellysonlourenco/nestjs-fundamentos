import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { In, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll() {
    return this.userRepository.find();
  }

  async findOne(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  async updatePartial(id: number, updateUserDto: Partial<UpdateUserDto>) {
    return this.userRepository.update(id, updateUserDto);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    let user = await this.findOne(id);

    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    for (const key of Object.keys(user)) {
      if (!updateUserDto[key] && key !== 'id') {
        user[key] = '';
      }
    }

    user = Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async removeMultiple(ids: number[]) {
    await this.userRepository.delete({
      id: In(ids),
    });
    return { deleted: true };
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    return this.userRepository.remove(user);
  }
}
