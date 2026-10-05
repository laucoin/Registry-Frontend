import { SelectItem } from 'primeng/api'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { PageRequestInformationModel } from '../../../../shared/util-model/model/page-request-information.model'
import { ProjectModel } from '../../../../shared/util-model/model/project.model'
import { ProjectOptionModel } from './project-option.model'
import { ProjectPageParamsModel } from './project-page-params.model'

export interface ProjectStateModel {
	projects: PageRequestInformationModel<ProjectPageParamsModel, ProjectModel>
	project: ElementRequestInformationModel<ProjectModel>
	_metadata: {
		options: ProjectOptionModel[],
		visibilities: SelectItem<boolean | undefined>[],
	}
}
