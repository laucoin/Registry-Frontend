import { Component } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { Observable } from 'rxjs'
import { EventProfileModel } from '../../../shared/util-model/model/event-profile.model'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { PageModel } from '../../../shared/util-model/model/page.model'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'
import { OrderEnum } from '../../../shared/util-model/enumeration/order.enum'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { TranslateModule } from '@ngx-translate/core'
import { InputTextModule } from 'primeng/inputtext'
import { CalendarModule } from 'primeng/calendar'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { AsyncPipe } from '@angular/common'
import {
    EventProfileElementComponent,
} from '../../../shared/util-ui/event-profile-element/event-profile-element.component'
import { MessageComponent } from '../../../shared/util-ui/message/message.component'
import { PluralTranslationPipe } from '../../../shared/util-tool/pipe/plural-translation.pipe'
import { AppRouteEnum } from '../../../app-route.enum'
import { RegistryFacade } from '../../../shared/util-common/state/registry.facade'

@Component( {
    selector: 'app-profile-list',
    standalone: true,
    imports: [
        ListComponent,
        ReactiveFormsModule,
        RegistryTemplateDirective,
        TranslateModule,
        InputTextModule,
        CalendarModule,
        ToggleButtonModule,
        AsyncPipe,
        EventProfileElementComponent,
        MessageComponent,
        PluralTranslationPipe,
        RouterLink,
    ],
    templateUrl: './profile-list.component.html',
} )
export class ProfileListComponent extends GenericListComponent<EventProfileModel> {
    protected readonly AppRouteEnum: typeof AppRouteEnum = AppRouteEnum
    protected readonly invitationPage$: Observable<PageModel<EventProfileModel> | undefined> = this.registryFacade.invitationPage

    public constructor (facade: RegistryFacade) {
        super(
            facade.profilesPage,
            facade.profilesLoading,
            facade.profilesSilentLoading,
            facade.profilesError,
        )

        this.changeEmptyMessageTranslationKey( 'EMPTY_USER_EVENT_PROFILE' )

        this.registryFacade.fetchEventProfilePage( undefined, undefined, false )

        this.form = this.initForm()

        this.handleSearchedChanges()
        this.handleRangeChanges()
        this.handleOrderChanges()
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            searched: this.formBuilder.control( this.registryFacade.actualProfilePageSearched ),
            range: this.formBuilder.control( this.registryFacade.actualProfilePageDateRange ?? [] ),
            order: this.formBuilder.control( this.registryFacade.actualProfilePageOrder === OrderEnum.ASC ),
        } )
    }

    protected loadPage (pageEvent: PageEventModel): void {
        this.registryFacade.fetchEventProfilePage( pageEvent.offset, pageEvent.limit, false )
    }

    private handleSearchedChanges (): void {
        this.subscriptions.add(
            this.searched.valueChanges.subscribe( (searched: string | undefined): void =>
                this.registryFacade.inputProfilesPageSearch( searched ),
            ),
        )
    }

    private handleRangeChanges (): void {
        this.subscriptions.add(
            this.range.valueChanges.subscribe( (range: Date[] | undefined): void =>
                this.registryFacade.inputProfilesPageDateRange( range ),
            ),
        )
    }

    private handleOrderChanges (): void {
        this.subscriptions.add(
            this.order.valueChanges.subscribe( (order: boolean | undefined): void => {
                if (order != undefined) {
                    this.registryFacade.selectProfilesPageOrder( order ? OrderEnum.ASC : OrderEnum.DESC )
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
