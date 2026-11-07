import { WritableSignal } from '@angular/core';
import { applyEach, FieldContext, FieldTree, form, required, SchemaPathTree } from '@angular/forms/signals';

import { GuestDto } from '@pages/projects/[projectId]/movements/data/dto/guest.dto';
import { GuestMovementDto } from '@pages/projects/[projectId]/movements/data/dto/guest-movement.dto';
import {
	informationRules,
	MovementFormContext,
	MovementInformationModel,
	reasonFieldsOf,
} from '@pages/projects/[projectId]/movements/movement-form/shared/movement-form.shared';
import { MovementPrefillModel } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-prefill.model';
import { DateHelper } from '@shared/helpers/date.helper';
import { FormModelHelper } from '@shared/helpers/form/form-model.helper';
import { RegistrySchemas } from '@shared/helpers/form/registry.schemas';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementContentModel } from '@shared/models/model/movement-content.model';
import { MovementReasonModel } from '@shared/models/model/movement-reason.model';
import { ParticipantModel } from '@shared/models/model/participant.model';

export interface MovementGuestModel {
	id: string;
	firstName: string;
	lastName: string;
	birthday: Date | null;
}

interface GuestContentModel {
	reason: MovementReasonModel | null;
	participants: MovementContentModel[];
	guests: MovementGuestModel[];
}

export interface GuestMovementFormModel {
	information: MovementInformationModel;
	content: GuestContentModel;
}

export function emptyGuest(participant?: ParticipantModel): MovementGuestModel {
	return {
		id: FormModelHelper.orEmpty(participant?.id),
		firstName: FormModelHelper.orEmpty(participant?.firstName),
		lastName: FormModelHelper.orEmpty(participant?.lastName),
		birthday: participant?.birthday ? new Date(participant.birthday) : null,
	};
}

export function isArrival(information: MovementInformationModel): boolean {
	return information.type === MovementTypeEnum.IN;
}

export function emptyGuestMovementFormModel(now: Date): GuestMovementFormModel {
	return {
		information: { dateTime: now, type: '' },
		content: { reason: null, participants: [], guests: [] },
	};
}

export function withGuestType(model: GuestMovementFormModel, type: string): GuestMovementFormModel {
	const information: MovementInformationModel = { ...model.information, type };
	const guests = isArrival(information) ? (model.content.guests.length ? model.content.guests : [emptyGuest()]) : [];
	return { information, content: { ...model.content, reason: null, guests } };
}

export function withGuestPrefill(model: GuestMovementFormModel, prefill: MovementPrefillModel): GuestMovementFormModel {
	const information: MovementInformationModel = { ...model.information, type: prefill.type };
	const arrival = isArrival(information);
	return {
		information,
		content: {
			reason: arrival && prefill.reason ? FormModelHelper.copy(prefill.reason) : null,
			participants: arrival ? [] : FormModelHelper.copyItems(prefill.content),
			guests: arrival ? prefill.content.map((content) => emptyGuest(content.participant)) : [],
		},
	};
}

export function toGuestMovementFormModel(movement: MovementModel): GuestMovementFormModel {
	const information: MovementInformationModel = { dateTime: new Date(movement.dateTime), type: movement.type.value };
	const arrival = isArrival(information);
	return {
		information,
		content: {
			reason: movement.reason ? FormModelHelper.copy(movement.reason) : null,
			participants: arrival ? [] : FormModelHelper.copyItems(movement.content),
			guests: arrival ? movement.content.map((content) => emptyGuest(content.participant)) : [],
		},
	};
}

function guestsDtoOf(model: GuestMovementFormModel): GuestDto[] {
	return model.content.guests.map((guest): GuestDto => ({
		id: guest.id || undefined,
		firstName: guest.firstName,
		lastName: guest.lastName,
		birthday: DateHelper.getDate(GenericHelper.require(guest.birthday, 'birthday')),
	}));
}

export function toGuestMovementDto(model: GuestMovementFormModel): GuestMovementDto {
	return {
		dateTime: GenericHelper.require(model.information.dateTime, 'dateTime'),
		type: model.information.type,
		reason: reasonFieldsOf(model.content.reason).reason,
		content: model.content.participants.map((content) => ({
			participantId: content.participant.id,
		})),
		guests: guestsDtoOf(model),
	};
}

function guestRules(guest: SchemaPathTree<MovementGuestModel>): void {
	RegistrySchemas.requiredText(guest.firstName, 150);
	RegistrySchemas.requiredText(guest.lastName, 150);
	required(guest.birthday);
	RegistrySchemas.notInTheFuture(guest.birthday);
}

export function createGuestMovementForm(
	model: WritableSignal<GuestMovementFormModel>,
	context: MovementFormContext,
): FieldTree<GuestMovementFormModel> {
	return form(model, (path: SchemaPathTree<GuestMovementFormModel>) => {
		informationRules(path.information, context);
		required(path.content.reason, {
			when: (ctx: FieldContext<MovementReasonModel | null>) => isArrival(ctx.valueOf(path.information)),
		});
		RegistrySchemas.requiredList(path.content.participants, (ctx) => !isArrival(ctx.valueOf(path.information)));
		RegistrySchemas.requiredList(path.content.guests, (ctx) => isArrival(ctx.valueOf(path.information)));
		applyEach(path.content.guests, guestRules);
	});
}
