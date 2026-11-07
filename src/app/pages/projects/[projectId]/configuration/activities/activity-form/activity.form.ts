import { WritableSignal } from '@angular/core';
import { FieldTree, form, maxLength, SchemaPathTree } from '@angular/forms/signals';

import { ActivityDto } from '@pages/projects/[projectId]/configuration/activities/data/dto/activity.dto';
import { FormModelHelper } from '@shared/helpers/form/form-model.helper';
import { ProjectDateContext, RegistrySchemas } from '@shared/helpers/form/registry.schemas';
import { ActivityModel } from '@shared/models/model/activity.model';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { NumericRangeModel } from '@shared/models/model/numeric-range.model';

const MAX_ALLOWED_PARTICIPANTS = 2147483647;

export interface ActivityFormModel {
	name: string;
	description: string;
	duration: string;
	allowedParticipants: NumericRangeModel | null;
	beginDateTime: CustomDatetimeModel | null;
	endDateTime: CustomDatetimeModel | null;
}

export function toActivityFormModel(activity?: ActivityModel): ActivityFormModel {
	return activity ? fromActivity(activity) : emptyActivity();
}

function emptyActivity(): ActivityFormModel {
	return {
		name: '',
		description: '',
		duration: '',
		allowedParticipants: null,
		beginDateTime: null,
		endDateTime: null,
	};
}

function fromActivity(activity: ActivityModel): ActivityFormModel {
	return {
		name: FormModelHelper.orEmpty(activity.name),
		description: FormModelHelper.orEmpty(activity.description),
		duration: FormModelHelper.orEmpty(activity.duration?.value),
		allowedParticipants: FormModelHelper.orNull(activity.allowedParticipants),
		beginDateTime: FormModelHelper.orNull(activity.startAvailability),
		endDateTime: FormModelHelper.orNull(activity.endAvailability),
	};
}

export function toActivityDto(model: ActivityFormModel): ActivityDto {
	return {
		name: model.name,
		description: model.description || undefined,
		duration: model.duration || undefined,
		allowedParticipants: model.allowedParticipants ?? undefined,
		startAvailability: model.beginDateTime ?? undefined,
		endAvailability: model.endDateTime ?? undefined,
	};
}

function allowedParticipantsRules(path: SchemaPathTree<NumericRangeModel | null>): void {
	RegistrySchemas.numericRange(path);
	RegistrySchemas.numericRangeMin(path, 1);
	RegistrySchemas.numericRangeMax(path, MAX_ALLOWED_PARTICIPANTS);
	RegistrySchemas.numericRangeBothDefined(path);
}

export function createActivityForm(
	model: WritableSignal<ActivityFormModel>,
	context: ProjectDateContext,
): FieldTree<ActivityFormModel> {
	return form(model, (path: SchemaPathTree<ActivityFormModel>) => {
		RegistrySchemas.requiredText(path.name, 150);
		maxLength(path.description, 2000);
		RegistrySchemas.nonBlankIfFilled(path.description);
		allowedParticipantsRules(path.allowedParticipants);
		RegistrySchemas.projectDateTime(path.beginDateTime, context);
		RegistrySchemas.projectDateTime(path.endDateTime, context);
		RegistrySchemas.beginDateBeforeEndDate(path.beginDateTime, path.endDateTime);
	});
}
