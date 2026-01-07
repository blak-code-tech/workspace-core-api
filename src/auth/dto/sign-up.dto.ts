import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class SignUpDto {
    @ApiProperty({
        description: 'User first name',
        example: 'John'
    })
    @IsString()
    @Length(1, 255)
    firstName: string;

    @ApiProperty({
        description: 'User last name',
        example: 'Doe'
    })
    @IsString()
    @Length(1, 255)
    lastName: string;

    @ApiProperty({
        description: 'User email',
        example: 'user@example.com'
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'User password',
        example: 'password'
    })
    @IsNotEmpty()
    @Length(8, 255)
    password: string;
}