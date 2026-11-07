import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { ProjectModel } from '@shared/models/model/project.model';

/**
 * Purpose: Vérifications des options de projet.
 * Scope: Indique si un projet possède une option donnée.
 * Limits: Simple aide à l'usage ; le backend revérifie l'option.
 */
export const ProjectHelper = {
	hasOption(project: ProjectModel | undefined, option: ProjectOptionEnum | undefined): boolean {
		if (!project || !option) return true;
		return project?.options?.some((item) => item.value == option) ?? false;
	},
} as const;
