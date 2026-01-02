import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class DeleteProjectMemberDto {
    @ApiProperty({ example: 'Project Member ID' })
    @IsUUID()
    @IsNotEmpty()
    projectMemberId: string

    @ApiProperty({ example: 'Action Member ID' })
    @IsUUID()
    @IsNotEmpty()
    actionMemberId: string
}