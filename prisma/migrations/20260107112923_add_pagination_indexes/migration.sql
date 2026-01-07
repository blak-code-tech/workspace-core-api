-- CreateIndex
CREATE INDEX "AuditLog_createdAt_id_idx" ON "AuditLog"("createdAt", "id");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_id_idx" ON "AuditLog"("userId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Document_projectId_deletedAt_createdAt_id_idx" ON "Document"("projectId", "deletedAt", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Project_teamId_createdAt_id_idx" ON "Project"("teamId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Project_teamId_deletedAt_createdAt_id_idx" ON "Project"("teamId", "deletedAt", "createdAt", "id");

-- CreateIndex
CREATE INDEX "ProjectMember_projectId_createdAt_id_idx" ON "ProjectMember"("projectId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Team_deletedAt_createdAt_id_idx" ON "Team"("deletedAt", "createdAt", "id");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_createdAt_id_idx" ON "TeamMember"("teamId", "createdAt", "id");
