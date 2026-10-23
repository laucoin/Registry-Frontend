import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnDestroy, signal, Signal, WritableSignal, model, ModelSignal } from '@angular/core'
import { BaseFormComponent } from '@shared/ui/base/base-form.component'
import { ProjectModel } from '@shared/models/model/project.model'
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade'
import { FieldTree, FormField } from '@angular/forms/signals'
import {
    createProjectForm,
    createProjectOptionsForm,
    ProjectFormModel,
    ProjectOptionsFormModel,
    selectedOptionsState,
    toProjectDto,
    toProjectFormModel,
    toProjectOptionsFormModel,
    withAllOptions,
} from '@pages/projects/project-form/project.form'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { combineLatest, filter, map, Observable, tap } from 'rxjs'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import {
    createProjectProfileInvitationForm,
    ProjectProfileInvitationFormModel,
    toProjectProfileInvitationFormModel,
    toProjectProfilesDto,
} from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile.form'
import { ProjectProfileInvitationFieldsComponent } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-invitation-fields/project-profile-invitation-fields.component'
import { ProjectDto } from '@pages/projects/data/dto/project.dto'
import { ProjectOptionModel } from '@shared/models/model/project-option.model'
import { ArrayHelper } from '@shared/helpers/array.helper'
import { GenericHelper } from '@shared/helpers/generic.helper'
import {TranslocoPipe} from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/card'
import '@sgdf/ui/callout'
import '@sgdf/ui/checkbox'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/divider'
import '@sgdf/ui/icon'
import '@sgdf/ui/input'
import '@sgdf/ui/spinner'
import '@sgdf/ui/step'
import '@sgdf/ui/stepper'
import '@sgdf/ui/switch'
import { FieldErrorDirective } from '@shared/directives/field-error.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { FieldErrorComponent } from '@shared/ui/common/field-error/field-error.component'
import { ProjectOptionIconPipe } from '@shared/helpers/pipe/project-option-icon.pipe'
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe'
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe'
import { ETagHelper } from '@shared/helpers/etag.helper'
import { NotificationModel } from '@shared/models/model/notification.model'
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component'

/**
 * Purpose: Page with the form to create or edit a project; a creation ends with an optional step inviting users to the new project.
 * Scope: Builds the forms, submits them through the facades and navigates away; shows the failure of the project or options load instead of the form. Once created, the project cannot be edited again from this page: the invitation step only skips or submits.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component( {
    selector: 'app-project-form',
    imports: [
        TranslocoPipe,
        PluralTranslationPipe,
        FormField,
        FieldErrorComponent,
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
} )
export class ProjectFormPage extends BaseFormComponent implements OnDestroy {
    protected readonly facade: ProjectFacade = inject( ProjectFacade )
    private readonly profileFacade: ProjectProfileFacade = inject( ProjectProfileFacade )

    protected readonly availableOptions: WritableSignal<ProjectOptionModel[]> = signal( [] )
    protected readonly model: WritableSignal<ProjectFormModel> = signal( toProjectFormModel() )
    protected readonly form: FieldTree<ProjectFormModel> = createProjectForm( this.model )
    protected readonly optionsModel: WritableSignal<ProjectOptionsFormModel> = signal( {} )
    protected readonly optionsForm: FieldTree<ProjectOptionsFormModel> = createProjectOptionsForm( this.optionsModel, this.availableOptions )
    protected readonly allSelected: Signal<boolean | undefined> = computed( (): boolean | undefined => selectedOptionsState( this.optionsModel() ) )
    protected readonly invitationModel: WritableSignal<ProjectProfileInvitationFormModel> = signal( toProjectProfileInvitationFormModel() )
    protected readonly invitationForm: FieldTree<ProjectProfileInvitationFormModel> = createProjectProfileInvitationForm( this.invitationModel )
    protected readonly createdProjectId: WritableSignal<string | undefined> = signal( undefined )
    protected readonly createdProjectName: WritableSignal<string | undefined> = signal( undefined )
    protected readonly nextNavigation: RegistryRouteEnum = RegistryRouteEnum.PROJECTS
    protected readonly activeTab: ModelSignal<number> = model<number>( 1 )
    protected readonly loadError: Signal<NotificationModel | undefined> = computed( (): NotificationModel | undefined =>
        this.facade.projectError() ?? this.facade.metadataErrors()[ 'options' ],
    )

    public constructor () {
        super()

        this.loadData()

        this.handleLoadedElement()
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected override loadData (): void {
        this.facade.resetProject()
        this.facade.fetchProjectOptions()

        if (GenericHelper.nonNull( this.idParam )) {
            this.facade.fetchProject( this.idParam! )
        }
    }

    protected handleLoadedElement (): void {
        this.subscriptions.add(
            combineLatest( [ this.facade.project$, this.facade.projectOptionsMetadata$ ] ).pipe(
                filter( ([ , options ]: [ ProjectModel | undefined, ProjectOptionModel[] ]): boolean =>
                    !ArrayHelper.isNullOrEmpty( options ),
                ),
                map( ([ project, options ]: [ ProjectModel | undefined, ProjectOptionModel[] ]): void =>
                    this.fillForm( project, options ),
                ),
            ).subscribe(),
        )
    }

    private fillForm ( project: ProjectModel | undefined, options: ProjectOptionModel[] ): void {
        this.availableOptions.set( options )
        this.optionsModel.set( toProjectOptionsFormModel( options, project?.options ) )
        if (project) this.model.set( toProjectFormModel( project ) )
    }

    protected submit (): void {
        const informationValid: boolean = this.isFormValid( this.form )
        if (!this.isFormValid( this.optionsForm ) || !informationValid) {
            this.logInvalidForm( { ...this.model(), options: this.optionsModel() } )
            return
        }

        const dto: ProjectDto = toProjectDto( this.model(), this.optionsModel() )
        const observable: Observable<unknown> =
            this.facade.project()
            ? this.facade.updateProject( this.facade.project()!.id!, dto, ETagHelper.ifMatch( this.facade.project() ) )
            : this.facade.createProject( dto )

        this.subscriptions.add(
            observable.pipe(
                tap( (): void => this.afterSave() ),
            ).subscribe(),
        )
    }

    private afterSave (): void {
        const createdProjectId: string | undefined = this.facade.createdProjectId()
        const isCreation: boolean = GenericHelper.isNull( this.facade.project() )

        if (isCreation && GenericHelper.nonNull( createdProjectId )) this.startInvitation( createdProjectId! )
        else this.navigateToRedirectUri()
    }

    private startInvitation (projectId: string): void {
        this.createdProjectId.set( projectId )
        this.createdProjectName.set( this.model().name )
        this.profileFacade.fetchAssignableRoles( projectId )
        this.activeTab.set( 3 )
    }

    protected invite (): void {
        const projectId: string | undefined = this.createdProjectId()
        if (this.saving() || GenericHelper.isNull( projectId )) return
        if (!this.isFormValid( this.invitationForm )) {
            this.logInvalidForm( this.invitationModel() )
            return
        }

        this.save(
            this.profileFacade.createProjectProfiles( toProjectProfilesDto( this.invitationModel() ), projectId ).pipe(
                tap( (): void => this.openCreatedProject() ),
            ),
            false,
        )
    }

    protected skip (): void {
        this.openCreatedProject()
    }

    private openCreatedProject (): void {
        this.navigateToRedirectUri( RegistryRouteEnum.PROJECT.replace( ':projectId', this.createdProjectId()! ) as RegistryRouteEnum )
    }

    protected next (): void {
        if (this.isFormValid( this.form )) this.activeTab.set( 2 )
    }

    protected selectAll ( event: { checked: boolean } ): void {
        this.optionsModel.update( (options: ProjectOptionsFormModel): ProjectOptionsFormModel => withAllOptions( options, event.checked ) )
    }

    protected get idParam (): string | undefined {
        return this.route.snapshot.params['projectId']
    }
}
