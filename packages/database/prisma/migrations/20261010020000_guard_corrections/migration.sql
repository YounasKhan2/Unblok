-- Forward-only repair: preserve both previously applied migration checksums.
BEGIN;

CREATE OR REPLACE FUNCTION guard_tenant_write() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE tenant_status "RecordStatus";
        tenant_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    tenant_id := OLD.workspace_id;
  ELSE
    tenant_id := NEW.workspace_id;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.workspace_id <> OLD.workspace_id OR
       (to_jsonb(NEW)->'id' IS DISTINCT FROM to_jsonb(OLD)->'id') THEN
      RAISE EXCEPTION 'Tenant identity is immutable' USING ERRCODE = '23514';
    END IF;
  END IF;
  SELECT status INTO tenant_status FROM workspaces
    WHERE id = tenant_id
    FOR UPDATE;
  IF tenant_status IS DISTINCT FROM 'ACTIVE'::"RecordStatus" THEN
    RAISE EXCEPTION 'Workspace unavailable for mutation' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;


CREATE OR REPLACE FUNCTION guard_issue_write() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE project_status "RecordStatus";
        validate_assignee boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    validate_assignee := true;
  ELSE
    validate_assignee := NEW.assignee_membership_id IS DISTINCT FROM OLD.assignee_membership_id;
  END IF;
  SELECT p.status INTO project_status FROM projects p JOIN teams t
    ON t.workspace_id = p.workspace_id AND t.id = p.team_id
    WHERE p.workspace_id = NEW.workspace_id AND p.id = NEW.project_id AND t.status = 'ACTIVE';
  IF project_status IS DISTINCT FROM 'ACTIVE'::"RecordStatus" THEN
    RAISE EXCEPTION 'Issue requires active owning project and team' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' AND (NEW.project_id <> OLD.project_id OR NEW.sequence <> OLD.sequence OR NEW.creator_membership_id <> OLD.creator_membership_id) THEN
    RAISE EXCEPTION 'Issue origin is immutable' USING ERRCODE = '23514';
  END IF;
  IF validate_assignee AND NEW.assignee_membership_id IS NOT NULL AND NOT EXISTS (
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

COMMIT;
