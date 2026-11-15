import { GenericMapper } from '@shared/mappers/generic.mapper';
import { ParticipantMapper } from '@shared/mappers/participant.mapper';
import { GroupResponseDto } from '@shared/models/dto/response/group.response.dto';
import { GroupModel } from '@shared/models/model/group.model';

/**
 * Objectif: Convertit une réponse Group du backend en modèle Group.
 * Périmètre: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limites: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const GroupMapper = {
	toModel(dto: GroupResponseDto): GroupModel {
		return {
			...GenericMapper.toModel(dto),
			name: dto.name,
			status: dto.status,
			startAvailability: dto.startAvailability,
			endAvailability: dto.endAvailability,
			membersCount: dto.membersCount,
			insideMembersCount: dto.insideMembersCount,
			outsideMembersCount: dto.outsideMembersCount,
			onSiteMembersCount: dto.onSiteMembersCount,
			inMembersCount: dto.inMembersCount,
			outMembersCount: dto.outMembersCount,
			overdueMembersCount: dto.overdueMembersCount,
			members: dto.members?.map(ParticipantMapper.toModel),
		};
	},
} as const;
