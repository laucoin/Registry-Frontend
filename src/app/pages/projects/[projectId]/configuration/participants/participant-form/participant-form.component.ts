import {
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	inject,
	input,
	InputSignal,
	output,
	signal,
	WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';

import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import {
	createParticipantForm,
	toParticipantDto,
	toParticipantFormModel,
	withSelectedUser,
} from '@pages/projects/[projectId]/configuration/participants/participant-form/participant.form';
import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { ETagHelper } from '@shared/helpers/etag.helper';
import { EventHelper } from '@shared/helpers/event.helper';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { GroupHelper } from '@shared/helpers/group.helper';
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe';
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { withLoading } from '@shared/helpers/rx.helper';
import { GroupModel } from '@shared/models/model/group.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';
import { UserModel } from '@shared/models/model/user.model';
import { BaseFormComponent } from '@shared/ui/base/base-form.component';
import { FormComponent } from '@shared/ui/common/form/form.component';
import { FormActionsComponent } from '@shared/ui/common/form-actions/form-actions.component';
import { SelectElementsFieldComponent } from '@shared/ui/common/select-elements-field/select-elements-field.component';

import '@sgdf/ui/card';
import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/divider';
import '@sgdf/ui/input';
import '@sgdf/ui/option';
import '@sgdf/ui/select';

/**
 * Purpose: Champs de formulaire d'un participant.
 * Scope: Construit les champs de participant partagés par la création et l'édition.
 * Limits: Ne soumet pas ; la page du participant le fait.
 */
@Component({
	selector: 'app-participant-form',
	imports: [
		FormComponent,
		FormActionsComponent,
		FieldErrorDirective,
		SgdfFieldDirective,
		TranslocoPipe,
		FormField,
		SelectElementsFieldComponent,
		FormTitlePipe,
		FormButtonPipe,
		PluralTranslationPipe,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './participant-form.component.html',
})
export class ParticipantFormComponent extends BaseFormComponent {
	protected readonly facade = inject(ParticipantFacade);

	protected readonly GroupHelper = GroupHelper;

	protected readonly participant: WritableSignal<ParticipantModel | undefined> = signal(undefined);
	protected readonly contextProject: WritableSignal<ProjectModel | undefined> = signal(undefined);
	protected readonly model = signal(toParticipantFormModel());
	protected readonly form = createParticipantForm(this.model, {
		project: this.contextProject,
		formatDate: (date) => this.datePipe.transform(date),
	});

	public readonly redirect = input(true);
	public readonly showTitle = input(true);
	public readonly defaultGroup: InputSignal<GroupModel | undefined> = input();
	public readonly cancelled = output();

	protected readonly userChoices = computed(() => this.buildUserChoices());
	protected readonly previousFirstName: WritableSignal<string | undefined> = signal(undefined);
	protected readonly previousLastName: WritableSignal<string | undefined> = signal(undefined);

	constructor() {
		super();

		this.loadData();

		this.handleLoadedElement();
	}

	protected override loadData(): void {
		if (GenericHelper.nonNull(this.idParam)) {
			this.facade
				.fetchParticipant(this.idParam)
				.pipe(withLoading(this.loading))
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe((participant) => {
					this.participant.set(participant);
					this.applyParticipant(participant);
				});
		}
	}

	protected handleLoadedElement(): void {
		if (!GenericHelper.nonNull(this.idParam)) {
			this.applyParticipant(undefined);
		}
	}

	private applyParticipant(participant: ParticipantModel | undefined): void {
		this.contextProject.set(this.sessionFacade.selectedProject());
		if (!participant) return;
		this.model.set(toParticipantFormModel(participant));
		if (participant.user) this.handleUserSelection(this.model().user);
	}

	protected submit(): void {
		const participant: ParticipantModel | undefined = this.participant();
		if (!this.canSubmit(participant, () => this.isFormValid(this.form))) return;

		const dto = toParticipantDto(this.model(), this.defaultGroup());
		this.save(
			participant
				? this.facade.updateParticipant(participant.id, dto, ETagHelper.ifMatch(participant))
				: this.facade.createParticipant(dto),
			this.redirect(),
		);
	}

	protected cancel(): void {
		if (this.redirect()) this.navigateToRedirectUri();
		else this.cancelled.emit();
	}

	protected handleUserSearch(query: string): void {
		this.facade.searchUsers(query);
	}

	protected handleUserChoice(event: Event): void {
		const id = EventHelper.valueOf(event);
		this.handleUserSelection(this.userChoices().find((option) => option.value.id === id));
	}

	protected handleGroupSearch(searched: { query: string }): void {
		this.facade.searchGroups(searched.query);
	}

	protected handleUserSelection(selected: SelectOptionModel<UserModel> | null | undefined): void {
		const user = selected ?? null;
		this.rememberNames(user);
		this.model.update((current) =>
			withSelectedUser(current, user, {
				firstName: this.previousFirstName(),
				lastName: this.previousLastName(),
			}),
		);
	}

	private rememberNames(user: SelectOptionModel<UserModel> | null): void {
		if (user?.value.firstName) this.previousFirstName.set(this.model().firstName);
		if (user?.value.lastName) this.previousLastName.set(this.model().lastName);
	}

	protected get idParam(): string | undefined {
		return this.route.snapshot.params['participantId'];
	}

	private buildUserChoices(): SelectOptionModel<UserModel>[] {
		const searched = this.facade.searchedUsersMetadata();
		const chosen = this.model().user;
		return chosen && !searched.some((option) => option.value.id === chosen.value.id)
			? [chosen, ...searched]
			: searched;
	}
}
