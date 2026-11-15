import { WritableSignal } from '@angular/core';
import { FieldTree, form, SchemaPathTree } from '@angular/forms/signals';

import { GroupDto } from '@pages/projects/[projectId]/configuration/groups/data/dto/group.dto';
import { FormModelHelper } from '@shared/helpers/form/form-model.helper';
import { ProjectDateContext, RegistrySchemas } from '@shared/helpers/form/registry.schemas';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { GroupModel } from '@shared/models/model/group.model';

export interface GroupFormModel {
	name: string;
	beginDateTime: CustomDatetimeModel | null;
	endDateTime: CustomDatetimeModel | null;
}

export function toGroupFormModel(group?: GroupModel): GroupFormModel {
	return {
		name: FormModelHelper.orEmpty(group?.name),
		beginDateTime: FormModelHelper.orNull(group?.startAvailability),
		endDateTime: FormModelHelper.orNull(group?.endAvailability),
	};
}

export function toGroupDto(model: GroupFormModel): GroupDto {
	return {
		name: model.name,
		startAvailability: model.beginDateTime ?? undefined,
		endAvailability: model.endDateTime ?? undefined,
	};
}

export function createGroupForm(
	model: WritableSignal<GroupFormModel>,
	context: ProjectDateContext,
): FieldTree<GroupFormModel> {
	return form(model, (path: SchemaPathTree<GroupFormModel>) => {
		RegistrySchemas.requiredText(path.name, 150);
		RegistrySchemas.projectDateTime(path.beginDateTime, context);
		RegistrySchemas.projectDateTime(path.endDateTime, context);
		RegistrySchemas.beginDateBeforeEndDate(path.beginDateTime, path.endDateTime);
	});
}
