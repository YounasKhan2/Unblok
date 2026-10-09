CREATE TABLE "backend_foundation" (
    "id" INTEGER NOT NULL,
    "installed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "backend_foundation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "backend_foundation_singleton" CHECK ("id" = 1)
);
INSERT INTO "backend_foundation" ("id") VALUES (1);
