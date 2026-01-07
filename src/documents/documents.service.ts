import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ProjectsService } from 'src/projects/projects.service';
import safeUserSelect from 'src/users/validators/safe-select.validator';
import { DeleteDocumentDto } from './dto/delete-document.dto';
import { PaginationHelper } from 'src/common/pagination/pagination.helper';
import { PaginatedResponse } from 'src/common/pagination/pagination.types';

@Injectable()
export class DocumentsService {
    constructor(private prismaService: PrismaService,
        private projectService: ProjectsService
    ) { }

    async createDocument(data: CreateDocumentDto) {
        // Make sure the project exists
        const project = await this.projectService.getProjectById(data.projectId, data.authorId);

        if (!project) {
            throw new UnauthorizedException('You are not a member of the project and hence cannot create a document');
        }

        const document = await this.prismaService.document.findFirst({ where: { title: data.title, projectId: data.projectId } });

        if (document) {
            throw new BadRequestException('Document with the same title already exists');
        }

        return this.prismaService.document.create({ data });
    }

    async getDocumentById(id: string, projectId: string, userId: string) {
        const document = await this.prismaService.document.findFirst({ where: { id, projectId, deletedAt: null, project: { projectMembers: { some: { userId } } } } });

        if (!document) {
            throw new BadRequestException('Document not found');
        }

        return document;
    }

    async getDocumentsByProjectId(
        projectId: string,
        userId: string,
        cursor?: string,
        limit: number = 20,
    ): Promise<PaginatedResponse<any>> {
        const project = await this.projectService.getProjectById(projectId, userId);

        if (!project) {
            throw new UnauthorizedException('You are not a member of the project and hence cannot access the document');
        }

        const normalizedLimit = PaginationHelper.normalizeLimit(limit);

        const where: any = {
            projectId,
            deletedAt: null,
            ...(cursor && {
                id: { lt: PaginationHelper.decodeCursor(cursor) },
            }),
        };

        const documents = await this.prismaService.document.findMany({
            where,
            include: {
                author: {
                    select: safeUserSelect
                }
            },
            orderBy: [
                { createdAt: 'desc' },
                { id: 'desc' },
            ],
            take: normalizedLimit + 1,
        });

        return PaginationHelper.buildPaginatedResponse(documents, normalizedLimit);
    }

    async updateDocument(id: string, data: UpdateDocumentDto) {
        const document = await this.getDocumentById(id, data.projectId, data.userId);
        if (!document) {
            throw new BadRequestException('Document not found');
        }

        // Make sure the user is a member of the project and has role of admin or owner
        const projectMember = await this.prismaService.projectMember.findFirst({ where: { projectId: document.projectId, userId: data.userId } });
        if (!projectMember) {
            throw new UnauthorizedException('You are not a member of the project and hence cannot update the document');
        }

        if (projectMember.role !== 'ADMIN' && projectMember.role !== 'EDITOR') {
            throw new UnauthorizedException('You are not authorized to update the document');
        }

        return this.prismaService.document.update({
            where: { id }, data: {
                title: data.title,
                content: data.content
            }
        });
    }

    async deleteDocument(id: string, data: DeleteDocumentDto) {
        const document = await this.getDocumentById(id, data.projectId, data.userId);
        if (!document) {
            throw new BadRequestException('Document not found');
        }

        // Make sure the user is a member of the project and has role of admin or owner
        const projectMember = await this.prismaService.projectMember.findFirst({ where: { projectId: document.projectId, userId: data.userId } });
        if (!projectMember) {
            throw new UnauthorizedException('You are not a member of the project and hence cannot delete the document');
        }

        if (projectMember.role !== 'ADMIN') {
            throw new UnauthorizedException('You are not authorized to delete the document');
        }

        return this.prismaService.document.update({ where: { id }, data: { deletedAt: new Date() } });
    }
}
