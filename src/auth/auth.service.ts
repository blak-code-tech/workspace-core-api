import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignUpDto } from './dto/sign-up.dto';
import { jwtConstants } from './constants';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async signIn(email: string, password: string): Promise<{ access_token: string, refresh_token: string }> {
        const user = await this.usersService.findOne(email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // passwords are hashed using bcrypt so we need to hash the incoming password to match
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.getTokens(user);
    }

    async refreshToken(refresh_token: string): Promise<{ access_token: string, refresh_token: string }> {
        const decodedToken = await this.verifyToken(refresh_token);
        if (!decodedToken) {
            throw new UnauthorizedException('Invalid refresh token');
        }
        const user = await this.usersService.findOne(decodedToken.email);
        if (!user) {
            throw new UnauthorizedException('Refresh token is invalid');
        }

        return this.getTokens(user);
    }

    async signUp(signUpDto: SignUpDto): Promise<{ access_token: string, refresh_token: string }> {
        const user = await this.usersService.create(signUpDto);
        return this.getTokens(user);
    }

    async verifyToken(token: string): Promise<{ sub: string, role: string, email: string, firstName: string, lastName: string }> {
        return await this.jwtService.verifyAsync(token, {
            secret: jwtConstants.secret,
        });
    }

    async getTokens(user: User) {
        const access_token = await this.jwtService.signAsync({ sub: user.id, role: user.role, email: user.email, firstName: user.firstName, lastName: user.lastName }, { expiresIn: '1d' });
        const refresh_token = await this.jwtService.signAsync({ sub: user.id, role: user.role, email: user.email, firstName: user.firstName, lastName: user.lastName }, { expiresIn: '7d' });
        return { access_token, refresh_token };
    }
}
