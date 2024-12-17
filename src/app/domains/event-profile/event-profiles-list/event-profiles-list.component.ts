import { Component, OnInit } from '@angular/core'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'
import { EventProfileModel } from '../../../shared/util-model/model/event-profile.model'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { OrderEnum } from '../../../shared/util-model/enumeration/order.enum'
import { EventProfileFacade } from '../data/state/event-profile.facade'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { TranslateModule } from '@ngx-translate/core'
import { InputTextModule } from 'primeng/inputtext'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { AsyncPipe, NgIf } from '@angular/common'
import {
    EventProfileElementComponent,
} from '../../../shared/util-ui/event-profile-element/event-profile-element.component'
import { RouterLink } from '@angular/router'
import { ProfileStatusEnum } from '../../../shared/util-model/enumeration/profile-status.enum'
import { DropdownModule } from 'primeng/dropdown'
import { ConfirmationService } from 'primeng/api'
import { EventModel } from '../../../shared/util-model/model/event.model'
import { EventProfileRoutesEnum } from '../event-profile-routes.enum'
import { Select } from 'primeng/select'
import { Button } from 'primeng/button'
import { DatePicker } from 'primeng/datepicker'

@Component( {
    selector: 'app-event-profiles-list',
    standalone: true,
    templateUrl: './event-profiles-list.component.html',
    styleUrl: './event-profiles-list.component.scss',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        ReactiveFormsModule,
        TranslateModule,
        InputTextModule,
        ToggleButtonModule,
        AsyncPipe,
        EventProfileElementComponent,
        DropdownModule,
        RouterLink,
        NgIf,
        Select,
        Button,
        DatePicker,

    ],
} )
export class EventProfilesListComponent extends GenericListComponent<EventProfileModel> implements OnInit {
    protected readonly EventProfileRoutesEnum: typeof EventProfileRoutesEnum = EventProfileRoutesEnum
    protected statusMetadata: { label: string, value: ProfileStatusEnum }[] = [
        { label: this.translateService.instant( 'profile.status.ACCEPTED' ), value: ProfileStatusEnum.ACCEPTED },
        { label: this.translateService.instant( 'profile.status.REJECTED' ), value: ProfileStatusEnum.REJECTED },
        { label: this.translateService.instant( 'profile.status.INVITED' ), value: ProfileStatusEnum.INVITED },
    ]

    public constructor (
        private readonly facade: EventProfileFacade,
        private readonly confirmationService: ConfirmationService,
    ) {
        super(
            facade.page,
            facade.pageLoading,
            facade.pageSilentLoading,
            facade.pageError,
        )

        this.changeEmptyMessageTranslationKey( 'EMPTY_EVENT_PROFILE' )

        this.form = this.initForm()

        this.handleSearchedChanges()
        this.handleRangeChanges()
        this.handleStatusChanges()
        this.handleOnlyVisibleChanges()
        this.handleOrderChanges()
    }

    public ngOnInit (): void {
        this.facade.fetchElementPage( undefined, undefined, false, this.contextEventId() )
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            searched: this.formBuilder.control( this.facade.actualPageSearched ),
            range: this.formBuilder.control( this.facade.actualPageDateRange ),
            status: this.formBuilder.control( this.facade.actualPageStatus ),
            onlyVisible: this.formBuilder.control( this.facade.actualPageOnlyVisible ),
            order: this.formBuilder.control( this.facade.actualPageOrder === OrderEnum.ASC ),
        } )
    }

    protected loadPage (pageEvent: PageEventModel, eventId: string | undefined): void {
        this.facade.fetchElementPage( pageEvent.offset, pageEvent.limit, false, eventId )
    }

    protected confirmSupportProfileCreation (event: EventModel): void {
        this.confirmationService.confirm( {
            header: this.translateService.instant( `profile.action.confirmation.title.create-support` ),
            message: this.translateService.instant(
                `profile.action.confirmation.message.create-support`,
                { element: event },
            ),
            icon: 'pi pi-question-circle',
            acceptLabel: this.translateService.instant( 'confirmation.confirm' ),
            rejectLabel: this.translateService.instant( 'confirmation.cancel' ),
            acceptButtonStyleClass: 'p-button p-button-rounded p-button-outlined p-button-info',
            rejectButtonStyleClass: 'p-button p-button-rounded p-button-text p-button-secondary',
            accept: (): void => this.facade.createSupportEventProfile( event.id ),
        } )
    }

    private handleSearchedChanges (): void {
        this.subscriptions.add(
            this.searched.valueChanges.subscribe( (searched: string | undefined): void =>
                this.facade.inputPageSearch( searched ),
            ),
        )
    }

    private handleRangeChanges (): void {
        this.subscriptions.add(
            this.range.valueChanges.subscribe( (range: Date[] | undefined): void =>
                this.facade.inputPageDateRange( range ),
            ),
        )
    }

    private handleStatusChanges (): void {
        this.subscriptions.add(
            this.status.valueChanges.subscribe( (status: ProfileStatusEnum | undefined): void => {
                this.facade.selectPageStatus( status )
            } ),
        )
    }

    private handleOnlyVisibleChanges (): void {
        this.subscriptions.add(
            this.onlyVisible.valueChanges.subscribe( (onlyVisible: boolean | undefined): void => {
                if (onlyVisible != undefined) {
                    this.facade.selectPageVisibility( onlyVisible )
                }
            } ),
        )
    }

    private handleOrderChanges (): void {
        this.subscriptions.add(
            this.order.valueChanges.subscribe( (order: boolean | undefined): void => {
                if (order != undefined) {
                    this.facade.selectPageOrder( order ? OrderEnum.ASC : OrderEnum.DESC )
                }
            } ),
        )
    }

    protected get searched (): FormControl {
        return this.form.get( 'searched' ) as FormControl
    }

    protected get range (): FormControl {
        return this.form.get( 'range' ) as FormControl
    }

    protected get status (): FormControl {
        return this.form.get( 'status' ) as FormControl
    }

    protected get onlyVisible (): FormControl {
        return this.form.get( 'onlyVisible' ) as FormControl
    }

    protected get order (): FormControl {
        return this.form.get( 'order' ) as FormControl
    }
}
