import { ProjectModel } from '../../util-model/model/project.model'
import { SelectItem } from 'primeng/api'
import { ProjectOptionEnum } from '../../util-model/enumeration/project-option.enum'

export class ProjectUtil {
    public static hasOption (project: ProjectModel | undefined, option: ProjectOptionEnum | undefined): boolean {
        if (!project || !option) return true
        return project?.options?.some( (item: SelectItem<ProjectOptionEnum>): boolean => item.value == option )
    }
}
