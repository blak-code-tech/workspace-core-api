import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateProjectDto {
    @ApiProperty({ example: 'Project Name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'Team ID' })
    @IsString()
    @IsNotEmpty()
    teamId: string;

    @ApiProperty({ example: 'User ID' })
    @IsString()
    @IsNotEmpty()
    userId: string;
}