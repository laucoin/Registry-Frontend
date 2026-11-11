import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, model, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TranslocoPipe } from '@jsverse/transloco';
import { combineLatest, filter, take, tap } from 'rxjs';

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
	toProjectDto,
	toProjectFormModel,
	toProjectOptionsFormModel,
} from '@pages/projects/project-form/project.form';
import { ProjectFormStepperComponent } from '@pages/projects/project-form/project-form-stepper/project-form-stepper.component';
import { ProjectInformationFieldsComponent } from '@pages/projects/project-form/project-information-fields/project-information-fields.component';
import { ProjectOptionsFieldsComponent } from '@pages/projects/project-form/project-options-fields/project-options-fields.component';
import { ArrayHelper } from '@shared/helpers/array.helper';
import { ETagHelper } from '@shared/helpers/etag.helper';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe';
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { RouteHelper } from '@shared/helpers/route.helper';
import { ProjectModel } from '@shared/models/model/project.model';
import { ProjectOptionModel } from '@shared/models/model/project-option.model';
import { BaseFormComponent } from '@shared/ui/base/base-form.component';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';

import '@sgdf/ui/button';
import '@sgdf/ui/card';
import '@sgdf/ui/callout';
import '@sgdf/ui/icon';
import '@sgdf/ui/page-title';
import '@sgdf/ui/spinner';

/**
 * Objectif: Page avec le formulaire de création ou d'édition d'un projet ; une création se termine par une étape facultative invitant des utilisateurs sur le nouveau projet.
 * Périmètre: Construit les formulaires, les soumet via les facades et navigue ailleurs ; affiche l'échec du chargement du projet ou des options à la place du formulaire. Une fois créé, le projet ne peut plus être édité depuis cette page : l'étape d'invitation ne fait qu'être ignorée ou soumise.
 * Limites: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-project-form',
	imports: [
		TranslocoPipe,
		PluralTranslationPipe,
		FormButtonPipe,
		FormTitlePipe,
		SectionErrorComponent,
		ProjectProfileInvitationFieldsComponent,
		ProjectFormStepperComponent,
		ProjectInformationFieldsComponent,
		ProjectOptionsFieldsComponent,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './project-form.page.html',
})
export class ProjectFormPage extends BaseFormComponent {
	protected readonly facade = inject(ProjectFacade);
	private readonly profileFacade = inject(ProjectProfileFacade);

	protected readonly availableOptions: WritableSignal<ProjectOptionModel[]> = signal([]);
	protected readonly model = signal(toProjectFormModel());
	protected readonly form = createProjectForm(this.model);
	protected readonly optionsModel: WritableSignal<ProjectOptionsFormModel> = signal({});
	protected readonly optionsForm = createProjectOptionsForm(this.optionsModel, this.availableOptions);
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
				takeUntilDestroyed(this.destroyRef),
			)
			.subscribe(([project, options]) => this.fillForm(project, options));
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
		const projectId = GenericHelper.require(this.createdProjectId(), 'createdProjectId');
		if (this.saving()) return;
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
		const createdProjectId = GenericHelper.require(this.createdProjectId(), 'createdProjectId');
		this.navigateToRedirectUri(RouteHelper.withProjectId(RegistryRouteEnum.PROJECT, createdProjectId));
	}

	protected next(): void {
		if (this.isFormValid(this.form)) this.activeTab.set(2);
	}

	protected get idParam(): string | undefined {
		return this.route.snapshot.params['projectId'];
	}
}
