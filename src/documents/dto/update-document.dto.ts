import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateDocumentDto {

    @ApiProperty({ example: 'Document Title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: 'Document Content' })
    @IsString()
    @IsNotEmpty()
    content: string;
}