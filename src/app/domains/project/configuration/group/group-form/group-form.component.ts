import { Component, inject, OnDestroy } from '@angular/core'
import { GroupModel } from '../../../../../shared/util-model/model/group.model'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { FormUtil } from '../../../../../shared/util-tool/util/form.util'
import { RegistryValidators } from '../../../../../shared/util-tool/util/registry.validator'
import { GroupFacade } from '../data/state/group.facade'
import { GroupDto } from '../data/dto/group.dto'
import { Button } from 'primeng/button'
import { Card } from 'primeng/card'
import { FormComponent } from '../../../../../shared/util-ui/form/form.component'
import { FormFieldErrorComponent } from '../../../../../shared/util-ui/form-field-error/form-field-error.component'
import { RegistryRequiredDirective } from '../../../../../shared/util-tool/directive/registry-required.directive'
import { TranslatePipe } from '@ngx-translate/core'
import { InputText } from 'primeng/inputtext'
import { ParticipantModel } from '../../../../../shared/util-model/model/participant.model'
import { Divider } from 'primeng/divider'
import {
    SelectElementsFieldComponent,
} from '../../../../../shared/util-ui/select-elements-field/select-elements-field.component'
import { ParticipantUtil } from '../../../../../shared/util-tool/util/participant.util'
import { ProjectModel } from '../../../../../shared/util-model/model/project.model'
import { DateFormatPipe } from '../../../../../shared/util-tool/pipe/date-format.pipe'
import { GenericFormComponent } from '../../../../../shared/util-tool/component/generic-form.component'
import { map, Observable } from 'rxjs'
import { CreateGroup, UpdateGroup } from '../data/state/group.action'
import { FormTitlePipe } from '../../../../../shared/util-tool/pipe/form-title.pipe'
import { FormButtonPipe } from '../../../../../shared/util-tool/pipe/form-button.pipe'
import { PluralTranslationPipe } from '../../../../../shared/util-tool/pipe/plural-translation.pipe'
import { DateTimeFieldComponent } from '../../../../../shared/util-ui/date-time-field/date-time-field.component'
import { GenericUtil } from '../../../../../shared/util-tool/util/generic.util'
import { FormIconPipe } from '../../../../../shared/util-tool/pipe/form-icon.pipe'

@Component( {
    selector: 'app-group-form',
    standalone: true,
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
    templateUrl: './group-form.component.html',
} )
export class GroupFormComponent extends GenericFormComponent<GroupModel, GroupDto> implements OnDestroy {
    protected readonly facade: GroupFacade = inject( GroupFacade )

    protected readonly ParticipantUtil: typeof ParticipantUtil = ParticipantUtil

    protected readonly form: FormGroup

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()

        this.handleLoadedElement()
    }

    protected override loadData (): void {
        this.facade.resetGroup()

        if (GenericUtil.nonNull( this.idParam )) {
            this.facade.fetchGroup( this.idParam! )
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
        this.subscriptions.add(
            this.facade.group$.pipe(
                map( (group: GroupModel | undefined): void => {
                    const contextProject: ProjectModel | undefined = group?.project || this.registryFacade.selectedProject()
                    this.addProjectDateValidators( contextProject, this.beginDateTime )
                    this.addProjectDateValidators( contextProject, this.endDateTime )
                    this.fillForm( group )
                } ),
            ).subscribe(),
        )
    }

    protected fillForm (element: GroupModel | undefined): void {
        if (!element) return

        this.name.patchValue( element.name )
        this.beginDateTime.patchValue( element.startAvailability )
        this.endDateTime.patchValue( element.endAvailability )
        this.participants.patchValue( element.members )
    }

    protected submit (): void {
        if (!FormUtil.isFormValid( this.form )) {
            console.warn( this.invalidFormMessage, this.form.value )
            return
        }

        const dto: GroupDto = this.buildDto()
        const observable: Observable<CreateGroup | UpdateGroup> =
            this.facade.group()
            ? this.facade.updateGroup( this.facade.group()!.id!, dto )
            : this.facade.createGroup( dto )

        this.subscriptions.add(
            observable.pipe(
                map( (): void => this.navigateToRedirectUri() ),
            ).subscribe(),
        )
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
