import { Component, computed, inject, linkedSignal, OnDestroy, signal, Signal, WritableSignal, model, ModelSignal } from '@angular/core'
import { BaseFormComponent } from '@shared/ui/base/base-form.component'
import { ProjectModel } from '@shared/models/model/project.model'
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade'
import { FieldTree, form, FormField } from '@angular/forms/signals'
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
import { ProjectDto } from '@pages/projects/data/dto/project.dto'
import { ProjectOptionModel } from '@shared/models/model/project-option.model'
import { ArrayHelper } from '@shared/helpers/array.helper'
import { Checkbox, CheckboxChangeEvent } from 'primeng/checkbox'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { Step, StepItem, StepPanel, Stepper } from 'primeng/stepper'
import { Button } from 'primeng/button'
import {TranslocoPipe} from '@jsverse/transloco'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { FieldErrorComponent } from '@shared/ui/common/field-error/field-error.component'
import { DateTimeFieldComponent } from '@shared/ui/common/date-time-field/date-time-field.component'
import { RegistryRequiredDirective } from '@shared/directives/registry-required.directive'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { InputText } from 'primeng/inputtext'
import { Divider } from 'primeng/divider'
import { ProjectOptionIconPipe } from '@shared/helpers/pipe/project-option-icon.pipe'
import { Message } from 'primeng/message'
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe'
import { ProgressSpinner } from 'primeng/progressspinner'
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe'
import { FormIconPipe } from '@shared/helpers/pipe/form-icon.pipe'

/**
 * Purpose: Page with the form to create or edit a project.
 * Scope: Builds the form, submits it through the facade and navigates back.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component( {
    selector: 'app-project-form',
    imports: [
        Stepper,
        StepItem,
        Step,
        StepPanel,
        Button,
        TranslocoPipe,
        PluralTranslationPipe,
        FormField,
        FieldErrorComponent,
        DateTimeFieldComponent,
        RegistryRequiredDirective,
        DateFormatPipe,
        InputText,
        Checkbox,
        Divider,
        ProjectOptionIconPipe,
        Message,
        FormButtonPipe,
        ProgressSpinner,
        FormTitlePipe,
        FormIconPipe,
    ],
    templateUrl: './project-form.page.html',
    styleUrl: './project-form.page.css',
} )
export class ProjectFormPage extends BaseFormComponent implements OnDestroy {
    protected readonly facade: ProjectFacade = inject( ProjectFacade )

    protected readonly availableOptions: WritableSignal<ProjectOptionModel[]> = signal( [] )
    protected readonly model: WritableSignal<ProjectFormModel> = signal( toProjectFormModel() )
    protected readonly form: FieldTree<ProjectFormModel> = createProjectForm( this.model )
    protected readonly optionsModel: WritableSignal<ProjectOptionsFormModel> = signal( {} )
    protected readonly optionsForm: FieldTree<ProjectOptionsFormModel> = createProjectOptionsForm( this.optionsModel, this.availableOptions )
    protected readonly allSelected: Signal<boolean | undefined> = computed( (): boolean | undefined => selectedOptionsState( this.optionsModel() ) )
    protected readonly allSelectedModel: WritableSignal<boolean> = linkedSignal( (): boolean => this.allSelected() === true )
    protected readonly allSelectedForm: FieldTree<boolean> = form( this.allSelectedModel )
    protected readonly nextNavigation: RegistryRouteEnum = RegistryRouteEnum.PROJECTS
    protected readonly activeTab: ModelSignal<number> = model<number>( 1 )

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
            ? this.facade.updateProject( this.facade.project()!.id!, dto )
            : this.facade.createProject( dto )

        this.subscriptions.add(
            observable.pipe(
                tap( (): void => this.navigateAfterSave() ),
            ).subscribe(),
        )
    }

    private navigateAfterSave (): void {
        const createdProjectId: string | undefined = this.facade.createdProjectId()
        const isCreation: boolean = GenericHelper.isNull( this.facade.project() )

        this.navigateToRedirectUri(
            isCreation && GenericHelper.nonNull( createdProjectId )
            ? RegistryRouteEnum.PROJECT.replace( ':projectId', createdProjectId! ) as RegistryRouteEnum
            : undefined,
        )
    }

    protected selectAll ( event: CheckboxChangeEvent ): void {
        this.optionsModel.update( (options: ProjectOptionsFormModel): ProjectOptionsFormModel => withAllOptions( options, event.checked ) )
    }

    protected get idParam (): string | undefined {
        return this.route.snapshot.params['projectId']
    }
}
