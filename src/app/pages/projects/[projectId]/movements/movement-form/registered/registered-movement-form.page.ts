import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, Signal, signal } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';
import { Observable } from 'rxjs';

import {
	createRegisteredMovementForm,
	driversOf,
	emptyRegisteredMovementFormModel,
	isRegisteredReasonRequired,
	RegisteredMovementFormModel,
	toRegisteredMovementDto,
	toRegisteredMovementFormModel,
	withRegisteredPrefill,
	withRegisteredType,
} from '@pages/projects/[projectId]/movements/movement-form/registered/registered-movement.form';
import { RegisteredParticipantsFieldsComponent } from '@pages/projects/[projectId]/movements/movement-form/registered/registered-participants-fields/registered-participants-fields.component';
import { RegisteredVehiclesFieldsComponent } from '@pages/projects/[projectId]/movements/movement-form/registered/registered-vehicles-fields/registered-vehicles-fields.component';
import {
	interpretedPresence,
	MovementInformationModel,
} from '@pages/projects/[projectId]/movements/movement-form/shared/movement-form.shared';
import { MovementFormPage } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-form-page.base';
import { MovementInformationStepComponent } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-information-step/movement-information-step.component';
import { MovementReasonSelectComponent } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-reason-select/movement-reason-select.component';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe';
import { DateFormatTypeEnum } from '@shared/models/enumeration/date-format-type.enum';
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementPrefillModel } from '@shared/models/model/movement-prefill.model';
import { FormComponent } from '@shared/ui/common/form/form.component';

import '@sgdf/ui/button';
import '@sgdf/ui/card';
import '@sgdf/ui/divider';
import '@sgdf/ui/icon';
import '@sgdf/ui/step';
import '@sgdf/ui/stepper';

/**
 * Objectif: Page avec le formulaire de création ou d'édition d'un mouvement de participants inscrits.
 * Périmètre: Parcourt les étapes d'information, de contenu et de véhicule, soumet via la facade et navigue en arrière.
 * Limites: Ne détient aucun état de domaine, n'appelle jamais le backend et ne connaît rien des invités.
 */
@Component({
	selector: 'app-registered-movement-form',
	imports: [
		FormComponent,
		MovementInformationStepComponent,
		MovementReasonSelectComponent,
		RegisteredParticipantsFieldsComponent,
		RegisteredVehiclesFieldsComponent,
		TranslocoPipe,
		DateFormatPipe,
		FormButtonPipe,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './registered-movement-form.page.html',
})
export class RegisteredMovementFormPage extends MovementFormPage<RegisteredMovementFormModel> {
	protected readonly DateFormatTypeEnum = DateFormatTypeEnum;
	protected readonly model = signal(emptyRegisteredMovementFormModel(this.now));
	protected readonly form = createRegisteredMovementForm(this.model, this.formContext);
	protected readonly participantType = ParticipantTypeEnum.REGISTERED;

	protected readonly reasonRequired = computed(() => isRegisteredReasonRequired(this.model().information));
	protected readonly presence = computed(() => interpretedPresence(this.model().information.type));
	protected readonly drivers = computed(() => driversOf(this.model()));
	private readonly hasVehicleOption = this.sessionFacade.selectedProjectHasOption(ProjectOptionEnum.VEHICLE);
	protected readonly vehicleStep: Signal<boolean> = computed(() => this.hasVehicleOption() || this.hadVehicles());

	constructor() {
		super();

		this.loadData();

		this.handleLoadedElement();
	}

	protected nextFromContent(): void {
		if (!this.isFormValid(this.form.content)) return;
		if (this.vehicleStep()) this.goTo(3);
		else this.submit();
	}

	protected create(model: RegisteredMovementFormModel): Observable<unknown> {
		return this.facade.createRegisteredMovement(toRegisteredMovementDto(model));
	}

	protected update(
		movement: MovementModel,
		model: RegisteredMovementFormModel,
		ifMatch: string | undefined,
	): Observable<unknown> {
		return this.facade.updateRegisteredMovement(movement.id, toRegisteredMovementDto(model), ifMatch);
	}

	protected override isValid(): boolean {
		return this.sectionsValid();
	}

	protected toFormModel(movement: MovementModel): RegisteredMovementFormModel {
		return toRegisteredMovementFormModel(movement);
	}

	protected withPrefill(
		model: RegisteredMovementFormModel,
		prefill: MovementPrefillModel,
	): RegisteredMovementFormModel {
		return withRegisteredPrefill(model, prefill);
	}

	protected withType(model: RegisteredMovementFormModel, type: string): RegisteredMovementFormModel {
		return withRegisteredType(model, type);
	}

	protected informationForm(): FieldTree<MovementInformationModel> {
		return this.form.information;
	}

	private hadVehicles(): boolean {
		return (this.element()?.content ?? []).some((content) => GenericHelper.nonNull(content.vehicle));
	}

	private sectionsValid(): boolean {
		return [
			this.isFormValid(this.form.information),
			this.isFormValid(this.form.content),
			this.isFormValid(this.form.vehicles),
		].every(Boolean);
	}
}
