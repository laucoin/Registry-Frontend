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
import { DropdownModule } from 'primeng/dropdown'
import { ConfirmationService, SelectItem } from 'primeng/api'
import { EventModel } from '../../../shared/util-model/model/event.model'
import { EventProfileRoutesEnum } from '../event-profile-routes.enum'
import { Select } from 'primeng/select'
import { Button } from 'primeng/button'
import { DatePicker } from 'primeng/datepicker'
import { MessageComponent } from '../../../shared/util-ui/message/message.component'
import { Observable } from 'rxjs'

@Component( {
    selector: 'app-event-profiles-list',
    standalone: true,
    templateUrl: './event-profiles-list.component.html',
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
        MessageComponent,
    ],
} )
export class EventProfilesListComponent extends GenericListComponent<EventProfileModel> implements OnInit {
    protected readonly EventProfileRoutesEnum: typeof EventProfileRoutesEnum = EventProfileRoutesEnum
    protected readonly statusMetadata$: Observable<SelectItem<string>[]>

    public constructor (
        private readonly facade: EventProfileFacade,
        private readonly confirmationService: ConfirmationService,
    ) {
        super(
            facade.eventProfilesPage,
            facade.eventProfilesPageLoading,
            facade.eventProfilesPageSilentLoading,
            facade.eventProfilesPageError,
        )

        this.changeEmptyMessageTranslationKey( 'EMPTY_EVENT_PROFILE' )

        this.form = this.initForm()
        this.statusMetadata$ = facade.eventProfilesStatusMetadata

        this.handleSearchedChanges()
        this.handleRangeChanges()
        this.handleStatusChanges()
        this.handleOnlyVisibleChanges()
        this.handleOrderChanges()
    }

    public ngOnInit (): void {
        this.facade.fetchAvailableStatus( this.contextEventId() )
        this.facade.fetchEventProfilesPage( undefined, undefined, false, this.contextEventId() )
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            searched: this.formBuilder.control( this.facade.actualEventProfilesPageSearchParam ),
            range: this.formBuilder.control( this.facade.actualEventProfilesPageDateRangeParam ),
            status: this.formBuilder.control( this.facade.actualEventProfilesPageStatusParam ),
            onlyVisible: this.formBuilder.control( this.facade.actualEventProfilesPageOnlyVisibleParam ),
            order: this.formBuilder.control( this.facade.actualEventProfilesPageOrderParam === OrderEnum.ASC ),
        } )
    }

    protected loadPage (pageEvent: PageEventModel, eventId: string | undefined): void {
        this.facade.fetchEventProfilesPage( pageEvent.offset, pageEvent.limit, false, eventId )
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
                this.facade.inputEventProfilesPageSearch( searched ),
            ),
        )
    }

    private handleRangeChanges (): void {
        this.subscriptions.add(
            this.range.valueChanges.subscribe( (range: Date[] | undefined): void =>
                this.facade.inputEventProfilesPageDateRange( range ),
            ),
        )
    }

    private handleStatusChanges (): void {
        this.subscriptions.add(
            this.status.valueChanges.subscribe( (status: string | undefined): void => {
                this.facade.selectEventProfilesPageStatus( status )
            } ),
        )
    }

    private handleOnlyVisibleChanges (): void {
        this.subscriptions.add(
            this.onlyVisible.valueChanges.subscribe( (onlyVisible: boolean | undefined): void => {
                if (onlyVisible != undefined) {
                    this.facade.selectEventProfilesPageVisibility( onlyVisible )
                }
            } ),
        )
    }

    private handleOrderChanges (): void {
        this.subscriptions.add(
            this.order.valueChanges.subscribe( (order: boolean | undefined): void => {
                if (order != undefined) {
                    this.facade.selectEventProfilesPageOrder( order ? OrderEnum.ASC : OrderEnum.DESC )
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
