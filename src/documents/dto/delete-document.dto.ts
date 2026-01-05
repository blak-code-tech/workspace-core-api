import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class DeleteDocumentDto {
    @ApiProperty({ example: 'projectId' })
    @IsUUID()
    @IsNotEmpty()
    projectId: string;

    @ApiProperty({ example: 'userId' })
    @IsUUID()
    @IsNotEmpty()
    userId: string;
}