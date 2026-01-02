import { ApiProperty } from "@nestjs/swagger";
import { ProjectRole } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsUUID } from "class-validator";

export class UpdateProjectMemberRoleDto {
    @ApiProperty({ example: 'Project Member ID' })
    @IsUUID()
    @IsNotEmpty()
    projectMemberId: string

    @ApiProperty({ example: 'Role', enum: ProjectRole })
    @IsEnum(ProjectRole)
    @IsNotEmpty()
    role: ProjectRole

    @ApiProperty({ example: 'Action Member ID' })
    @IsUUID()
    @IsNotEmpty()
    actionMemberId: string
}