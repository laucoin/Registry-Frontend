import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { ProjectModel } from '@shared/models/model/project.model';

/**
 * Objectif: Vérifications des options de projet.
 * Périmètre: Indique si un projet possède une option donnée.
 * Limites: Simple aide à l'usage ; le backend revérifie l'option.
 */
export const ProjectHelper = {
	hasOption(project: ProjectModel | undefined, option: ProjectOptionEnum | undefined): boolean {
		if (!project || !option) return true;
		return project?.options?.some((item) => item.value == option) ?? false;
	},
} as const;
