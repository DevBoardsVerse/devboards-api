import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateActivityLogsTable1779271507258 implements MigrationInterface {
    name = 'CreateActivityLogsTable1779271507258'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."activity_logs_action_enum" AS ENUM('task_created', 'task_updated', 'task_assigned', 'task_deleted', 'task_status_changed', 'project_created', 'project_updated', 'project_deleted', 'member_invited', 'member_removed', 'member_role_changed')`);
        await queryRunner.query(`CREATE TABLE "activity_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" "public"."activity_logs_action_enum" NOT NULL, "entityType" character varying NOT NULL, "entityId" character varying NOT NULL, "metadata" jsonb, "organizationId" uuid NOT NULL, "actorId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f25287b6140c5ba18d38776a796" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f93ea0bd30f3211e2cad963cbe" ON "activity_logs" ("entityId", "entityType") `);
        await queryRunner.query(`CREATE INDEX "IDX_49f17f18bf2e9f7272ac36e597" ON "activity_logs" ("organizationId", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_97f652d54fa17db1d697aea9247" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_110bb0d32b7f65be46be37e2577" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_110bb0d32b7f65be46be37e2577"`);
        await queryRunner.query(`ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_97f652d54fa17db1d697aea9247"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_49f17f18bf2e9f7272ac36e597"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f93ea0bd30f3211e2cad963cbe"`);
        await queryRunner.query(`DROP TABLE "activity_logs"`);
        await queryRunner.query(`DROP TYPE "public"."activity_logs_action_enum"`);
    }

}
