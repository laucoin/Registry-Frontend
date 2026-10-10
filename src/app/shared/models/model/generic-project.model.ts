import { ProjectModel } from '@shared/models/model/project.model'
import { GenericModel } from '@shared/models/model/generic.model'

export interface GenericProjectModel extends GenericModel {
    project: ProjectModel
}

export interface OptionalProjectModel extends GenericModel {
    project: ProjectModel | undefined
}
