import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signup(email: string, pass: string): Promise<any> {
    const users = await this.usersService.find(email);
    if (users.length) {
      throw new BadRequestException('email is in use');
    }
    // Has the users password
    const salt = randomBytes(8).toString('hex');
    const buf = (await scrypt(pass, salt, 64)) as Buffer;
    const hash = salt + '.' + buf.toString('hex');
    const user = await this.usersService.create(email, hash);
    return user;
  }

  async signin(email: string, pass: string) {
    const [users] = await this.usersService.find(email);
    if (!users) {
      throw new NotFoundException('email not found');
    }
    const [salt, hash] = users.password.split('.');
    const actual = (await scrypt(pass, salt, 64)) as Buffer;
    if (actual.toString('hex') !== hash) {
      throw new BadRequestException('invalid password');
    }
    return users;
  }
}
