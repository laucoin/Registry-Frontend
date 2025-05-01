import { ProjectModel } from './project.model'
import { GenericModel } from './generic.model'

export interface GenericProjectModel extends GenericModel {
    project: ProjectModel
}
