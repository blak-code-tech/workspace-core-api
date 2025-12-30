import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SignUpDto } from 'src/auth/dto/sign-up.dto';

@Injectable()
export class UsersService {
    constructor(private prismaService: PrismaService) { }

    async findOne(email: string) {
        return this.prismaService.user.findUnique({ where: { email: email } });
    }

    async create(user: SignUpDto) {
        // first check if account already exists
        const existingUser = await this.findOne(user.email);
        if (existingUser) {
            throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
        }
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return this.prismaService.user.create({ data: { ...user, password: hashedPassword } });
    }

    async update(user: User) {
        return this.prismaService.user.update({ where: { id: user.id }, data: user });
    }

    async delete(user: User) {
        return this.prismaService.user.delete({ where: { id: user.id } });
    }

    async updateUserPassword(user: User, password: string) {
        const hashedPassword = await bcrypt.hash(password, 10);
        return this.prismaService.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
    }
}
