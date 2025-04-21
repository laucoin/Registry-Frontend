import { Component, inject, input, InputSignal, OnDestroy, signal, WritableSignal } from '@angular/core'
import { AppRouteEnum } from '../../../app-route.enum'
import { ParticipantFacade } from '../data/state/participant.facade'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { RegistryValidators } from '../../../shared/util-tool/util/registry.validator'
import { ParticipantDto } from '../data/dto/participant.dto'
import { Button } from 'primeng/button'
import { CardModule } from 'primeng/card'
import { DividerModule } from 'primeng/divider'
import { FormComponent } from '../../../shared/util-ui/form/form.component'
import { FormFieldErrorComponent } from '../../../shared/util-ui/form-field-error/form-field-error.component'
import { InputTextModule } from 'primeng/inputtext'
import { TranslateModule } from '@ngx-translate/core'
import { FormUtil } from '../../../shared/util-tool/util/form.util'
import { ParticipantModel } from '../../../shared/util-model/model/participant.model'
import { UserDto } from '../../../shared/util-model/dto/user.dto'
import { DateUtil } from '../../../shared/util-tool/util/date.util'
import { RegistryRequiredDirective } from '../../../shared/util-tool/directive/registry-required.directive'
import { DatePicker } from 'primeng/datepicker'
import { AutoComplete, AutoCompleteCompleteEvent } from 'primeng/autocomplete'
import { SelectItem } from 'primeng/api'
import { UserUtil } from '../../../shared/util-tool/util/user.util'
import { GroupModel } from '../../../shared/util-model/model/group.model'
import {
    SelectElementsFieldComponent,
} from '../../../shared/util-ui/select-elements-field/select-elements-field.component'
import { GroupUtil } from '../../../shared/util-tool/util/group.util'
import { EventModel } from '../../../shared/util-model/model/event.model'
import { DateFormatPipe } from '../../../shared/util-tool/pipe/date-format.pipe'
import { GenericFormComponent } from '../../../shared/util-tool/component/generic-form.component'
import { map, Observable } from 'rxjs'
import { CreateParticipant, UpdateParticipant } from '../data/state/participant.action'
import { GenericUtil } from '../../../shared/util-tool/util/generic.util'
import { FormTitlePipe } from '../../../shared/util-tool/pipe/form-title.pipe'
import { FormButtonPipe } from '../../../shared/util-tool/pipe/form-button.pipe'
import { DateTimeFieldComponent } from '../../../shared/util-ui/date-time-field/date-time-field.component'
import { PluralTranslationPipe } from '../../../shared/util-tool/pipe/plural-translation.pipe'
import { FormIconPipe } from '../../../shared/util-tool/pipe/form-icon.pipe'

@Component( {
    selector: 'app-participant-form',
    standalone: true,
    imports: [
        Button,
        CardModule,
        DividerModule,
        FormComponent,
        FormFieldErrorComponent,
        FormsModule,
        InputTextModule,
        TranslateModule,
        ReactiveFormsModule,
        RegistryRequiredDirective,
        DatePicker,
        AutoComplete,
        SelectElementsFieldComponent,
        DateFormatPipe,
        FormTitlePipe,
        FormButtonPipe,
        DateTimeFieldComponent,
        PluralTranslationPipe,
        FormIconPipe,
    ],
    templateUrl: './participant-form.component.html',
} )
export class ParticipantFormComponent extends GenericFormComponent<ParticipantModel, ParticipantDto> implements OnDestroy {
    protected readonly facade: ParticipantFacade = inject( ParticipantFacade )

    protected readonly GroupUtil: typeof GroupUtil = GroupUtil

    protected readonly form: FormGroup

    public readonly redirect: InputSignal<boolean> = input( true )
    public readonly showTitle: InputSignal<boolean> = input( true )
    public readonly defaultGroup: InputSignal<GroupModel | undefined> = input()

    protected readonly selectedUser: WritableSignal<SelectItem<UserDto> | undefined> = signal( undefined )
    protected readonly previousFirstName: WritableSignal<string | undefined> = signal( undefined )
    protected readonly previousLastName: WritableSignal<string | undefined> = signal( undefined )

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()

        this.handleLoadedElement()
    }

    protected override loadData (): void {
        this.facade.resetParticipant()

        if (GenericUtil.nonNull( this.idParam )) {
            this.facade.fetchParticipant( this.idParam! )
        }
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            firstName: this.formBuilder.control(
                undefined,
                [ Validators.required, Validators.maxLength( 150 ), RegistryValidators.nonBlank() ],
            ),
            lastName: this.formBuilder.control(
                undefined,
                [ Validators.required, Validators.maxLength( 150 ), RegistryValidators.nonBlank() ],
            ),
            birthday: this.formBuilder.control(
                undefined,
                [
                    Validators.required, RegistryValidators.maxDateTime(
                    DateUtil.toCustomDateTime( new Date() )!,
                    undefined,
                ),
                ],
            ),
            user: this.formBuilder.control( undefined ),
            groups: this.formBuilder.control( undefined ),
            beginDateTime: this.formBuilder.control( undefined, [ RegistryValidators.dateRequiredForTime() ] ),
            endDateTime: this.formBuilder.control( undefined, [ RegistryValidators.dateRequiredForTime() ] ),
        }, {
            validators: [ RegistryValidators.beginDateBeforeEndDate( 'beginDateTime', 'endDateTime' ) ],
        } )
    }

    protected handleLoadedElement (): void {
        this.subscriptions.add(
            this.facade.participant$.pipe(
                map( (participant: ParticipantModel | undefined): void => {
                    const contextEvent: EventModel | undefined = participant?.event || this.registryFacade.selectedEvent()
                    this.addEventDateValidators( contextEvent, this.beginDateTime )
                    this.addEventDateValidators( contextEvent, this.endDateTime )
                    this.fillForm( participant )
                } ),
            ).subscribe(),
        )
    }

    protected fillForm (element: ParticipantModel | undefined): void {
        if (!element) return

        this.firstName.patchValue( element?.firstName )
        this.lastName.patchValue( element?.lastName )
        this.birthday.patchValue( element?.birthday ? new Date( element?.birthday ) : undefined )
        if (element?.user) {
            const user: SelectItem<UserDto> = UserUtil.toSelectItem( element.user )
            this.user.patchValue( user )
            this.handleUserSelection( user )
        }
        this.groups.patchValue( element?.groups )
        this.beginDateTime.patchValue( element?.startAvailability )
        this.endDateTime.patchValue( element?.endAvailability )
    }

    protected submit (): void {
        if (!FormUtil.isFormValid( this.form )) {
            console.warn( this.invalidFormMessage, this.form.value )
            return
        }

        const dto: ParticipantDto = this.buildDto()
        const observable: Observable<CreateParticipant | UpdateParticipant> =
            this.facade.participant()
            ? this.facade.updateParticipant( this.facade.participant()!.id!, dto )
            : this.facade.createParticipant( dto )

        if (this.redirect()) {
            this.subscriptions.add(
                observable.pipe(
                    map( (): void => this.navigateToRedirectUri( AppRouteEnum.PARTICIPANTS ) ),
                ).subscribe(),
            )
        }
    }

    protected buildDto (): ParticipantDto {
        const groupIds: string[] = (this.groups.value ?? []).map( (item: GroupModel): string => item.id )
        if (this.defaultGroup() && !groupIds.includes( this.defaultGroup()!.id )) {
            groupIds.push( this.defaultGroup()!.id )
        }
        return {
            firstName: this.firstName.value,
            lastName: this.lastName.value,
            birthday: DateUtil.getDate( this.birthday.value ),
            userId: this.selectedUser()?.value.id,
            groupIds: groupIds,
            startAvailability: this.beginDateTime.value,
            endAvailability: this.endDateTime.value,
        }
    }

    protected handleUserSearch (searched: AutoCompleteCompleteEvent): void {
        this.facade.searchUsers( searched.query )
    }

    protected handleGroupSearch (searched: AutoCompleteCompleteEvent): void {
        this.facade.searchGroups( searched.query )
    }

    protected handleUserSelection (selectedUser: SelectItem<UserDto> | undefined): void {
        this.selectedUser.set( selectedUser )

        const user: UserDto | undefined = this.selectedUser()?.value
        if (GenericUtil.nonNull( user )) {
            if (user!.firstName) {
                this.previousFirstName.set( this.firstName.value )
                this.firstName.patchValue( user!.firstName )
                this.firstName.disable()
            }
            if (user!.lastName) {
                this.previousLastName.set( this.lastName.value )
                this.lastName.patchValue( user!.lastName )
                this.lastName.disable()
            }
        } else {
            this.firstName.enable()
            this.firstName.patchValue( this.previousFirstName() )
            this.lastName.enable()
            this.lastName.patchValue( this.previousLastName() )
        }
    }

    protected get idParam (): string | undefined {
        return this.route.snapshot.params['participantId']
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected get user (): FormControl {
        return this.form.get( 'user' ) as FormControl
    }

    protected get firstName (): FormControl {
        return this.form.get( 'firstName' ) as FormControl
    }

    protected get lastName (): FormControl {
        return this.form.get( 'lastName' ) as FormControl
    }

    protected get birthday (): FormControl {
        return this.form.get( 'birthday' ) as FormControl
    }

    protected get beginDateTime (): FormControl {
        return this.form.get( 'beginDateTime' ) as FormControl
    }

    protected get endDateTime (): FormControl {
        return this.form.get( 'endDateTime' ) as FormControl
    }

    protected get groups (): FormControl {
        return this.form.get( 'groups' ) as FormControl
    }
}
