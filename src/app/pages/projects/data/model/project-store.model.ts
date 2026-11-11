import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model';
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { ProjectOptionModel } from '@shared/models/model/project-option.model';
import { ProjectPageParamsModel } from '@shared/models/model/project-page-params.model';
import { SectionErrorsState } from '@shared/models/model/section-errors-state.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

export interface ProjectStoreModel extends SectionErrorsState {
	projects: PageRequestInformationModel<ProjectPageParamsModel, ProjectModel>;
	project: ElementRequestInformationModel<ProjectModel>;
	createdProjectId: string | undefined;
	metadata: {
		options: ProjectOptionModel[];
		visibilities: SelectOptionModel<boolean | undefined>[];
		favorites: SelectOptionModel<boolean | undefined>[];
		withProfiles: SelectOptionModel<boolean | undefined>[];
	};
}
