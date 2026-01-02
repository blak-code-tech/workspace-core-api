import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class DeleteProjectDto {
    @ApiProperty({ example: 'Project ID' })
    @IsUUID()
    @IsNotEmpty()
    projectId: string

    @ApiProperty({ example: 'Action Member ID' })
    @IsUUID()
    @IsNotEmpty()
    actionMemberId: string
}