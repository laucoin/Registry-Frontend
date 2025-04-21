import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    InputSignal,
    signal,
    Signal,
    WritableSignal,
} from '@angular/core'
import { EventModel } from '../../../shared/util-model/model/event.model'
import { ElementCardComponent } from '../../../shared/util-ui/element-card/element-card.component'
import { TagModule } from 'primeng/tag'
import { TranslateModule } from '@ngx-translate/core'
import { AppConfig } from '../../../app.config'
import { ChipModule } from 'primeng/chip'
import { EventActionEnum } from '../data/state/event.action'
import { ActionModel } from '../../../shared/util-model/model/action.model'
import { EventFacade } from '../data/state/event.facade'
import { AppRouteEnum } from '../../../app-route.enum'
import { SeverityTagComponent } from '../../../shared/util-ui/severity-tag/severity-tag.component'
import { DateUtil } from '../../../shared/util-tool/util/date.util'
import { DateIntervalStatusModel } from '../../../shared/util-model/model/date-interval-status.model'
import { LayerComponent } from '../../../shared/util-ui/layer/layer.component'
import { Listbox } from 'primeng/listbox'
import { GenericElementComponent } from '../../../shared/util-tool/component/generic-element.component'
import { VisibilityNamePipe } from '../../../shared/util-tool/pipe/visibility.pipe'
import { PluralTranslationPipe } from '../../../shared/util-tool/pipe/plural-translation.pipe'
import { IntervalFormatPipe } from '../../../shared/util-tool/pipe/interval-format.pipe'
import { CustomDateFormatPipe } from '../../../shared/util-tool/pipe/custom-date-format.pipe'
import { RegistryActionEnum } from '../../../shared/util-common/state/registry.action'
import { CurrentUserUtil } from '../../../shared/util-authentication/tool/current-user.util'
import { ConfirmationDialogComponent } from '../../../shared/util-ui/confirmation-dialog/confirmation-dialog.component'
import { tap } from 'rxjs'

@Component( {
    selector: 'app-event-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        TagModule,
        TranslateModule,
        ChipModule,
        SeverityTagComponent,
        LayerComponent,
        Listbox,
        VisibilityNamePipe,
        PluralTranslationPipe,
        IntervalFormatPipe,
        CustomDateFormatPipe,
        ConfirmationDialogComponent,
    ],
    templateUrl: './event-element.component.html',
    styleUrl: './event-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class EventElementComponent extends GenericElementComponent<EventModel, EventActionEnum | RegistryActionEnum> {
    protected readonly facade: EventFacade = inject( EventFacade )

    protected layerOpened: boolean = false

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly event: InputSignal<EventModel> = input.required()

    protected readonly hintMessage: WritableSignal<string | undefined> = signal( undefined )
    protected readonly actions: Signal<ActionModel<EventActionEnum | RegistryActionEnum>[]>
    protected readonly intervalStatus: Signal<DateIntervalStatusModel | undefined>

    public constructor () {
        super()

        this.intervalStatus = computed( (): DateIntervalStatusModel => DateUtil.dateRangeStatus(
            this.event().begin,
            this.event().end,
        ) )

        this.actions = computed( (): ActionModel<EventActionEnum | RegistryActionEnum>[] => this.buildActions(
            this.event(),
            AppConfig.config.event.action,
        ) )
    }

    protected isActionVisible (
        element: EventModel,
        action: ActionModel<EventActionEnum | RegistryActionEnum>,
    ): boolean {
        const hasAnyEventAuthority: boolean = this.registryFacade.currentUser()!.authorities.some(
            (authority: string): boolean => authority.startsWith( `${element.id}_REGISTRY_EVENT` ),
        )
        switch (action.id) {
            case RegistryActionEnum.SELECT_USER_EVENT_PROFILE_BY_EVENT:
                return hasAnyEventAuthority
            case RegistryActionEnum.CREATE_SUPPORT_EVENT_PROFILE:
                return !hasAnyEventAuthority
            case EventActionEnum.DISABLE_EVENT:
                return element.visible
            case EventActionEnum.ENABLE_EVENT:
                return !element.visible
            default:
                return true
        }
    }

    protected override disabledAction (
        element: EventModel,
        action: ActionModel<EventActionEnum | RegistryActionEnum>,
    ): boolean {
        return action.id === RegistryActionEnum.SELECT_USER_EVENT_PROFILE_BY_EVENT
               && this.registryFacade.currentUser()?.preferences?.selectedProfile?.event?.id === element.id
               ? true : !CurrentUserUtil.isFeasible( this.registryFacade.currentUser(), element, action )
    }

    protected handleAction (action: EventActionEnum | RegistryActionEnum): void {
        switch (action) {
            case RegistryActionEnum.SELECT_USER_EVENT_PROFILE_BY_EVENT:
                this.subscriptions.add(
                    this.registryFacade.selectUserEventProfileByEvent( this.event() ).pipe(
                        tap( () => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            case RegistryActionEnum.CREATE_SUPPORT_EVENT_PROFILE:
                this.subscriptions.add(
                    this.registryFacade.createSupportEventProfile( this.event().id ).pipe(
                        tap( () => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            case EventActionEnum.UPDATE_EVENT:
                this.router.navigateByUrl(
                    this.buildUri( AppRouteEnum.EVENTS_EDITION.replace( ':eventId', this.event().id ) ),
                ).catch( console.error )
                break
            case EventActionEnum.DISABLE_EVENT:
                this.subscriptions.add(
                    this.facade.disableEvent( this.event().id ).pipe(
                        tap( () => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            case EventActionEnum.ENABLE_EVENT:
                this.subscriptions.add(
                    this.facade.enableEvent( this.event().id ).pipe(
                        tap( () => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            case EventActionEnum.DELETE_EVENT:
                this.subscriptions.add(
                    this.facade.deleteEvent( this.event() ).pipe(
                        tap( () => this.action.set( undefined ) ),
                    ).subscribe(),
                )
                break
            default:
                console.warn( this.translateService.instant( 'global.messages.invalid-action' ) )
        }
    }
}
