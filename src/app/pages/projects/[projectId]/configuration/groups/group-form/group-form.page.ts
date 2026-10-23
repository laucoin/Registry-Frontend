import { Component, inject, OnDestroy, signal, WritableSignal } from '@angular/core'
import { GroupModel } from '@shared/models/model/group.model'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { FormHelper } from '@shared/helpers/form.helper'
import { RegistryValidators } from '@shared/helpers/registry.validator'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { GroupDto } from '@pages/projects/[projectId]/configuration/groups/data/dto/group.dto'
import { Button } from 'primeng/button'
import { Card } from 'primeng/card'
import { FormComponent } from '@shared/ui/common/form/form.component'
import { FormFieldErrorComponent } from '@shared/ui/common/form-field-error/form-field-error.component'
import { RegistryRequiredDirective } from '@shared/directives/registry-required.directive'
import { TranslatePipe } from '@ngx-translate/core'
import { InputText } from 'primeng/inputtext'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { Divider } from 'primeng/divider'
import {
    SelectElementsFieldComponent,
} from '@shared/ui/common/select-elements-field/select-elements-field.component'
import { ParticipantHelper } from '@shared/helpers/participant.helper'
import { ProjectModel } from '@shared/models/model/project.model'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { GenericFormComponent } from '@shared/ui/base/generic-form.component'
import { withLoading } from '@shared/helpers/rx.helper'
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe'
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { DateTimeFieldComponent } from '@shared/ui/common/date-time-field/date-time-field.component'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { FormIconPipe } from '@shared/helpers/pipe/form-icon.pipe'

@Component( {
    selector: 'app-group-form',
    imports: [
        Button,
        Card,
        FormComponent,
        FormFieldErrorComponent,
        RegistryRequiredDirective,
        TranslatePipe,
        InputText,
        ReactiveFormsModule,
        Divider,
        SelectElementsFieldComponent,
        DateFormatPipe,
        FormTitlePipe,
        FormButtonPipe,
        PluralTranslationPipe,
        DateTimeFieldComponent,
        FormIconPipe,

    ],
    templateUrl: './group-form.page.html',
} )
export class GroupFormPage extends GenericFormComponent<GroupModel, GroupDto> implements OnDestroy {
    protected readonly facade: GroupFacade = inject( GroupFacade )

    protected readonly ParticipantHelper: typeof ParticipantHelper = ParticipantHelper

    protected readonly form: FormGroup
    protected readonly group: WritableSignal<GroupModel | undefined> = signal( undefined )

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()

        this.handleLoadedElement()
    }

    protected override loadData (): void {
        if (GenericHelper.nonNull( this.idParam )) {
            this.subscriptions.add(
                this.facade.fetchGroup( this.idParam! ).pipe(
                    withLoading( this.loading ),
                ).subscribe( (group: GroupModel): void => {
                    this.group.set( group )
                    this.applyGroup( group )
                } ),
            )
        }
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            name: this.formBuilder.control(
                undefined,
                [ Validators.required, Validators.maxLength( 150 ), RegistryValidators.nonBlank() ],
            ),
            beginDateTime: this.formBuilder.control( undefined, [ RegistryValidators.dateRequiredForTime() ] ),
            endDateTime: this.formBuilder.control( undefined, [ RegistryValidators.dateRequiredForTime() ] ),
            participants: this.formBuilder.control( [], [ Validators.required ] ),
        }, {
            validators: [ RegistryValidators.beginDateBeforeEndDate( 'beginDateTime', 'endDateTime' ) ],
        } )
    }

    protected handleLoadedElement (): void {
        if (!GenericHelper.nonNull( this.idParam )) {
            this.applyGroup( undefined )
        }
    }

    private applyGroup (group: GroupModel | undefined): void {
        const contextProject: ProjectModel | undefined = group?.project || this.registryFacade.selectedProject()
        this.addProjectDateValidators( contextProject, this.beginDateTime )
        this.addProjectDateValidators( contextProject, this.endDateTime )
        this.fillForm( group )
    }

    protected fillForm (element: GroupModel | undefined): void {
        if (!element) return

        this.name.patchValue( element.name )
        this.beginDateTime.patchValue( element.startAvailability )
        this.endDateTime.patchValue( element.endAvailability )
        this.participants.patchValue( element.members )
    }

    protected submit (): void {
        if (this.saving() || this.loading()) return

        const editing: boolean = GenericHelper.nonNull( this.idParam )
        if (editing && !this.group()) return

        if (!FormHelper.isFormValid( this.form )) {
            this.logInvalidForm( this.form.value )
            return
        }

        const dto: GroupDto = this.buildDto()
        this.save( editing ? this.facade.updateGroup( this.group()!.id, dto ) : this.facade.createGroup( dto ) )
    }

    protected buildDto (): GroupDto {
        return {
            name: this.name.value,
            startAvailability: this.beginDateTime.value,
            endAvailability: this.endDateTime.value,
            members: (this.participants.value ?? []).map( (item: ParticipantModel): string => item.id ),
        }
    }

    protected handleSearch (searched: string | undefined): void {
        this.facade.searchParticipants( searched )
    }

    protected get idParam (): string | undefined {
        return this.route.snapshot.params['groupId']
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
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

    protected get participants (): FormControl {
        return this.form.get( 'participants' ) as FormControl
    }
}
