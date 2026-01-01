import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class DeleteTeamMemberDto {
    @ApiProperty({ example: 'Team Member ID' })
    @IsUUID()
    @IsNotEmpty()
    teamMemberId: string

    @ApiProperty({ example: 'Action Member ID' })
    @IsUUID()
    @IsNotEmpty()
    actionMemberId: string
}