import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
    constructor(private prismaService: PrismaService) { }

    async createDocument(data: CreateDocumentDto) {

        return this.prismaService.document.create({ data });
    }

    async getDocumentById(id: string) {
        return this.prismaService.document.findUnique({ where: { id } });
    }

    async getDocumentsByProjectId(projectId: string) {
        return this.prismaService.document.findMany({ where: { projectId } });
    }

    async updateDocument(id: string, data: UpdateDocumentDto) {
        return this.prismaService.document.update({ where: { id }, data });
    }

    async deleteDocument(id: string) {
        return this.prismaService.document.delete({ where: { id } });
    }
}
