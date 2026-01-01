import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class SignUpDto {
    @ApiProperty({ example: 'John' })
    @IsString()
    @Length(1, 255)
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    @Length(1, 255)
    lastName: string;

    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password' })
    @IsNotEmpty()
    @Length(8, 255)
    password: string;
}