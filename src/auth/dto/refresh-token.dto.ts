import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenDto {
    @ApiProperty({ example: 'refresh_token' })
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}