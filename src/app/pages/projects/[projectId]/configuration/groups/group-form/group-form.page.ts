import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal, WritableSignal } from '@angular/core';
import { FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';
import { Observable, tap } from 'rxjs';

import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade';
import {
	createGroupForm,
	GroupFormModel,
	toGroupDto,
	toGroupFormModel,
} from '@pages/projects/[projectId]/configuration/groups/group-form/group.form';
import {
	createAddMembersForm,
	emptyAddMembersFormModel,
	toMemberIds,
} from '@pages/projects/[projectId]/configuration/groups/group-member-list/add-members.form';
import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe';
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe';
import { GroupModel } from '@shared/models/model/group.model';
import { BaseElementFormComponent } from '@shared/ui/base/base-element-form.component';
import { FormComponent } from '@shared/ui/common/form/form.component';
import { FormActionsComponent } from '@shared/ui/common/form-actions/form-actions.component';
import { GroupMembersFieldComponent } from '@shared/ui/domain/group-members-field/group-members-field.component';

import '@sgdf/ui/button';
import '@sgdf/ui/callout';
import '@sgdf/ui/card';
import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/icon';
import '@sgdf/ui/input';
import '@sgdf/ui/step';
import '@sgdf/ui/stepper';

/**
 * Objectif: Page avec le formulaire de création ou d'édition d'un groupe ; une création se poursuit par une étape facultative d'ajout de membres au nouveau groupe.
 * Périmètre: Construit les formulaires, les soumet via la facade et navigue en arrière. Une fois créé, le groupe ne peut plus être édité depuis cette page : l'étape des membres ne fait qu'être ignorée ou soumise.
 * Limites: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-group-form',
	imports: [
		FormComponent,
		FormActionsComponent,
		FieldErrorDirective,
		SgdfFieldDirective,
		TranslocoPipe,
		FormField,
		FormTitlePipe,
		FormButtonPipe,
		GroupMembersFieldComponent,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './group-form.page.html',
})
export class GroupFormPage extends BaseElementFormComponent<GroupModel, GroupFormModel> {
	protected readonly idParamName: string = 'groupId';
	protected readonly facade = inject(GroupFacade);

	protected readonly model = signal(toGroupFormModel());
	protected readonly form = createGroupForm(this.model, this.dateContext);

	protected readonly addMembersModel = signal(emptyAddMembersFormModel());
	protected readonly addMembersForm = createAddMembersForm(this.addMembersModel);
	protected readonly createdGroupId: WritableSignal<string | undefined> = signal(undefined);
	protected readonly activeTab = signal(1);

	constructor() {
		super();

		this.loadData();

		this.handleLoadedElement();
	}

	protected fetchElement(id: string): Observable<GroupModel> {
		return this.facade.fetchGroup(id);
	}

	protected toFormModel(group: GroupModel): GroupFormModel {
		return toGroupFormModel(group);
	}

	protected create(model: GroupFormModel): Observable<GroupModel> {
		return this.facade.createGroup(toGroupDto(model)).pipe(tap((created) => this.startMembersStep(created)));
	}

	protected update(group: GroupModel, model: GroupFormModel, ifMatch: string | undefined): Observable<GroupModel> {
		return this.facade.updateGroup(group.id, toGroupDto(model), ifMatch);
	}

	protected override redirectsAfterSave(): boolean {
		return GenericHelper.nonNull(this.element());
	}

	private startMembersStep(created: GroupModel): void {
		this.createdGroupId.set(created.id);
		this.activeTab.set(2);
	}

	protected addMembers(): void {
		const groupId: string | undefined = this.createdGroupId();
		if (this.saving() || GenericHelper.isNull(groupId) || !this.isFormValid(this.addMembersForm)) return;

		this.save(
			this.facade
				.addMembersToGroup(groupId, toMemberIds(this.addMembersModel()))
				.pipe(tap(() => this.navigateToRedirectUri())),
			false,
		);
	}

	protected skip(): void {
		this.navigateToRedirectUri();
	}

	protected handleSearch(searched: string | undefined): void {
		this.facade.searchParticipants(searched);
	}
}
