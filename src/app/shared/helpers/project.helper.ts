import { ProjectModel } from '@shared/models/model/project.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'

/**
 * Purpose: Vérifications des options de projet.
 * Scope: Indique si un projet possède une option donnée.
 * Limits: Simple aide à l'usage ; le backend revérifie l'option.
 */
export class ProjectHelper {
    public static hasOption (project: ProjectModel | undefined, option: ProjectOptionEnum | undefined): boolean {
        if (!project || !option) return true
        return project?.options?.some( (item: SelectOptionModel<ProjectOptionEnum>): boolean => item.value == option ) ?? false
    }
}
