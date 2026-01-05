import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class UpdateDocumentDto {
    @ApiProperty({ example: 'Document Title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: 'Document Content' })
    @IsString()
    @IsOptional()
    content: string;

    @ApiProperty({ example: 'projectId' })
    @IsString()
    @IsNotEmpty()
    projectId: string;

    @ApiProperty({ example: 'userId' })
    @IsUUID()
    @IsNotEmpty()
    userId: string;
}