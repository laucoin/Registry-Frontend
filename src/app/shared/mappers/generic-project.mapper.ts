import { GenericMapper } from '@shared/mappers/generic.mapper';
import { GenericProjectResponseDto } from '@shared/models/dto/response/generic-project.response.dto';
import { GenericProjectModel } from '@shared/models/model/generic-project.model';

/**
 * Objectif: Convertit une réponse GenericProject du backend en modèle GenericProject.
 * Périmètre: Copie chaque champ et conserve l'id du projet auquel l'élément appartient.
 * Limites: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const GenericProjectMapper = {
	toModel(dto: GenericProjectResponseDto): GenericProjectModel {
		return {
			...GenericMapper.toModel(dto),
			projectId: dto.projectId,
		};
	},
} as const;
