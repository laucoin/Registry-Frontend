import { CurrentProjectProfileMapper } from '@shared/mappers/current-project-profile.mapper';
import { GenericMapper } from '@shared/mappers/generic.mapper';
import { ProjectResponseDto } from '@shared/models/dto/response/project.response.dto';
import { ProjectModel } from '@shared/models/model/project.model';

/**
 * Objectif: Convertit une réponse Project du backend en modèle Project.
 * Périmètre: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limites: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const ProjectMapper = {
	toModel(dto: ProjectResponseDto): ProjectModel {
		return {
			...GenericMapper.toModel(dto),
			name: dto.name,
			status: dto.status,
			begin: dto.begin,
			end: dto.end,
			options: dto.options,
			counts: dto.counts ? { ...dto.counts } : undefined,
			favorite: dto.favorite,
			profile: dto.profile ? CurrentProjectProfileMapper.toModel(dto.profile) : undefined,
		};
	},
} as const;
