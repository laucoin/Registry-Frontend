import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';
import { Observable } from 'rxjs';

import { GuestListFieldsComponent } from '@pages/projects/[projectId]/movements/movement-form/guest/guest-list-fields/guest-list-fields.component';
import {
	createGuestMovementForm,
	emptyGuestMovementFormModel,
	GuestMovementFormModel,
	isArrival,
	toGuestMovementDto,
	toGuestMovementFormModel,
	withGuestPrefill,
	withGuestType,
} from '@pages/projects/[projectId]/movements/movement-form/guest/guest-movement.form';
import {
	contentOfChoice,
	MovementInformationModel,
} from '@pages/projects/[projectId]/movements/movement-form/shared/movement-form.shared';
import { MovementFormPage } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-form-page.base';
import { MovementInformationStepComponent } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-information-step/movement-information-step.component';
import { MovementReasonSelectComponent } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-reason-select/movement-reason-select.component';
import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { ParticipantHelper } from '@shared/helpers/participant.helper';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { DateFormatTypeEnum } from '@shared/models/enumeration/date-format-type.enum';
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementContentModel } from '@shared/models/model/movement-content.model';
import { MovementPrefillModel } from '@shared/models/model/movement-prefill.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';
import { FormComponent } from '@shared/ui/common/form/form.component';
import { SelectElementsFieldComponent } from '@shared/ui/common/select-elements-field/select-elements-field.component';

import '@sgdf/ui/button';
import '@sgdf/ui/card';
import '@sgdf/ui/divider';
import '@sgdf/ui/icon';
import '@sgdf/ui/step';
import '@sgdf/ui/stepper';

/**
 * Objectif: Page avec le formulaire de création ou d'édition d'un mouvement d'invités.
 * Périmètre: Parcourt les étapes d'information et de contenu, enregistre les invités qui arrivent ou sélectionne ceux qui partent, soumet via la facade et navigue en arrière.
 * Limites: Ne détient aucun état de domaine, n'appelle jamais le backend et n'a pas d'étape véhicule.
 */
@Component({
	selector: 'app-guest-movement-form',
	imports: [
		FormComponent,
		FormField,
		FieldErrorDirective,
		GuestListFieldsComponent,
		MovementInformationStepComponent,
		MovementReasonSelectComponent,
		SelectElementsFieldComponent,
		TranslocoPipe,
		DateFormatPipe,
		FormButtonPipe,
		PluralTranslationPipe,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './guest-movement-form.page.html',
})
export class GuestMovementFormPage extends MovementFormPage<GuestMovementFormModel> {
	protected readonly DateFormatTypeEnum = DateFormatTypeEnum;
	protected readonly model = signal(emptyGuestMovementFormModel(this.now));
	protected readonly form = createGuestMovementForm(this.model, this.formContext);
	protected readonly participantType = ParticipantTypeEnum.GUEST;

	protected readonly arrival = computed(() => isArrival(this.model().information));
	protected readonly suggestions = computed(() =>
		this.facade
			.searchedParticipantAndGroupMetadata()
			.flatMap((group) => group.items)
			.filter((option) => !('name' in option.value)),
	);

	protected readonly contentOfChoice = contentOfChoice;
	protected readonly identifyContent: (content: MovementContentModel) => string = (content) => content.participant.id;
	protected readonly contentLabel: (content: MovementContentModel) => SelectOptionModel<ParticipantModel> = (
		content,
	) => ParticipantHelper.toSelectItem(content.participant);

	constructor() {
		super();

		this.loadData();

		this.handleLoadedElement();
	}

	protected handleGuestsSearch(searched: { query: string }): void {
		this.facade.searchParticipantsAndGroups(
			ParticipantTypeEnum.GUEST,
			searched.query,
			GenericHelper.require(this.model().information.dateTime, 'dateTime'),
		);
	}

	protected create(model: GuestMovementFormModel): Observable<unknown> {
		return this.facade.createGuestMovement(toGuestMovementDto(model));
	}

	protected update(
		movement: MovementModel,
		model: GuestMovementFormModel,
		ifMatch: string | undefined,
	): Observable<unknown> {
		return this.facade.updateGuestMovement(movement.id, toGuestMovementDto(model), ifMatch);
	}

	protected toFormModel(movement: MovementModel): GuestMovementFormModel {
		return toGuestMovementFormModel(movement);
	}

	protected withPrefill(model: GuestMovementFormModel, prefill: MovementPrefillModel): GuestMovementFormModel {
		return withGuestPrefill(model, prefill);
	}

	protected withType(model: GuestMovementFormModel, type: string): GuestMovementFormModel {
		return withGuestType(model, type);
	}

	protected informationForm(): FieldTree<MovementInformationModel> {
		return this.form.information;
	}
}
