import { Component, inject, OnDestroy } from '@angular/core'
import { GenericFormComponent } from '@shared/ui/base/generic-form.component'
import { ProjectModel } from '@shared/models/model/project.model'
import { ProjectDto } from '@pages/projects/data/dto/project.dto'
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { RegistryValidators } from '@shared/helpers/registry.validator'
import { combineLatest, filter, map, Observable, tap } from 'rxjs'
import { ProjectOptionModel } from '@pages/projects/data/model/project-option.model'
import { ArrayHelper } from '@shared/helpers/array.helper'
import { SelectItem } from 'primeng/api'
import { FormHelper } from '@shared/helpers/form.helper'
import { UpdateProject } from '@pages/projects/data/state/project/project.action'
import { Checkbox, CheckboxChangeEvent } from 'primeng/checkbox'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { Step, StepItem, StepPanel, Stepper } from 'primeng/stepper'
import { Button } from 'primeng/button'
import { TranslatePipe } from '@ngx-translate/core'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { FormFieldErrorComponent } from '@shared/ui/form-field-error/form-field-error.component'
import { DateTimeFieldComponent } from '@shared/ui/date-time-field/date-time-field.component'
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
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { FetchCurrentUser } from '@core/registry/state/registry.action'

@Component( {
    selector: 'app-project-form',
    imports: [
        Stepper,
        StepItem,
        Step,
        StepPanel,
        Button,
        TranslatePipe,
        PluralTranslationPipe,
        ReactiveFormsModule,
        FormFieldErrorComponent,
        DateTimeFieldComponent,
        RegistryRequiredDirective,
        DateFormatPipe,
        InputText,
        Checkbox,
        Divider,
        ProjectOptionIconPipe,
        Message,
        FormsModule,
        FormButtonPipe,
        ProgressSpinner,
        FormTitlePipe,
        FormIconPipe,
    ],
    templateUrl: './project-form.page.html',
    styleUrl: './project-form.page.scss',
} )
export class ProjectFormPage extends GenericFormComponent<ProjectModel, ProjectDto> implements OnDestroy {
    protected readonly facade: ProjectFacade = inject( ProjectFacade )

    protected readonly form: FormGroup
    protected readonly optionsForm: FormGroup = this.formBuilder.group( {} )
    protected readonly nextNavigation: RegistryRouteEnum = RegistryRouteEnum.PROJECTS
    protected allSelected: boolean | undefined = false
    protected activeTab: number = 1

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()

        this.handleLoadedElement()
        this.handleOptionsChange()
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

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            name: this.formBuilder.control(
                undefined,
                [ Validators.required, RegistryValidators.nonBlank(), Validators.maxLength( 150 ) ],
            ),
            beginDateTime: this.formBuilder.control( undefined, [ RegistryValidators.dateRequiredForTime() ] ),
            endDateTime: this.formBuilder.control( undefined, [ RegistryValidators.dateRequiredForTime() ] ),
        }, {
            validators: [ RegistryValidators.beginDateBeforeEndDate( 'beginDateTime', 'endDateTime' ) ],
        } )
    }

    protected handleLoadedElement (): void {
        this.subscriptions.add(
            combineLatest( [ this.facade.project$, this.facade.projectOptionsMetadata$ ] ).pipe(
                filter( ([ , options ]: [ ProjectModel | undefined, ProjectOptionModel[] ]): boolean =>
                    !ArrayHelper.isNullOrEmpty( options ),
                ),
                map( ([ project, options ]: [ ProjectModel | undefined, ProjectOptionModel[] ]): void => {
                    this.addOptionsFieldIfNeeded( options )
                    this.fillForm( project )
                } ),
            ).subscribe(),
        )
    }

    private addOptionsFieldIfNeeded (options: ProjectOptionModel[]): void {
        options.forEach( (option: ProjectOptionModel): void => {
            if (this.optionsForm.get( option.value )) return
            this.optionsForm.addControl( option.value, this.formBuilder.control( false ) )
        } )
        this.optionsForm.addValidators( RegistryValidators.preRequiredOptions( options ) )
    }

    private handleOptionsChange (): void {
        this.subscriptions.add(
            this.optionsForm.valueChanges.pipe(
                tap( (options: object): void => {
                    const selectableOptions: boolean[] = Object.values( options )
                    const selectedOptions: number = selectableOptions.filter( (active: boolean): boolean => active ).length
                    this.allSelected = selectedOptions === 0 ? false : selectedOptions === selectableOptions.length ? true : undefined
                } ),
            ).subscribe(),
        )
    }

    protected fillForm (element: ProjectModel | undefined): void {
        if (!element) return

        this.name.patchValue( element.name )
        this.beginDateTime.patchValue( element.begin )
        this.endDateTime.patchValue( element.end )
        element.options?.forEach( (option: SelectItem<ProjectOptionEnum>): void =>
            this.getOptionControl( option.value ).patchValue( true ),
        )
    }

    protected submit (): void {
        if (!FormHelper.isFormValid( this.form ) || !FormHelper.isFormValid( this.optionsForm )) {
            this.logInvalidForm( {
                ...this.form.value,
                ...this.optionsForm.value,
            } )
            return
        }

        const dto: ProjectDto = this.buildDto()
        const observable: Observable<FetchCurrentUser | UpdateProject> =
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

    protected buildDto (): ProjectDto {
        const optionIds: string[] = Object
            .keys( this.optionsForm.controls )
            .filter( (key: string): boolean => this.getOptionControl( key as string ).value )
            .map( (key: string): string => key as string )

        return {
            name: this.name.value,
            begin: this.beginDateTime.value,
            end: this.endDateTime.value,
            options: optionIds,
        }
    }

    protected selectAll (project: CheckboxChangeEvent): void {
        this.facade.projectOptionsMetadata()?.forEach( (option: SelectItem<ProjectOptionEnum>): void => {
            this.getOptionControl( option.value ).patchValue( project.checked )
        } )
    }

    protected get idParam (): string | undefined {
        return this.route.snapshot.params['projectId']
    }

    protected get name (): FormControl {
        return this.form.get( 'name' ) as FormControl
    }

    protected get beginDateTime (): FormControl {
        return this.form.get( 'beginDateTime' ) as FormControl
    }

    protected get endDateTime (): FormControl {
        return this.form.get( 'endDateTime' ) as FormControl
    }

    protected getOptionControl (option: string): FormControl {
        return this.optionsForm.get( option ) as FormControl
    }
}
