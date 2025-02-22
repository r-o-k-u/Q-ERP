import { IQuery } from '@nestjs/cqrs';
import { FindOptionsWhere } from 'typeorm';
import { OrganizationTeam } from '../../../core/entities/internal';

export class FindPublicTeamQuery implements IQuery {

	constructor(
		public readonly params: FindOptionsWhere<OrganizationTeam>,
		public readonly relations: string[]
	) { }
}
