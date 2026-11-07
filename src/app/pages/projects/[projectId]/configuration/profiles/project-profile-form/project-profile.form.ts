import { WritableSignal } from '@angular/core';
import { FieldTree, form, required, SchemaPathTree } from '@angular/forms/signals';

import { ProjectProfileDto } from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profile.dto';
import { ProjectProfilesDto } from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profiles.dto';
import { FormModelHelper } from '@shared/helpers/form/form-model.helper';
import { RegistrySchemas } from '@shared/helpers/form/registry.schemas';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { InvitedUserModel } from '@shared/models/model/invited-user.model';
import { ProjectProfileModel } from '@shared/models/model/project-profile.model';

export interface ProjectProfileFormModel {
	role: string;
	beginDateTime: CustomDatetimeModel | null;
	endDateTime: CustomDatetimeModel | null;
}

export interface ProjectProfileInvitationFormModel extends ProjectProfileFormModel {
	users: InvitedUserModel[];
}

export function toProjectProfileFormModel(profile?: ProjectProfileModel): ProjectProfileFormModel {
	return {
		role: FormModelHelper.orEmpty(profile?.role.value),
		beginDateTime: FormModelHelper.orNull(profile?.startAccess),
		endDateTime: FormModelHelper.orNull(profile?.endAccess),
	};
}

export function toProjectProfileInvitationFormModel(): ProjectProfileInvitationFormModel {
	return { ...toProjectProfileFormModel(), users: [] };
}

export function toProjectProfileDto(model: ProjectProfileFormModel): ProjectProfileDto {
	return {
		role: model.role,
		startAccess: model.beginDateTime ?? undefined,
		endAccess: model.endDateTime ?? undefined,
	};
}

export function toProjectProfilesDto(model: ProjectProfileInvitationFormModel): ProjectProfilesDto {
	return {
		...toProjectProfileDto(model),
		emails: model.users.map((user) => user.email),
	};
}

function profileRules(path: SchemaPathTree<ProjectProfileFormModel>): void {
	required(path.role);
	RegistrySchemas.dateRequiredForTime(path.beginDateTime);
	RegistrySchemas.dateRequiredForTime(path.endDateTime);
	RegistrySchemas.beginDateBeforeEndDate(path.beginDateTime, path.endDateTime);
}

export function createProjectProfileForm(
	model: WritableSignal<ProjectProfileFormModel>,
): FieldTree<ProjectProfileFormModel> {
	return form(model, profileRules);
}

export function createProjectProfileInvitationForm(
	model: WritableSignal<ProjectProfileInvitationFormModel>,
): FieldTree<ProjectProfileInvitationFormModel> {
	return form(model, (path: SchemaPathTree<ProjectProfileInvitationFormModel>) => {
		profileRules(path);
		RegistrySchemas.requiredList(path.users);
	});
}
