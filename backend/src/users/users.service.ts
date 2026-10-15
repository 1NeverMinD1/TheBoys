import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

/** То, что отдаём фронту о пользователе (без хеша пароля!) */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: User['role'];
  clubId: string | null;
}

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  findById(id: string) {
    return this.users.findOneBy({ id });
  }

  /** С хешем пароля — нужен только при входе */
  findByEmailWithPassword(email: string) {
    return this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash') // поле помечено select: false, достаём явно
      .where('u.email = :email', { email })
      .getOne();
  }

  existsByEmail(email: string) {
    return this.users.existsBy({ email });
  }

  create(data: Pick<User, 'email' | 'passwordHash' | 'name' | 'phone'>) {
    return this.users.save(this.users.create({ ...data, role: 'player' }));
  }

  toPublic(u: User): PublicUser {
    return { id: u.id, email: u.email, name: u.name, phone: u.phone, role: u.role, clubId: u.clubId };
  }
}
