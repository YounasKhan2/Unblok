-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('ADMIN', 'MEMBER', 'OBSERVER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "IssueState" AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IssuePriority" AS ENUM ('URGENT', 'HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(320),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" VARCHAR(200) NOT NULL,
    "subject" VARCHAR(512) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(63) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_memberships" (
    "workspace_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "WorkspaceRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "joined_at" TIMESTAMPTZ(3),

    CONSTRAINT "workspace_memberships_pkey" PRIMARY KEY ("workspace_id","id")
);

-- CreateTable
CREATE TABLE "teams" (
    "workspace_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "key" VARCHAR(6) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("workspace_id","id")
);

-- CreateTable
CREATE TABLE "team_memberships" (
    "workspace_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,

    CONSTRAINT "team_memberships_pkey" PRIMARY KEY ("workspace_id","team_id","membership_id")
);

-- CreateTable
CREATE TABLE "projects" (
    "workspace_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "key" VARCHAR(6) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "current_sequence" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("workspace_id","id")
);

-- CreateTable
CREATE TABLE "issues" (
    "workspace_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "state" "IssueState" NOT NULL DEFAULT 'BACKLOG',
    "priority" "IssuePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "creator_membership_id" UUID NOT NULL,
    "assignee_membership_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("workspace_id","id")
);

-- CreateTable
CREATE TABLE "dependency_edges" (
    "workspace_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "upstream_issue_id" UUID NOT NULL,
    "downstream_issue_id" UUID NOT NULL,
    "creator_membership_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dependency_edges_pkey" PRIMARY KEY ("workspace_id","id")
);

-- CreateIndex
CREATE INDEX "identities_user_id_idx" ON "identities"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "identities_provider_subject_key" ON "identities"("provider", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE INDEX "workspace_memberships_user_id_status_workspace_id_idx" ON "workspace_memberships"("user_id", "status", "workspace_id");

-- CreateIndex
CREATE INDEX "workspace_memberships_workspace_id_role_status_idx" ON "workspace_memberships"("workspace_id", "role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_memberships_workspace_id_user_id_key" ON "workspace_memberships"("workspace_id", "user_id");

-- CreateIndex
CREATE INDEX "teams_workspace_id_status_id_idx" ON "teams"("workspace_id", "status", "id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_workspace_id_key_key" ON "teams"("workspace_id", "key");

-- CreateIndex
CREATE INDEX "team_memberships_workspace_id_membership_id_team_id_idx" ON "team_memberships"("workspace_id", "membership_id", "team_id");

-- CreateIndex
CREATE INDEX "projects_workspace_id_team_id_status_id_idx" ON "projects"("workspace_id", "team_id", "status", "id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_workspace_id_key_key" ON "projects"("workspace_id", "key");

-- CreateIndex
CREATE INDEX "issues_workspace_id_project_id_status_created_at_id_idx" ON "issues"("workspace_id", "project_id", "status", "created_at", "id");

-- CreateIndex
CREATE INDEX "issues_workspace_id_assignee_membership_id_status_id_idx" ON "issues"("workspace_id", "assignee_membership_id", "status", "id");

-- CreateIndex
CREATE INDEX "issues_workspace_id_creator_membership_id_idx" ON "issues"("workspace_id", "creator_membership_id");

-- CreateIndex
CREATE UNIQUE INDEX "issues_workspace_id_project_id_sequence_key" ON "issues"("workspace_id", "project_id", "sequence");

-- CreateIndex
CREATE INDEX "dependency_edges_workspace_id_downstream_issue_id_idx" ON "dependency_edges"("workspace_id", "downstream_issue_id");

-- CreateIndex
CREATE INDEX "dependency_edges_workspace_id_creator_membership_id_idx" ON "dependency_edges"("workspace_id", "creator_membership_id");

-- CreateIndex
CREATE UNIQUE INDEX "dependency_edges_workspace_id_upstream_issue_id_downstream__key" ON "dependency_edges"("workspace_id", "upstream_issue_id", "downstream_issue_id");

-- AddForeignKey
ALTER TABLE "identities" ADD CONSTRAINT "identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_workspace_id_team_id_fkey" FOREIGN KEY ("workspace_id", "team_id") REFERENCES "teams"("workspace_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_workspace_id_membership_id_fkey" FOREIGN KEY ("workspace_id", "membership_id") REFERENCES "workspace_memberships"("workspace_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_team_id_fkey" FOREIGN KEY ("workspace_id", "team_id") REFERENCES "teams"("workspace_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_workspace_id_project_id_fkey" FOREIGN KEY ("workspace_id", "project_id") REFERENCES "projects"("workspace_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_workspace_id_creator_membership_id_fkey" FOREIGN KEY ("workspace_id", "creator_membership_id") REFERENCES "workspace_memberships"("workspace_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_workspace_id_assignee_membership_id_fkey" FOREIGN KEY ("workspace_id", "assignee_membership_id") REFERENCES "workspace_memberships"("workspace_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "dependency_edges" ADD CONSTRAINT "dependency_edges_workspace_id_upstream_issue_id_fkey" FOREIGN KEY ("workspace_id", "upstream_issue_id") REFERENCES "issues"("workspace_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "dependency_edges" ADD CONSTRAINT "dependency_edges_workspace_id_downstream_issue_id_fkey" FOREIGN KEY ("workspace_id", "downstream_issue_id") REFERENCES "issues"("workspace_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "dependency_edges" ADD CONSTRAINT "dependency_edges_workspace_id_creator_membership_id_fkey" FOREIGN KEY ("workspace_id", "creator_membership_id") REFERENCES "workspace_memberships"("workspace_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- Constraints Prisma cannot currently express. Inputs must be canonical before
-- persistence; no case-folded duplicate identifiers or silent key reuse.
ALTER TABLE "users" ADD CONSTRAINT "users_name_nonempty" CHECK (length(btrim(name)) >= 1);
ALTER TABLE "identities" ADD CONSTRAINT "identities_nonempty" CHECK (length(btrim(provider)) > 0 AND length(btrim(subject)) > 0);
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_slug_canonical" CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_name_nonempty" CHECK (length(btrim(name)) >= 2);
ALTER TABLE "teams" ADD CONSTRAINT "teams_key_canonical" CHECK (key ~ '^[A-Z0-9]{2,6}$');
ALTER TABLE "teams" ADD CONSTRAINT "teams_name_canonical" CHECK (name = btrim(name) AND length(name) >= 2);
CREATE UNIQUE INDEX "teams_workspace_name_ci" ON "teams" (workspace_id, lower(name));
ALTER TABLE "projects" ADD CONSTRAINT "projects_key_canonical" CHECK (key ~ '^[A-Z0-9]{2,6}$');
ALTER TABLE "projects" ADD CONSTRAINT "projects_name_nonempty" CHECK (length(btrim(name)) >= 2);
ALTER TABLE "projects" ADD CONSTRAINT "projects_sequence_nonnegative" CHECK (current_sequence >= 0);
ALTER TABLE "issues" ADD CONSTRAINT "issues_positive_sequence_version" CHECK (sequence > 0 AND version > 0);
ALTER TABLE "issues" ADD CONSTRAINT "issues_title_nonempty" CHECK (length(btrim(title)) > 0);
ALTER TABLE "dependency_edges" ADD CONSTRAINT "dependency_edges_no_self" CHECK (upstream_issue_id <> downstream_issue_id);

-- Serialize tenant mutations with lifecycle/revocation changes. This is an
-- integrity lock, not RLS or an authorization substitute. No client-set flags.
CREATE FUNCTION guard_tenant_write() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE tenant_status "RecordStatus";
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.workspace_id <> OLD.workspace_id OR
       (to_jsonb(NEW)->'id' IS DISTINCT FROM to_jsonb(OLD)->'id') THEN
      RAISE EXCEPTION 'Tenant identity is immutable' USING ERRCODE = '23514';
    END IF;
  END IF;
  SELECT status INTO tenant_status FROM workspaces
    WHERE id = COALESCE((to_jsonb(NEW)->>'workspace_id')::uuid, (to_jsonb(OLD)->>'workspace_id')::uuid)
    FOR UPDATE;
  IF tenant_status IS DISTINCT FROM 'ACTIVE'::"RecordStatus" THEN
    RAISE EXCEPTION 'Workspace unavailable for mutation' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER "a_tenant_write" BEFORE INSERT OR UPDATE OR DELETE ON "workspace_memberships" FOR EACH ROW EXECUTE FUNCTION guard_tenant_write();
CREATE TRIGGER "a_tenant_write" BEFORE INSERT OR UPDATE OR DELETE ON "teams" FOR EACH ROW EXECUTE FUNCTION guard_tenant_write();
CREATE TRIGGER "a_tenant_write" BEFORE INSERT OR UPDATE OR DELETE ON "team_memberships" FOR EACH ROW EXECUTE FUNCTION guard_tenant_write();
CREATE TRIGGER "a_tenant_write" BEFORE INSERT OR UPDATE OR DELETE ON "projects" FOR EACH ROW EXECUTE FUNCTION guard_tenant_write();
CREATE TRIGGER "a_tenant_write" BEFORE INSERT OR UPDATE OR DELETE ON "issues" FOR EACH ROW EXECUTE FUNCTION guard_tenant_write();

CREATE FUNCTION protect_last_admin() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.role = 'ADMIN' AND OLD.status = 'ACTIVE' AND
     (TG_OP = 'DELETE' OR NEW.role <> 'ADMIN' OR NEW.status <> 'ACTIVE') AND
     NOT EXISTS (SELECT 1 FROM workspace_memberships WHERE workspace_id = OLD.workspace_id
       AND id <> OLD.id AND role = 'ADMIN' AND status = 'ACTIVE') THEN
    RAISE EXCEPTION 'Final active administrator must be retained' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "b_last_admin" BEFORE UPDATE OR DELETE ON "workspace_memberships" FOR EACH ROW EXECUTE FUNCTION protect_last_admin();

CREATE FUNCTION guard_team_project_lifecycle() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE owner_status "RecordStatus";
BEGIN
  IF TG_TABLE_NAME = 'teams' THEN
    IF OLD.status = 'ACTIVE' AND NEW.status = 'ARCHIVED' AND EXISTS (
      SELECT 1 FROM projects WHERE workspace_id = NEW.workspace_id AND team_id = NEW.id AND status = 'ACTIVE'
    ) THEN
      RAISE EXCEPTION 'Team owns active projects' USING ERRCODE = '23514';
    END IF;
  ELSE
    SELECT status INTO owner_status FROM teams WHERE workspace_id = NEW.workspace_id AND id = NEW.team_id;
    IF NEW.status = 'ACTIVE' AND owner_status IS DISTINCT FROM 'ACTIVE'::"RecordStatus" THEN
      RAISE EXCEPTION 'Active project requires active owning team' USING ERRCODE = '23514';
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.key <> OLD.key THEN
      RAISE EXCEPTION 'Project key is immutable' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "b_team_archive" BEFORE UPDATE ON "teams" FOR EACH ROW EXECUTE FUNCTION guard_team_project_lifecycle();
CREATE TRIGGER "b_project_owner" BEFORE INSERT OR UPDATE ON "projects" FOR EACH ROW EXECUTE FUNCTION guard_team_project_lifecycle();

CREATE FUNCTION guard_issue_write() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE project_status "RecordStatus";
BEGIN
  SELECT p.status INTO project_status FROM projects p JOIN teams t
    ON t.workspace_id = p.workspace_id AND t.id = p.team_id
    WHERE p.workspace_id = NEW.workspace_id AND p.id = NEW.project_id AND t.status = 'ACTIVE';
  IF project_status IS DISTINCT FROM 'ACTIVE'::"RecordStatus" THEN
    RAISE EXCEPTION 'Issue requires active owning project and team' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' AND (NEW.project_id <> OLD.project_id OR NEW.sequence <> OLD.sequence OR NEW.creator_membership_id <> OLD.creator_membership_id) THEN
    RAISE EXCEPTION 'Issue origin is immutable' USING ERRCODE = '23514';
  END IF;
  IF NEW.assignee_membership_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM workspace_memberships WHERE workspace_id = NEW.workspace_id
      AND id = NEW.assignee_membership_id AND status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'Assignee requires active workspace membership' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'INSERT' AND NOT EXISTS (
    SELECT 1 FROM workspace_memberships WHERE workspace_id = NEW.workspace_id
      AND id = NEW.creator_membership_id AND status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'Creator requires active workspace membership' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "b_issue_integrity" BEFORE INSERT OR UPDATE ON "issues" FOR EACH ROW EXECUTE FUNCTION guard_issue_write();

-- No cycle-unsafe dependency persistence, even by an accidental raw ORM write.
-- Replace only in the reviewed dependency phase. Superusers can disable triggers;
-- production runtime credentials must never hold DDL/trigger privileges.
CREATE FUNCTION deny_dependency_write() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Dependency mutation service not enabled' USING ERRCODE = '55000';
END $$;
CREATE TRIGGER "dependency_write_gate" BEFORE INSERT OR UPDATE OR DELETE ON "dependency_edges" FOR EACH ROW EXECUTE FUNCTION deny_dependency_write();
