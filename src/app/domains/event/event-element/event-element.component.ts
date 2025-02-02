import { Component, OnChanges } from '@angular/core'
import { EventModel } from '../../../shared/util-model/model/event.model'
import { DatePipe, NgForOf } from '@angular/common'
import { ElementCardComponent } from '../../../shared/util-ui/element-card/element-card.component'
import { TagModule } from 'primeng/tag'
import { TranslateModule } from '@ngx-translate/core'
import { GenericElementComponent } from '../../../shared/util-tool/component/generic-element.component'
import { AppConfig } from '../../../app.config'
import { ChipModule } from 'primeng/chip'
import { EventActionEnum } from '../data/state/event.action'
import { ActionModel } from '../../../shared/util-model/model/action.model'
import { EventOptionIconPipe } from '../../../shared/util-tool/pipe/event-option-icon.pipe'
import { DateIsPastPipe } from '../../../shared/util-tool/pipe/date-is-past.pipe'
import { EventFacade } from '../data/state/event.facade'
import { CurrentUserUtil } from '../../../shared/util-authentication/tool/current-user.util'
import { CurrentUserModel } from '../../../shared/util-model/model/current-user.model'
import { AppRouteEnum } from '../../../app-route.enum'

@Component( {
    selector: 'app-event-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        TagModule,
        TranslateModule,
        DatePipe,
        NgForOf,
        ChipModule,
        DateIsPastPipe,
        EventOptionIconPipe,
    ],
    templateUrl: './event-element.component.html',
    styleUrl: './event-element.component.scss',
} )
export class EventElementComponent extends GenericElementComponent<EventModel, EventActionEnum> implements OnChanges {
    public constructor (private readonly facade: EventFacade) {super()}

    public ngOnChanges (): void {
        this.defineActions()
    }

    private defineActions (): void {
        const currentUser: CurrentUserModel = this.registryFacade.actualCurrentUser!
        this.actions = AppConfig
            .config.event.action
            .map( (action: ActionModel<EventActionEnum>): ActionModel<EventActionEnum> => ({
                    ...action,
                    disabled: this.isActionDisabled( currentUser, action ),
                }),
            )
            .filter( (action: ActionModel<EventActionEnum>): boolean => !action.disabled )
    }

    protected override isActionDisabled (currentUser: CurrentUserModel, action: ActionModel<EventActionEnum>): boolean {
        const isActionFeasible: boolean = CurrentUserUtil.isFeasible(
            currentUser,
            this.element,
            action,
        )

        switch (action.id) {
            case EventActionEnum.DISABLE_EVENT:
                return !(isActionFeasible && this.element.visible)
            case EventActionEnum.ENABLE_EVENT:
                return !(isActionFeasible && !this.element.visible)
            default:
                return !isActionFeasible
        }
    }

    protected handleAction (action: EventActionEnum): void {
        switch (action) {
            case EventActionEnum.UPDATE_EVENT:
                this.router.navigateByUrl(
                    this.buildUri( AppRouteEnum.EVENTS_EDITION.replace( ':id', this.element.id ) ),
                ).catch( console.error )
                break
            case EventActionEnum.DISABLE_EVENT:
                this.facade.disableEvent( this.element.id )
                break
            case EventActionEnum.ENABLE_EVENT:
                this.facade.enableEvent( this.element.id )
                break
            case EventActionEnum.DELETE_EVENT:
                this.facade.deleteEvent( this.element )
                break
            default:
                console.warn( this.translateService.instant( 'warning.message.invalid-action' ) )
        }
    }
}
