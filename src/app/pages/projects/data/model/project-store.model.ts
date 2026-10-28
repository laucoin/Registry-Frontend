import { SectionErrorsState } from '@shared/models/model/section-errors-state.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { ProjectPageParamsModel } from '@shared/models/model/project-page-params.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { ProjectOptionModel } from '@shared/models/model/project-option.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'

export interface ProjectStoreModel extends SectionErrorsState {
    projects: PageRequestInformationModel<ProjectPageParamsModel, ProjectModel>
    project: ElementRequestInformationModel<ProjectModel>
    createdProjectId: string | undefined
    metadata: {
        options: ProjectOptionModel[],
        visibilities: SelectOptionModel<boolean | undefined>[],
        favorites: SelectOptionModel<boolean | undefined>[],
        withProfiles: SelectOptionModel<boolean | undefined>[],
    }
}
