import { ProjectModel } from '@shared/models/model/project.model'
import { SelectItem } from 'primeng/api'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'

/**
 * Purpose: Project option checks.
 * Scope: Tells whether a project has a given option.
 * Limits: A usability aid; the backend re-checks the option.
 */
export class ProjectHelper {
    public static hasOption (project: ProjectModel | undefined, option: ProjectOptionEnum | undefined): boolean {
        if (!project || !option) return true
        return project?.options?.some( (item: SelectItem<ProjectOptionEnum>): boolean => item.value == option ) ?? false
    }
}
