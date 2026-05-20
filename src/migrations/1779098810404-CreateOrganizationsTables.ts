import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrganizationsTables1779098810404 implements MigrationInterface {
    name = 'CreateOrganizationsTables1779098810404'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "avatarUrl" character varying, "ownerId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."organization_members_role_enum" AS ENUM('owner', 'admin', 'member', 'viewer')`);
        await queryRunner.query(`CREATE TABLE "organization_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."organization_members_role_enum" NOT NULL DEFAULT 'member', "userId" uuid NOT NULL, "organizationId" uuid NOT NULL, "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7c48546e8026fb043d9ad0c2c8c" UNIQUE ("userId", "organizationId"), CONSTRAINT "PK_c2b39d5d072886a4d9c8105eb9a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD CONSTRAINT "FK_cdf778d13ea7fe8095e013e34f0" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_members" ADD CONSTRAINT "FK_e826222ad017663c6db1a45a4f1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_members" ADD CONSTRAINT "FK_5652c2c6b066835b6c500d0d83f" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_members" DROP CONSTRAINT "FK_5652c2c6b066835b6c500d0d83f"`);
        await queryRunner.query(`ALTER TABLE "organization_members" DROP CONSTRAINT "FK_e826222ad017663c6db1a45a4f1"`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP CONSTRAINT "FK_cdf778d13ea7fe8095e013e34f0"`);
        await queryRunner.query(`DROP TABLE "organization_members"`);
        await queryRunner.query(`DROP TYPE "public"."organization_members_role_enum"`);
        await queryRunner.query(`DROP TABLE "organizations"`);
    }

}
