import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, model, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';
import { tap } from 'rxjs';

import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade';
import {
	createGroupForm,
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
import { ETagHelper } from '@shared/helpers/etag.helper';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe';
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe';
import { withLoading } from '@shared/helpers/rx.helper';
import { GroupModel } from '@shared/models/model/group.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { BaseFormComponent } from '@shared/ui/base/base-form.component';
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
 * Purpose: Page avec le formulaire de création ou d'édition d'un groupe ; une création se poursuit par une étape facultative d'ajout de membres au nouveau groupe.
 * Scope: Construit les formulaires, les soumet via la facade et navigue en arrière. Une fois créé, le groupe ne peut plus être édité depuis cette page : l'étape des membres ne fait qu'être ignorée ou soumise.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
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
export class GroupFormPage extends BaseFormComponent {
	protected readonly facade = inject(GroupFacade);

	protected readonly group: WritableSignal<GroupModel | undefined> = signal(undefined);
	protected readonly contextProject: WritableSignal<ProjectModel | undefined> = signal(undefined);
	protected readonly model = signal(toGroupFormModel());
	protected readonly form = createGroupForm(this.model, {
		project: this.contextProject,
		formatDate: (date) => this.datePipe.transform(date),
	});

	protected readonly addMembersModel = signal(emptyAddMembersFormModel());
	protected readonly addMembersForm = createAddMembersForm(this.addMembersModel);
	protected readonly createdGroupId: WritableSignal<string | undefined> = signal(undefined);
	protected readonly activeTab = model<number>(1);

	constructor() {
		super();

		this.loadData();

		this.handleLoadedElement();
	}

	protected override loadData(): void {
		if (GenericHelper.nonNull(this.idParam)) {
			this.facade
				.fetchGroup(this.idParam)
				.pipe(withLoading(this.loading))
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe((group) => {
					this.group.set(group);
					this.applyGroup(group);
				});
		}
	}

	protected handleLoadedElement(): void {
		if (!GenericHelper.nonNull(this.idParam)) {
			this.applyGroup(undefined);
		}
	}

	private applyGroup(group: GroupModel | undefined): void {
		this.contextProject.set(this.sessionFacade.selectedProject());
		if (group) this.model.set(toGroupFormModel(group));
	}

	protected submit(): void {
		const group: GroupModel | undefined = this.group();
		if (!this.canSubmit(group, () => this.isFormValid(this.form))) return;

		const dto = toGroupDto(this.model());
		if (group) this.save(this.facade.updateGroup(group.id, dto, ETagHelper.ifMatch(group)));
		else this.save(this.facade.createGroup(dto).pipe(tap((it) => this.startMembersStep(it))), false);
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

	protected get idParam(): string | undefined {
		return this.route.snapshot.params['groupId'];
	}
}
