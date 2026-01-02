import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateProjectDto {
    @ApiProperty({ example: 'Project Name' })
    @IsString()
    @IsNotEmpty()
    name?: string;

    @ApiProperty({ example: 'User ID' })
    @IsString()
    @IsNotEmpty()
    userId: string;
}