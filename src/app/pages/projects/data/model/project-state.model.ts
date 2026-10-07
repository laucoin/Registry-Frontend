import { ProjectModel } from '@shared/models/model/project.model'
import { ProjectPageParamsModel } from '@pages/projects/data/model/project-page-params.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { ProjectOptionModel } from '@pages/projects/data/model/project-option.model'
import { SelectItem } from 'primeng/api'

export interface ProjectStateModel {
    projects: PageRequestInformationModel<ProjectPageParamsModel, ProjectModel>
    project: ElementRequestInformationModel<ProjectModel>
    createdProjectId: string | undefined
    _metadata: {
        options: ProjectOptionModel[],
        visibilities: SelectItem<boolean | undefined>[],
    }
}
