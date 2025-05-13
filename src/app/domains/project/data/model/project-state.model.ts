import { ProjectModel } from '../../../../shared/util-model/model/project.model'
import { ProjectPageParamsModel } from './project-page-params.model'
import { PageRequestInformationModel } from '../../../../shared/util-model/model/page-request-information.model'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { ProjectOptionModel } from './project-option.model'
import { SelectItem } from 'primeng/api'

export interface ProjectStateModel {
    projects: PageRequestInformationModel<ProjectPageParamsModel, ProjectModel>
    project: ElementRequestInformationModel<ProjectModel>
    _metadata: {
        options: ProjectOptionModel[],
        visibilities: SelectItem<boolean | undefined>[],
    }
}
