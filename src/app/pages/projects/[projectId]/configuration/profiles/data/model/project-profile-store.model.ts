import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum';
import { FeaturesModel } from '@shared/models/model/features.model';
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model';
import { ProjectProfileModel } from '@shared/models/model/project-profile.model';
import { ProjectProfilePageParamsModel } from '@shared/models/model/project-profile-page-params.model';
import { SectionErrorsState } from '@shared/models/model/section-errors-state.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';
import { UserModel } from '@shared/models/model/user.model';

export interface ProjectProfileStoreModel extends SectionErrorsState {
	projectProfiles: PageRequestInformationModel<ProjectProfilePageParamsModel, ProjectProfileModel>;
	metadata: {
		roles: SelectOptionModel<string>[] | undefined;
		status: SelectOptionModel<ProfileStatusEnum | undefined>[];
		searched: UserModel[];
		availabilities: SelectOptionModel<boolean | undefined>[];
		visibilities: SelectOptionModel<boolean | undefined>[];
		features: FeaturesModel;
	};
}
