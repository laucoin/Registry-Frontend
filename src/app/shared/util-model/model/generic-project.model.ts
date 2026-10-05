import { GenericModel } from './generic.model'
import { ProjectModel } from './project.model'

export interface GenericProjectModel extends GenericModel {
	project: ProjectModel
}
