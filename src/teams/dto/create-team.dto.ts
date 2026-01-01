import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID, MinLength } from "class-validator";

export class CreateTeamDto {
    @ApiProperty({ example: 'Team Name' })
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    name: string;

    @ApiProperty({ example: 'User ID' })
    @IsUUID()
    @IsNotEmpty()
    ownerId: string;
}