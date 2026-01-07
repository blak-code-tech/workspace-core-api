import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignUpDto } from './dto/sign-up.dto';
import { jwtConstants } from './constants';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) { }

    async signIn(
        email: string,
        password: string,
        userAgent?: string,
        ipAddress?: string,
    ): Promise<{ access_token: string; refresh_token: string }> {
        const user = await this.usersService.findOne(email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // passwords are hashed using bcrypt so we need to hash the incoming password to match
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.getTokens(user, userAgent, ipAddress);
    }

    async refreshToken(
        refresh_token: string,
        userAgent?: string,
        ipAddress?: string,
    ): Promise<{ access_token: string; refresh_token: string }> {
        // Verify token signature
        const decodedToken = await this.verifyToken(refresh_token);
        if (!decodedToken) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Hash the token to look it up in database
        const hashedToken = await this.hashToken(refresh_token);

        // Check if token exists and is not revoked
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: hashedToken },
        });

        if (!storedToken) {
            throw new UnauthorizedException('Refresh token not found');
        }

        if (storedToken.revokedAt) {
            throw new UnauthorizedException('Refresh token has been revoked');
        }

        if (new Date() > storedToken.expiresAt) {
            throw new UnauthorizedException('Refresh token has expired');
        }

        // Get user
        const user = await this.usersService.findOne(decodedToken.email);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // Revoke old refresh token (token rotation)
        await this.prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revokedAt: new Date() },
        });

        // Issue new tokens
        return this.getTokens(user, userAgent, ipAddress);
    }

    async signUp(
        signUpDto: SignUpDto,
        userAgent?: string,
        ipAddress?: string,
    ): Promise<{ access_token: string; refresh_token: string }> {
        const user = await this.usersService.create(signUpDto);
        return this.getTokens(user, userAgent, ipAddress);
    }

    async logout(refreshToken: string): Promise<{ message: string }> {
        // Hash the token to look it up
        const hashedToken = await this.hashToken(refreshToken);

        // Find and revoke the token
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: hashedToken },
        });

        if (!storedToken) {
            throw new UnauthorizedException('Refresh token not found');
        }

        if (storedToken.revokedAt) {
            return { message: 'Already logged out' };
        }

        // Revoke the token
        await this.prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revokedAt: new Date() },
        });

        return { message: 'Logged out successfully' };
    }

    async logoutAll(userId: string): Promise<{ message: string; count: number }> {
        // Revoke all active refresh tokens for the user
        const result = await this.prisma.refreshToken.updateMany({
            where: {
                userId,
                revokedAt: null, // Only revoke active tokens
            },
            data: {
                revokedAt: new Date(),
            },
        });

        return {
            message: 'Logged out from all devices',
            count: result.count,
        };
    }

    async verifyToken(token: string): Promise<{
        sub: string;
        role: string;
        email: string;
        firstName: string;
        lastName: string;
    }> {
        return await this.jwtService.verifyAsync(token, {
            secret: jwtConstants.secret,
        });
    }

    private async getTokens(
        user: User,
        userAgent?: string,
        ipAddress?: string,
    ): Promise<{ access_token: string; refresh_token: string }> {
        const access_token = await this.jwtService.signAsync(
            {
                sub: user.id,
                role: user.role,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
            { expiresIn: '15m' },
        );

        const refresh_token = await this.jwtService.signAsync(
            {
                sub: user.id,
                role: user.role,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
            { expiresIn: '7d' },
        );

        // Store refresh token in database
        await this.storeRefreshToken(
            user.id,
            refresh_token,
            userAgent,
            ipAddress,
        );

        return { access_token, refresh_token };
    }

    private async storeRefreshToken(
        userId: string,
        token: string,
        userAgent?: string,
        ipAddress?: string,
    ): Promise<void> {
        // Hash the token before storing
        const hashedToken = await this.hashToken(token);

        // Calculate expiration (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await this.prisma.refreshToken.create({
            data: {
                userId,
                token: hashedToken,
                expiresAt,
                userAgent,
                ipAddress,
            },
        });
    }

    private async hashToken(token: string): Promise<string> {
        return bcrypt.hash(token, 10);
    }
}
