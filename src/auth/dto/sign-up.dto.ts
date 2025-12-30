import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class SignUpDto {
    @IsString()
    @Length(1, 255)
    firstName: string;

    @IsString()
    @Length(1, 255)
    lastName: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    @Length(8, 255)
    password: string;
}