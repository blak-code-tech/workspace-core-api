import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateTeamDto {
    @ApiProperty({ example: 'Team Name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'Team Description' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ example: 'Action Member ID' })
    @IsString()
    @IsNotEmpty()
    actionMemberId: string;
}