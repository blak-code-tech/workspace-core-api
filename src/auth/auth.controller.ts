import {
    Controller,
    Post,
    HttpCode,
    HttpStatus,
    Body,
    Get,
    Request,
    Ip,
} from '@nestjs/common';
import { SignInDto } from './dto/sign-in.dto';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { SignUpDto } from './dto/sign-up.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('sign-in')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Sign in with email and password' })
    async signIn(
        @Body() signInDto: SignInDto,
        @Request() req,
        @Ip() ip: string,
    ) {
        const userAgent = req.headers['user-agent'];
        return this.authService.signIn(
            signInDto.email,
            signInDto.password,
            userAgent,
            ip,
        );
    }

    @Public()
    @Post('sign-up')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new user account' })
    async signUp(
        @Body() signUpDto: SignUpDto,
        @Request() req,
        @Ip() ip: string,
    ) {
        const userAgent = req.headers['user-agent'];
        return this.authService.signUp(signUpDto, userAgent, ip);
    }

    @Public()
    @Post('refresh-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token using refresh token' })
    async refreshToken(
        @Body() refreshTokenDto: RefreshTokenDto,
        @Request() req,
        @Ip() ip: string,
    ) {
        const userAgent = req.headers['user-agent'];
        return this.authService.refreshToken(
            refreshTokenDto.refreshToken,
            userAgent,
            ip,
        );
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout from current device' })
    async logout(@Body() logoutDto: LogoutDto) {
        return this.authService.logout(logoutDto.refreshToken);
    }

    @Post('logout-all')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout from all devices' })
    async logoutAll(@Request() req) {
        const userId = req.user.sub;
        return this.authService.logoutAll(userId);
    }

    @Get('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    getProfile(@Request() req) {
        return req.user;
    }
}
