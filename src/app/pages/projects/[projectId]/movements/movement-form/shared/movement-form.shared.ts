import { disabled, required, SchemaPathTree } from '@angular/forms/signals';

import { ProjectDateContext, RegistrySchemas } from '@shared/helpers/form/registry.schemas';
import { MovementReasonKindEnum } from '@shared/models/enumeration/movement-reason-kind.enum';
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum';
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum';
import { PresenceWarningSubjectEnum } from '@shared/models/enumeration/presence-warning-subject.enum';
import { GroupModel } from '@shared/models/model/group.model';
import { MovementContentModel } from '@shared/models/model/movement-content.model';
import { MovementReasonModel } from '@shared/models/model/movement-reason.model';
import { ParticipantModel } from '@shared/models/model/participant.model';

export interface MovementInformationModel {
	dateTime: Date | null;
	type: string;
}

export interface MovementFormContext extends ProjectDateContext {
	editing: () => boolean;
}

interface MovementReasonFields {
	reason: string | undefined;
	activityId: string | undefined;
}

export function informationRules(path: SchemaPathTree<MovementInformationModel>, context: MovementFormContext): void {
	required(path.dateTime);
	RegistrySchemas.notInTheFuture(path.dateTime, undefined, 'future');
	RegistrySchemas.withinProject(path.dateTime, context.project, context.formatDate);
	required(path.type);
	disabled(path.type, { when: context.editing });
}

export function interpretedPresence(type: string): PresenceStatusEnum[] {
	switch (type) {
		case MovementTypeEnum.IN:
			return [PresenceStatusEnum.IN];
		case MovementTypeEnum.OUT:
			return [PresenceStatusEnum.UNAVAILABLE, PresenceStatusEnum.OUT];
		default:
			return [];
	}
}

export function reasonKeyOf(reason: MovementReasonModel | null | undefined): string {
	return reason ? `${reason.kind}:${reason.value}` : '';
}

export function reasonChoices(
	searched: MovementReasonModel[],
	chosen: MovementReasonModel | null,
): MovementReasonModel[] {
	if (!chosen) return searched;
	const known = searched.some((option) => reasonKeyOf(option) === reasonKeyOf(chosen));
	return known ? searched : [chosen, ...searched];
}

export function reasonFieldsOf(reason: MovementReasonModel | null): MovementReasonFields {
	return {
		reason: reason?.kind === MovementReasonKindEnum.REASON ? reason.value : undefined,
		activityId: reason?.kind === MovementReasonKindEnum.ACTIVITY ? reason.value : undefined,
	};
}

export function contentOfChoice(chosen: ParticipantModel | GroupModel): MovementContentModel[] {
	if ('name' in chosen) {
		return (chosen.members ?? []).map((member): MovementContentModel => ({
			poolName: chosen.name,
			participant: member,
			vehicle: undefined,
		}));
	}
	return [{ poolName: undefined, participant: chosen, vehicle: undefined }];
}

export function presenceWarningKey(
	kind: PresenceWarningSubjectEnum,
	status: PresenceStatusEnum | undefined,
	presence: PresenceStatusEnum[],
): string | undefined {
	return status !== undefined && presence.includes(status) ? `movements.form.warning.${kind}.${status}` : undefined;
}
