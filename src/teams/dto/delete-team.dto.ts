import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class DeleteTeamDto {
    @ApiProperty({ example: 'Team ID' })
    @IsUUID()
    @IsNotEmpty()
    teamId: string

    @ApiProperty({ example: 'Action Member ID' })
    @IsUUID()
    @IsNotEmpty()
    actionMemberId: string
}