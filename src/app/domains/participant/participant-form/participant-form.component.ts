import { Component, Input, OnChanges, signal, WritableSignal } from '@angular/core'
import { GenericFormComponent } from '../../../shared/util-tool/component/generic-form.component'
import { AppRouteEnum } from '../../../app-route.enum'
import { ParticipantFacade } from '../data/state/participant.facade'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { CustomValidators } from '../../../shared/util-tool/util/custom-validator'
import { ParticipantDto } from '../data/dto/participant.dto'
import { AsyncPipe, DatePipe } from '@angular/common'
import { Button } from 'primeng/button'
import { CardModule } from 'primeng/card'
import { DividerModule } from 'primeng/divider'
import { FormComponent } from '../../../shared/util-ui/form/form.component'
import { FormFieldErrorComponent } from '../../../shared/util-ui/form-field-error/form-field-error.component'
import { InputTextModule } from 'primeng/inputtext'
import { TranslateModule } from '@ngx-translate/core'
import { Params } from '@angular/router'
import { GenericUtil } from '../../../shared/util-tool/util/generic.util'
import { FormUtil } from '../../../shared/util-tool/util/form.util'
import { ParticipantModel } from '../../../shared/util-model/model/participant.model'
import { UserDto } from '../../../shared/util-model/dto/user.dto'
import { DateUtil } from '../../../shared/util-tool/util/date.util'
import { RegistryRequiredDirective } from '../../../shared/util-tool/directive/registry-required.directive'
import { DatePicker } from 'primeng/datepicker'
import { AutoComplete, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete'
import { Observable } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { UserUtil } from '../../../shared/util-tool/util/user.util'
import { GroupModel } from '../../../shared/util-model/model/group.model'
import {
    SelectElementsFieldComponent,
} from '../../../shared/util-ui/select-elements-field/select-elements-field.component'
import { GroupUtil } from '../../../shared/util-tool/util/group.util'
import { StringUtils } from '../../../shared/util-tool/util/string.util'
import { UserModel } from '../../../shared/util-model/model/user.model'
import { EventModel } from '../../../shared/util-model/model/event.model'

@Component( {
    selector: 'app-participant-form',
    standalone: true,
    imports: [
        AsyncPipe,
        Button,
        CardModule,
        DatePipe,
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
    ],
    templateUrl: './participant-form.component.html',
} )
export class ParticipantFormComponent extends GenericFormComponent implements OnChanges {
    @Input() public showTitle: boolean = true
    @Input() public defaultGroup: GroupModel | undefined
    protected readonly participant: WritableSignal<ParticipantModel | undefined> = signal( undefined )

    protected readonly groupsSuggestion$: Observable<SelectItem<GroupModel>[]>
    protected readonly usersSuggestion$: Observable<SelectItem<UserDto>[]>
    protected selectedUser: WritableSignal<SelectItem<UserDto> | undefined> = signal( undefined )

    protected previousFirstName: WritableSignal<string | undefined> = signal( undefined )
    protected previousLastName: WritableSignal<string | undefined> = signal( undefined )

    public constructor (
        protected readonly facade: ParticipantFacade,
        private readonly datePipe: DatePipe,
    ) {
        super(
            AppRouteEnum.PARTICIPANTS,
            facade.participantLoading,
        )

        facade.resetParticipant()

        this.handleContextEvent()
        this.handleIdParam()
        this.handleLoadedParticipant()
        this.handleUserDeselection()

        this.usersSuggestion$ = this.facade.searchedUsersMetadata
        this.groupsSuggestion$ = this.facade.searchedGroupsMetadata
    }

    public ngOnChanges (): void {
        if (this.defaultGroup) {
            this.groups.patchValue( [ GroupUtil.toSelectItem( this.defaultGroup ) ] )
        }
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            firstName: this.formBuilder.control(
                undefined,
                [ Validators.required, Validators.max( 150 ), CustomValidators.nonBlank() ],
            ),
            lastName: this.formBuilder.control(
                undefined,
                [ Validators.required, Validators.max( 150 ), CustomValidators.nonBlank() ],
            ),
            birthday: this.formBuilder.control(
                undefined,
                [ Validators.required, CustomValidators.maxDate( new Date(), undefined ) ],
            ),
            user: this.formBuilder.control( undefined ),
            groups: this.formBuilder.control( undefined ),
            presence: this.formBuilder.control( [] ),
        } )
    }

    private handleContextEvent (): void {
        this.subscriptions.add(
            this.contextEvent$.subscribe( (event: EventModel | undefined): void => {
                if (event?.begin) {
                    this.presence.addValidators( CustomValidators.minDate(
                        new Date( event?.begin ),
                        this.datePipe.transform(
                            new Date( event?.begin ),
                            this.translateService.instant( 'datetime.format.datetime' ),
                        )!,
                    ) )
                }
                if (event?.end) {
                    this.presence.addValidators( CustomValidators.maxDate(
                        new Date( event?.end ),
                        this.datePipe.transform(
                            new Date( event?.end ),
                            this.translateService.instant( 'datetime.format.datetime' ),
                        )!,
                    ) )
                }
            } ),
        )
    }

    private handleIdParam (): void {
        if (!StringUtils.isRouteActive( AppRouteEnum.PARTICIPANTS )) {
            return
        }
        this.subscriptions.add(
            this.route.params.subscribe( (params: Params): void => {
                if (GenericUtil.isNull( params['id'] )) {
                    this.router.navigateByUrl( this.buildUri( AppRouteEnum.PARTICIPANTS_CREATION ) ).catch( console.error )
                } else {
                    this.facade.fetchParticipant( params['id'], this.contextEventId() )
                }
            } ),
        )
    }

    private handleLoadedParticipant (): void {
        this.subscriptions.add(
            this.facade.participant?.subscribe( (participant: ParticipantModel | undefined): void => {
                this.participant.set( participant )
                if (!participant) return
                this.previousFirstName.set( participant.firstName )
                this.firstName.setValue( participant?.firstName )
                this.previousLastName.set( participant.lastName )
                this.lastName.setValue( participant?.lastName )
                this.birthday.setValue( participant?.birthday ? new Date( participant?.birthday ) : undefined )
                if (participant?.user?.id) {
                    const user: SelectItem<UserModel> = UserUtil.toSelectItem( participant.user )
                    this.selectedUser.set( user )
                    this.user.setValue( user )
                    this.manageFormFieldDependingUser( participant?.user )
                }
                this.groups.setValue( participant?.groups.map( GroupUtil.toSelectItem ) )
                this.presence.setValue( FormUtil.buildDateRange( participant?.begin, participant?.end ) )
                FormUtil.markAllControlsAsDirty( this.form )
            } ),
        )
    }

    protected next (): void {
        const participant: ParticipantDto = {
            firstName: this.firstName.value,
            lastName: this.lastName.value,
            birthday: DateUtil.getDate( this.birthday.value ),
            userId: this.selectedUser()?.value.id,
            groupIds: this.buildContent(),
            begin: this.presence.value?.[0],
            end: this.presence.value?.[1],
        }

        this.subscriptions.add(
            (
                this.participant() ?
                this.facade.updateParticipant( this.participant()!.id, participant, this.contextEventId() )
                                   : this.facade.createParticipant( participant, this.contextEventId() )
            ).subscribe( (): void => this.navigateToRedirectUri() ),
        )
    }

    private buildContent (): string[] {
        return (this.groups.value ?? []).map( (item: SelectItem<GroupModel>): string => item.value.id )
    }

    protected get exampleBeginDate (): Date {
        const now: Date = new Date()

        if (now.getMonth() > 6) {
            now.setFullYear( now.getFullYear() + 1 )
        }

        now.setMonth( 6, 20 )
        return now
    }

    protected get exampleEndDate (): Date {
        const now: Date = this.exampleBeginDate
        now.setMonth( 7, 2 )
        return now
    }

    protected handleUserSearch (searched: AutoCompleteCompleteEvent): void {
        this.facade.searchUsers( searched.query, this.contextEventId() )
    }

    protected onUserSelection (event: AutoCompleteSelectEvent): void {
        this.selectedUser.set( event.value )
        this.manageFormFieldDependingUser( event.value?.value )
    }

    private handleUserDeselection (): void {
        this.subscriptions.add(
            this.user.valueChanges.subscribe( (user: string | undefined): void => {
                if (!user) {
                    this.selectedUser.set( undefined )
                    this.manageFormFieldDependingUser( undefined )
                }
            } ),
        )
    }

    private manageFormFieldDependingUser (selectedUser: UserDto | undefined): void {
        if (selectedUser) {
            if (selectedUser.firstName) {
                this.firstName.setValue( selectedUser.firstName )
                this.firstName.disable()
            }
            if (selectedUser.lastName) {
                this.lastName.setValue( selectedUser.lastName )
                this.lastName.disable()
            }
        } else {
            this.firstName.enable()
            this.lastName.enable()
        }
    }

    protected handleGroupSearch (searched: AutoCompleteCompleteEvent): void {
        this.facade.searchGroups( searched.query, this.contextEventId() )
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

    protected get presence (): FormControl {
        return this.form.get( 'presence' ) as FormControl
    }

    protected get groups (): FormControl {
        return this.form.get( 'groups' ) as FormControl
    }
}
