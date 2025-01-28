import { Component, Input, OnChanges, signal, WritableSignal } from '@angular/core'
import { GenericElementComponent } from '../../../shared/util-tool/component/generic-element.component'
import { MovementModel } from '../data/model/movement.model'
import { MovementActionEnum } from '../data/state/movement.action'
import { ActionModel } from '../../../shared/util-model/model/action.model'
import { MovementFacade } from '../data/state/movement.facade'
import { ElementCardComponent } from '../../../shared/util-ui/element-card/element-card.component'
import { DatePipe, KeyValuePipe, TitleCasePipe, UpperCasePipe } from '@angular/common'
import { AppConfig } from '../../../app.config'
import { CurrentUserModel } from '../../../shared/util-model/model/current-user.model'
import { CurrentUserUtil } from '../../../shared/util-authentication/tool/current-user.util'
import { TranslateModule } from '@ngx-translate/core'
import { TagModule } from 'primeng/tag'
import { ParticipantModel } from '../../../shared/util-model/model/participant.model'
import { MovementContentModel } from '../data/model/movement-content.model'
import { LayerComponent } from '../../../shared/util-ui/layer/layer.component'
import { Button } from 'primeng/button'
import { ListboxModule } from 'primeng/listbox'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs'
import { Avatar } from 'primeng/avatar'
import { AppRouteEnum } from '../../../app-route.enum'

@Component( {
    selector: 'app-movement-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        DatePipe,
        TranslateModule,
        TagModule,
        TitleCasePipe,
        UpperCasePipe,
        LayerComponent,
        Button,
        ListboxModule,
        Tabs,
        TabPanels,
        TabList,
        Tab,
        TabPanel,
        Avatar,
        KeyValuePipe,
    ],
    templateUrl: './movement-element.component.html',
    styleUrl: './movement-element.component.scss',
} )
export class MovementElementComponent extends GenericElementComponent<MovementModel, MovementActionEnum> implements OnChanges {
    @Input() public showActionMenu: boolean = true

    protected layerOpened: boolean = false
    protected activeTab: number = 1

    protected total: WritableSignal<number> = signal( 0 )
    protected adults: WritableSignal<MovementContentModel[]> = signal( [] )
    protected children: WritableSignal<MovementContentModel[]> = signal( [] )
    protected pools: WritableSignal<Record<string, MovementContentModel[]>> = signal( {} )

    public constructor (private readonly facade: MovementFacade) {super()}

    public ngOnChanges (): void {
        this.defineActions()
        this.total.set( this.element.content.length - 1 )
        this.adults.set( this.filterContent( true ) )
        this.children.set( this.filterContent( false ) )
        this.pools.set( this.groupByPool() )
    }

    private filterContent (major: boolean): MovementContentModel[] {
        return this.element.content.filter( (content: MovementContentModel): boolean => content.participant.major === major )
    }

    private groupByPool (): Record<string, MovementContentModel[]> {
        return this.element.content.reduce( (
            grouped: Record<string, MovementContentModel[]>,
            item: MovementContentModel,
        ): Record<string, MovementContentModel[]> => {
            if (item.poolName) {
                if (!grouped[item.poolName]) {
                    grouped[item.poolName] = []
                }
                grouped[item.poolName].push( item )
            }
            return grouped
        }, {} as Record<string, MovementContentModel[]> )
    }

    private defineActions (): void {
        const currentUser: CurrentUserModel = this.registryFacade.actualCurrentUser!
        this.actions = AppConfig
            .config.movement.action
            .map( (action: ActionModel<MovementActionEnum>): ActionModel<MovementActionEnum> => ({
                ...action,
                disabled: this.isActionDisabled( currentUser, action ),
            }) )
            .filter( (action: ActionModel<MovementActionEnum>): boolean => !action.disabled )
    }

    protected override isActionDisabled (
        currentUser: CurrentUserModel,
        action: ActionModel<MovementActionEnum>,
    ): boolean {
        const isActionFeasible: boolean = CurrentUserUtil.isFeasible(
            currentUser,
            this.element.event,
            action,
        )

        switch (action.id) {
            case MovementActionEnum.DISABLE_MOVEMENT:
                return !(isActionFeasible && this.element.visible)
            case MovementActionEnum.ENABLE_MOVEMENT:
                return !(isActionFeasible && !this.element.visible)
            default:
                return !isActionFeasible
        }
    }

    protected handleAction (action: MovementActionEnum): void {
        switch (action) {
            case MovementActionEnum.UPDATE_MOVEMENT:
                this.router.navigateByUrl(
                    this.buildUri( AppRouteEnum.MOVEMENTS_EDITION.replace( ':id', this.element.id ) ),
                ).catch( console.error )
                break
            case MovementActionEnum.DISABLE_MOVEMENT:
                this.facade.disableElement( this.element.id, this.contextEventId() )
                break
            case MovementActionEnum.ENABLE_MOVEMENT:
                this.facade.enableElement( this.element.id, this.contextEventId() )
                break
            case MovementActionEnum.DELETE_MOVEMENT:
                this.facade.deleteElement( this.element, this.contextEventId() )
                break
            default:
                console.warn( this.translateService.instant( 'warning.message.invalid-action' ) )
        }
    }

    protected get firstNotPurged (): ParticipantModel | undefined {
        return this.element.content.find( (content: MovementContentModel): boolean => !content?.participant.purged )?.participant
    }
}
