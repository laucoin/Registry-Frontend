import { Component } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { Button } from 'primeng/button'
import { EventProfileModel } from '../../../shared/util-model/model/event-profile.model'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import { MessageComponent } from '../../../shared/util-ui/message/message.component'
import {
    EventProfileElementComponent,
} from '../../../shared/util-ui/event-profile-element/event-profile-element.component'
import { AsyncPipe } from '@angular/common'
import { CalendarModule } from 'primeng/calendar'
import { InputTextModule } from 'primeng/inputtext'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { OrderEnum } from '../../../shared/util-model/enumeration/order.enum'
import { RegistryFacade } from '../../../shared/util-common/state/registry.facade'

@Component( {
    selector: 'app-invitation-list',
    standalone: true,
    imports: [
        ListComponent,
        MessageComponent,
        RegistryTemplateDirective,
        Button,
        TranslateModule,
        EventProfileElementComponent,
        AsyncPipe,
        CalendarModule,
        FormsModule,
        InputTextModule,
        ToggleButtonModule,
        ReactiveFormsModule,
    ],
    templateUrl: './invitation-list.component.html',
} )
export class InvitationListComponent extends GenericListComponent<EventProfileModel> {
    public constructor (facade: RegistryFacade) {
        super(
            facade.invitationPage,
            facade.invitationsLoading,
            facade.invitationsSilentLoading,
            facade.invitationsError,
        )

        this.changeEmptyMessageTranslationKey( 'EMPTY_USER_EVENT_INVITATION' )

        this.registryFacade.fetchEventProfileInvitationPage( undefined, undefined, false )

        this.form = this.initForm()

        this.handleSearchedChanges()
        this.handleRangeChanges()
        this.handleOrderChanges()
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            searched: this.formBuilder.control( this.registryFacade.actualInvitationPageSearched ),
            range: this.formBuilder.control( this.registryFacade.actualInvitationPageDateRange ?? [] ),
            order: this.formBuilder.control( this.registryFacade.actualInvitationPageOrder === OrderEnum.ASC ),
        } )
    }

    protected loadPage (pageEvent: PageEventModel): void {
        this.registryFacade.fetchEventProfileInvitationPage( pageEvent.offset, pageEvent.limit, false )
    }

    private handleSearchedChanges (): void {
        this.subscriptions.add(
            this.searched.valueChanges.subscribe( (searched: string | undefined): void =>
                this.registryFacade.inputInvitationsPageSearch( searched ),
            ),
        )
    }

    private handleRangeChanges (): void {
        this.subscriptions.add(
            this.range.valueChanges.subscribe( (range: Date[] | undefined): void =>
                this.registryFacade.inputInvitationsPageDateRange( range ),
            ),
        )
    }

    private handleOrderChanges (): void {
        this.subscriptions.add(
            this.order.valueChanges.subscribe( (order: boolean | undefined): void => {
                if (order != undefined) {
                    this.registryFacade.selectInvitationsPageOrder( order ? OrderEnum.ASC : OrderEnum.DESC )
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

    protected get order (): FormControl {
        return this.form.get( 'order' ) as FormControl
    }
}
