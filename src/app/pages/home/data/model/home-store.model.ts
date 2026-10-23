import { ProjectPageParamsModel } from '@shared/models/model/project-page-params.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { ProjectModel } from '@shared/models/model/project.model'

export interface HomeStoreModel {
	favorites: PageRequestInformationModel<ProjectPageParamsModel, ProjectModel>
	attention: PageRequestInformationModel<ProjectPageParamsModel, ProjectModel>
}
