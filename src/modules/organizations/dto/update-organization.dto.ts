import { PartialType } from '@nestjs/swagger';
import { CreateOrganizationDto } from './create-organization.dto';

// PartialType makes all fields from CreateOrganizationDto optional
// This is a NestJS utility — no need to rewrite all the validations
// UpdateOrganizationDto has the same fields but all optional
export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {}