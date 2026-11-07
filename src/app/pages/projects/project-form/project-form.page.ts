import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, model, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';
import { combineLatest, filter, map, take, tap } from 'rxjs';

import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade';
import {
	createProjectProfileInvitationForm,
	toProjectProfileInvitationFormModel,
	toProjectProfilesDto,
} from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile.form';
import { ProjectProfileInvitationFieldsComponent } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-invitation-fields/project-profile-invitation-fields.component';
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade';
import {
	createProjectForm,
	createProjectOptionsForm,
	ProjectOptionsFormModel,
	selectedOptionsState,
	toProjectDto,
	toProjectFormModel,
	toProjectOptionsFormModel,
	withAllOptions,
} from '@pages/projects/project-form/project.form';
import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { ArrayHelper } from '@shared/helpers/array.helper';
import { ETagHelper } from '@shared/helpers/etag.helper';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe';
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { ProjectOptionIconPipe } from '@shared/helpers/pipe/project-option-icon.pipe';
import { ProjectModel } from '@shared/models/model/project.model';
import { ProjectOptionModel } from '@shared/models/model/project-option.model';
import { BaseFormComponent } from '@shared/ui/base/base-form.component';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';

import '@sgdf/ui/button';
import '@sgdf/ui/card';
import '@sgdf/ui/callout';
import '@sgdf/ui/checkbox';
import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/divider';
import '@sgdf/ui/icon';
import '@sgdf/ui/input';
import '@sgdf/ui/spinner';
import '@sgdf/ui/step';
import '@sgdf/ui/stepper';
import '@sgdf/ui/switch';

/**
 * Purpose: Page avec le formulaire de création ou d'édition d'un projet ; une création se termine par une étape facultative invitant des utilisateurs sur le nouveau projet.
 * Scope: Construit les formulaires, les soumet via les facades et navigue ailleurs ; affiche l'échec du chargement du projet ou des options à la place du formulaire. Une fois créé, le projet ne peut plus être édité depuis cette page : l'étape d'invitation ne fait qu'être ignorée ou soumise.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-project-form',
	imports: [
		TranslocoPipe,
		PluralTranslationPipe,
		FormField,
		FieldErrorDirective,
		SgdfFieldDirective,
		ProjectOptionIconPipe,
		FormButtonPipe,
		FormTitlePipe,
		SectionErrorComponent,
		ProjectProfileInvitationFieldsComponent,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './project-form.page.html',
	styles: 'h1 { font-size: var(--sgdf-text-3xl); }',
})
export class ProjectFormPage extends BaseFormComponent {
	protected readonly facade = inject(ProjectFacade);
	private readonly profileFacade = inject(ProjectProfileFacade);

	protected readonly availableOptions: WritableSignal<ProjectOptionModel[]> = signal([]);
	protected readonly model = signal(toProjectFormModel());
	protected readonly form = createProjectForm(this.model);
	protected readonly optionsModel: WritableSignal<ProjectOptionsFormModel> = signal({});
	protected readonly optionsForm = createProjectOptionsForm(this.optionsModel, this.availableOptions);
	protected readonly allSelected = computed(() => selectedOptionsState(this.optionsModel()));
	protected readonly invitationModel = signal(toProjectProfileInvitationFormModel());
	protected readonly invitationForm = createProjectProfileInvitationForm(this.invitationModel);
	protected readonly createdProjectId: WritableSignal<string | undefined> = signal(undefined);
	protected readonly createdProjectName: WritableSignal<string | undefined> = signal(undefined);
	protected readonly activeTab = model<number>(1);
	protected readonly loadError = computed(
		() => this.facade.projectError() ?? this.facade.metadataErrors()['options'],
	);

	constructor() {
		super();

		this.destroyRef.onDestroy(() => this.facade.resetProject());

		this.loadData();

		this.handleLoadedElement();
	}

	protected override loadData(): void {
		this.facade.resetProject();
		this.facade.fetchProjectOptions();

		if (GenericHelper.nonNull(this.idParam)) {
			this.facade.fetchProject(this.idParam);
		}
	}

	protected handleLoadedElement(): void {
		combineLatest([this.facade.project$, this.facade.projectOptionsMetadata$])
			.pipe(
				filter(
					([project, options]) =>
						!ArrayHelper.isNullOrEmpty(options) &&
						(GenericHelper.isNull(this.idParam) || GenericHelper.nonNull(project)),
				),
				take(1),
				map(([project, options]) => this.fillForm(project, options)),
			)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe();
	}

	private fillForm(project: ProjectModel | undefined, options: ProjectOptionModel[]): void {
		this.availableOptions.set(options);
		this.optionsModel.set(toProjectOptionsFormModel(options, project?.options));
		if (project) this.model.set(toProjectFormModel(project));
	}

	protected submit(): void {
		if (this.saving()) return;
		const informationValid = this.isFormValid(this.form);
		if (!this.isFormValid(this.optionsForm) || !informationValid) {
			return;
		}

		const dto = toProjectDto(this.model(), this.optionsModel());
		const project = this.facade.project();
		const observable = project
			? this.facade.updateProject(project.id, dto, ETagHelper.ifMatch(project))
			: this.facade.createProject(dto);

		this.save(observable.pipe(tap(() => this.afterSave())), false);
	}

	private afterSave(): void {
		const createdProjectId = this.facade.createdProjectId();
		const isCreation = GenericHelper.isNull(this.facade.project());

		if (isCreation && GenericHelper.nonNull(createdProjectId)) this.startInvitation(createdProjectId);
		else this.navigateToRedirectUri();
	}

	private startInvitation(projectId: string): void {
		this.createdProjectId.set(projectId);
		this.createdProjectName.set(this.model().name);
		this.profileFacade.fetchAssignableRoles(projectId);
		this.activeTab.set(3);
	}

	protected invite(): void {
		const projectId: string | undefined = this.createdProjectId();
		if (this.saving() || GenericHelper.isNull(projectId)) return;
		if (!this.isFormValid(this.invitationForm)) {
			return;
		}

		this.save(
			this.profileFacade
				.createProjectProfiles(toProjectProfilesDto(this.invitationModel()), projectId)
				.pipe(tap(() => this.openCreatedProject())),
			false,
		);
	}

	protected skip(): void {
		this.openCreatedProject();
	}

	private openCreatedProject(): void {
		const createdProjectId: string | undefined = this.createdProjectId();
		if (!createdProjectId) return;
		this.navigateToRedirectUri(
			RegistryRouteEnum.PROJECT.replace(':projectId', createdProjectId) as RegistryRouteEnum,
		);
	}

	protected next(): void {
		if (this.isFormValid(this.form)) this.activeTab.set(2);
	}

	protected selectAll(event: { checked: boolean }): void {
		this.optionsModel.update((options: ProjectOptionsFormModel) => withAllOptions(options, event.checked));
	}

	protected get idParam(): string | undefined {
		return this.route.snapshot.params['projectId'];
	}
}
