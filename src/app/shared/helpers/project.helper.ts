import { ProjectModel } from '@shared/models/model/project.model'
import { SelectItem } from 'primeng/api'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'

export class ProjectHelper {
    public static hasOption (project: ProjectModel | undefined, option: ProjectOptionEnum | undefined): boolean {
        if (!project || !option) return true
        return project?.options?.some( (item: SelectItem<ProjectOptionEnum>): boolean => item.value == option ) ?? false
    }
}
