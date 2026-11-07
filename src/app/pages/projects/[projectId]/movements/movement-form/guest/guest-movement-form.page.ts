import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, model, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';

import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import {
	createGuestMovementForm,
	emptyGuest,
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
	reasonChoices,
	reasonKeyOf,
} from '@pages/projects/[projectId]/movements/movement-form/shared/movement-form.shared';
import { MovementPrefillService } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-prefill.service';
import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { ETagHelper } from '@shared/helpers/etag.helper';
import { EventHelper } from '@shared/helpers/event.helper';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { ParticipantHelper } from '@shared/helpers/participant.helper';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe';
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { withLoading } from '@shared/helpers/rx.helper';
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementContentModel } from '@shared/models/model/movement-content.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';
import { BaseFormComponent } from '@shared/ui/base/base-form.component';
import { FieldErrorComponent } from '@shared/ui/common/field-error/field-error.component';
import { FormComponent } from '@shared/ui/common/form/form.component';
import { SelectElementsFieldComponent } from '@shared/ui/common/select-elements-field/select-elements-field.component';

import '@sgdf/ui/button';
import '@sgdf/ui/card';
import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/divider';
import '@sgdf/ui/icon';
import '@sgdf/ui/icon-button';
import '@sgdf/ui/input';
import '@sgdf/ui/option';
import '@sgdf/ui/select';
import '@sgdf/ui/step';
import '@sgdf/ui/stepper';

/**
 * Purpose: Page avec le formulaire de création ou d'édition d'un mouvement d'invités.
 * Scope: Parcourt les étapes d'information et de contenu, enregistre les invités qui arrivent ou sélectionne ceux qui partent, soumet via la facade et navigue en arrière.
 * Limits: Ne détient aucun état de domaine, n'appelle jamais le backend et n'a pas d'étape véhicule.
 */
@Component({
	selector: 'app-guest-movement-form',
	imports: [
		FormComponent,
		FormField,
		FieldErrorComponent,
		FieldErrorDirective,
		SgdfFieldDirective,
		SelectElementsFieldComponent,
		TranslocoPipe,
		DateFormatPipe,
		FormTitlePipe,
		FormButtonPipe,
		PluralTranslationPipe,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './guest-movement-form.page.html',
})
export class GuestMovementFormPage extends BaseFormComponent {
	protected readonly facade = inject(MovementFacade);
	private readonly prefillService = inject(MovementPrefillService);

	protected readonly now = new Date();
	protected readonly movement: WritableSignal<MovementModel | undefined> = signal(undefined);
	protected readonly contextProject: WritableSignal<ProjectModel | undefined> = signal(undefined);
	protected readonly model = signal(emptyGuestMovementFormModel(this.now));
	protected readonly form = createGuestMovementForm(this.model, {
		project: this.contextProject,
		formatDate: (date) => this.datePipe.transform(date),
		editing: () => GenericHelper.nonNull(this.idParam),
	});

	protected readonly activeTab = model<number>(1);

	protected readonly arrival = computed(() => isArrival(this.model().information));
	protected readonly reasonOptions = computed(() =>
		reasonChoices(this.facade.searchedReasonAndActivityMetadata(), this.model().content.reason),
	);
	protected readonly suggestions = computed(() =>
		this.facade
			.searchedParticipantAndGroupMetadata()
			.flatMap((group) => group.items)
			.filter((option) => !('name' in option.value)),
	);

	protected readonly reasonKeyOf = reasonKeyOf;
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

	protected override loadData(): void {
		if (GenericHelper.nonNull(this.idParam)) {
			this.facade
				.fetchMovement(this.idParam)
				.pipe(withLoading(this.loading))
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe((movement) => {
					this.movement.set(movement);
					this.applyMovement(movement);
				});
		}
	}

	protected handleLoadedElement(): void {
		if (!GenericHelper.nonNull(this.idParam)) this.applyMovement(undefined);
	}

	private applyMovement(movement: MovementModel | undefined): void {
		this.contextProject.set(this.sessionFacade.selectedProject());
		if (movement) this.model.set(toGuestMovementFormModel(movement));
		else this.applyPrefill();
	}

	private applyPrefill(): void {
		const prefill = this.prefillService.read();
		if (!prefill) return;
		this.model.update((current) => withGuestPrefill(current, prefill));
		this.goTo(2);
	}

	protected handleTypeChange(event: Event): void {
		this.model.update((current) => withGuestType(current, EventHelper.valueOf(event)));
	}

	protected handleReasonChoice(event: Event): void {
		const reason =
			this.reasonOptions().find((option) => reasonKeyOf(option) === EventHelper.valueOf(event)) ?? null;
		this.model.update((current): GuestMovementFormModel => ({
			...current,
			content: { ...current.content, reason },
		}));
	}

	protected handleReasonSearch(query: string): void {
		this.facade.searchReasonsAndActivities(query, this.model().information.type, ParticipantTypeEnum.GUEST);
	}

	protected handleGuestsSearch(searched: { query: string }): void {
		this.facade.searchParticipantsAndGroups(
			ParticipantTypeEnum.GUEST,
			searched.query,
			this.model().information.dateTime ?? new Date(),
		);
	}

	protected addGuest(): void {
		this.model.update((current): GuestMovementFormModel => ({
			...current,
			content: { ...current.content, guests: [...current.content.guests, emptyGuest()] },
		}));
	}

	protected removeGuest(index: number): void {
		this.model.update((current): GuestMovementFormModel => ({
			...current,
			content: {
				...current.content,
				guests: current.content.guests.filter((_, position) => position !== index),
			},
		}));
	}

	protected goTo(step: number): void {
		this.activeTab.set(step);
	}

	protected nextFromInformation(): void {
		if (this.isFormValid(this.form.information)) this.goTo(2);
	}

	protected submit(): void {
		const current: MovementModel | undefined = this.movement();
		if (!this.canSubmit(current, () => this.isFormValid(this.form))) return;

		const dto = toGuestMovementDto(this.model());
		this.save(
			current
				? this.facade.updateGuestMovement(current.id, dto, ETagHelper.ifMatch(current))
				: this.facade.createGuestMovement(dto),
		);
	}

	protected get idParam(): string | undefined {
		return this.route.snapshot.params['movementId'];
	}
}
