import { Component } from '@angular/core'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'
import { EventModel } from '../../../shared/util-model/model/event.model'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { EventFacade } from '../data/state/event.facade'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import { MessageComponent } from '../../../shared/util-ui/message/message.component'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { EventElementComponent } from '../event-element/event-element.component'
import { OrderEnum } from '../../../shared/util-model/enumeration/order.enum'
import { AsyncPipe } from '@angular/common'
import { Button } from 'primeng/button'
import { InputTextModule } from 'primeng/inputtext'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { TranslateModule } from '@ngx-translate/core'
import { RouterLink } from '@angular/router'
import { EventRoutesEnum } from '../event-routes.enum'
import { DatePicker } from 'primeng/datepicker'

@Component( {
    selector: 'app-events-list',
    standalone: true,
    imports: [
        ListComponent,
        MessageComponent,
        RegistryTemplateDirective,
        EventElementComponent,
        AsyncPipe,
        Button,
        FormsModule,
        InputTextModule,
        ToggleButtonModule,
        TranslateModule,
        ReactiveFormsModule,
        RouterLink,
        DatePicker,
    ],
    templateUrl: './events-list.component.html',
} )
export class EventsListComponent extends GenericListComponent<EventModel> {
    protected readonly EventRoutesEnum: typeof EventRoutesEnum = EventRoutesEnum

    public constructor (private readonly facade: EventFacade) {
        super(
            facade.eventsPage,
            facade.eventsPageLoading,
            facade.eventsPageSilentLoading,
            facade.eventsPageError,
        )

        this.facade.fetchEventsPage( undefined, undefined, false )

        this.form = this.initForm()

        this.handleSearchedChanges()
        this.handleRangeChanges()
        this.handleOnlyVisibleChanges()
        this.handleOrderChanges()
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            searched: this.formBuilder.control( this.facade.actualEventsPageSearchParam ),
            range: this.formBuilder.control( this.facade.actualEventsPageDateRangeParam ?? [] ),
            onlyVisible: this.formBuilder.control( this.facade.actualEventsPageOnlyVisibleParam ),
            order: this.formBuilder.control( this.facade.actualEventsPageOrderParam === OrderEnum.ASC ),
        } )
    }

    protected loadPage (pageEvent: PageEventModel): void {
        this.facade.fetchEventsPage( pageEvent.offset, pageEvent.limit, false )
    }

    private handleSearchedChanges (): void {
        this.subscriptions.add(
            this.searched.valueChanges.subscribe( (searched: string | undefined): void =>
                this.facade.inputEventsPageSearch( searched ),
            ),
        )
    }

    private handleRangeChanges (): void {
        this.subscriptions.add(
            this.range.valueChanges.subscribe( (range: Date[] | undefined): void =>
                this.facade.inputEventsPageDateRange( range ),
            ),
        )
    }

    private handleOnlyVisibleChanges (): void {
        this.subscriptions.add(
            this.onlyVisible.valueChanges.subscribe( (onlyVisible: boolean | undefined): void => {
                if (onlyVisible != undefined) {
                    this.facade.selectEventsPageVisibility( onlyVisible )
                }
            } ),
        )
    }

    private handleOrderChanges (): void {
        this.subscriptions.add(
            this.order.valueChanges.subscribe( (order: boolean | undefined): void => {
                if (order != undefined) {
                    this.facade.selectEventsPageOrder( order ? OrderEnum.ASC : OrderEnum.DESC )
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

    protected get onlyVisible (): FormControl {
        return this.form.get( 'onlyVisible' ) as FormControl
    }

    protected get order (): FormControl {
        return this.form.get( 'order' ) as FormControl
    }
}
