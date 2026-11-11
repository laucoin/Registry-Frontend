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
import { FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';
import { Observable } from 'rxjs';

import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import {
	createParticipantForm,
	ParticipantFormModel,
	toParticipantDto,
	toParticipantFormModel,
	withSelectedUser,
} from '@pages/projects/[projectId]/configuration/participants/participant-form/participant.form';
import { ParticipantUserSelectComponent } from '@pages/projects/[projectId]/configuration/participants/participant-user-select/participant-user-select.component';
import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { GroupHelper } from '@shared/helpers/group.helper';
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe';
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { GroupModel } from '@shared/models/model/group.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';
import { UserModel } from '@shared/models/model/user.model';
import { BaseElementFormComponent } from '@shared/ui/base/base-element-form.component';
import { FormComponent } from '@shared/ui/common/form/form.component';
import { FormActionsComponent } from '@shared/ui/common/form-actions/form-actions.component';
import { SelectElementsFieldComponent } from '@shared/ui/common/select-elements-field/select-elements-field.component';

import '@sgdf/ui/card';
import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/divider';
import '@sgdf/ui/input';

/**
 * Objectif: Formulaire de création ou d'édition d'un participant, routé ou posé dans un panneau.
 * Périmètre: Lie l'utilisateur lié, l'identité, la date de naissance, la période de présence et les groupes au
 * formulaire, rappelle le nom remplacé par celui de l'utilisateur lié et soumet via la facade.
 * Limites: Ne détient aucun état de domaine. Dans un panneau (`redirect` faux), le groupe par défaut remplace le choix
 * de l'utilisateur, de la période et des groupes, et la fin de saisie est signalée au lieu de naviguer.
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
		ParticipantUserSelectComponent,
		FormTitlePipe,
		FormButtonPipe,
		PluralTranslationPipe,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './participant-form.component.html',
})
export class ParticipantFormComponent extends BaseElementFormComponent<ParticipantModel, ParticipantFormModel> {
	protected readonly facade = inject(ParticipantFacade);
	protected readonly idParamName: string = 'participantId';

	protected readonly groupItem = GroupHelper.toSelectItem;
	protected readonly model = signal(toParticipantFormModel());
	protected readonly form = createParticipantForm(this.model, this.dateContext);

	public readonly redirect = input(true);
	public readonly showTitle = input(true);
	public readonly defaultGroup: InputSignal<GroupModel | undefined> = input();
	public readonly cancelled = output();

	protected readonly previousFirstName: WritableSignal<string | undefined> = signal(undefined);
	protected readonly previousLastName: WritableSignal<string | undefined> = signal(undefined);
	protected readonly firstNameHint = computed(() =>
		this.replacedName(this.previousFirstName(), this.model().firstName, 'participants.form.previous-first-name'),
	);
	protected readonly lastNameHint = computed(() =>
		this.replacedName(this.previousLastName(), this.model().lastName, 'participants.form.previous-last-name'),
	);

	constructor() {
		super();

		this.loadData();

		this.handleLoadedElement();
	}

	protected cancel(): void {
		if (this.redirect()) this.navigateToRedirectUri();
		else this.cancelled.emit();
	}

	protected handleGroupSearch(searched: { query: string }): void {
		this.facade.searchGroups(searched.query);
	}

	protected handleUserSelection(selected: SelectOptionModel<UserModel> | null): void {
		this.rememberNames(selected);
		this.model.update((current) =>
			withSelectedUser(current, selected, {
				firstName: this.previousFirstName(),
				lastName: this.previousLastName(),
			}),
		);
	}

	protected override applyElement(participant: ParticipantModel): void {
		super.applyElement(participant);
		if (participant.user) this.handleUserSelection(this.model().user);
	}

	protected override redirectsAfterSave(): boolean {
		return this.redirect();
	}

	protected fetchElement(id: string): Observable<ParticipantModel> {
		return this.facade.fetchParticipant(id);
	}

	protected toFormModel(participant: ParticipantModel): ParticipantFormModel {
		return toParticipantFormModel(participant);
	}

	protected create(model: ParticipantFormModel): Observable<ParticipantModel> {
		return this.facade.createParticipant(toParticipantDto(model, this.defaultGroup()));
	}

	protected update(
		participant: ParticipantModel,
		model: ParticipantFormModel,
		ifMatch: string | undefined,
	): Observable<ParticipantModel> {
		return this.facade.updateParticipant(participant.id, toParticipantDto(model, this.defaultGroup()), ifMatch);
	}

	private rememberNames(user: SelectOptionModel<UserModel> | null): void {
		if (user?.value.firstName) this.previousFirstName.set(this.model().firstName);
		if (user?.value.lastName) this.previousLastName.set(this.model().lastName);
	}

	private replacedName(previous: string | undefined, current: string, key: string): string {
		return previous && previous !== current ? key : '';
	}
}
