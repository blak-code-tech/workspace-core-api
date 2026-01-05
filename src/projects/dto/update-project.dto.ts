import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateProjectDto {
    @ApiProperty({ example: 'Project Name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'Project Description' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 'User ID' })
    @IsString()
    @IsNotEmpty()
    userId: string;
}