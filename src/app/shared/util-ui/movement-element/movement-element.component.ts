import { Component, Input, OnChanges, signal, WritableSignal } from '@angular/core'
import { GenericElementComponent } from '../../util-tool/component/generic-element.component'
import { MovementModel } from '../../util-model/movement.model'
import { MovementActionEnum } from '../../../domains/movement/data/state/movement.action'
import { ActionModel } from '../../util-model/model/action.model'
import { MovementFacade } from '../../../domains/movement/data/state/movement.facade'
import { ElementCardComponent } from '../element-card/element-card.component'
import { DatePipe, KeyValuePipe, TitleCasePipe, UpperCasePipe } from '@angular/common'
import { AppConfig } from '../../../app.config'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { CurrentUserUtil } from '../../util-authentication/tool/current-user.util'
import { TranslateModule } from '@ngx-translate/core'
import { TagModule } from 'primeng/tag'
import { ParticipantModel } from '../../util-model/model/participant.model'
import { MovementContentModel } from '../../util-model/movement-content.model'
import { LayerComponent } from '../layer/layer.component'
import { Button } from 'primeng/button'
import { ListboxModule } from 'primeng/listbox'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs'
import { Avatar } from 'primeng/avatar'
import { AppRouteEnum } from '../../../app-route.enum'
import { VehicleUtil } from '../../util-tool/util/vehicle.util'

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
    @Input() public vehicleId?: string

    protected readonly VehicleUtil: typeof VehicleUtil = VehicleUtil

    protected layerOpened: boolean = false
    protected activeTab: number = 1

    protected total: WritableSignal<number> = signal( 0 )
    protected adults: WritableSignal<MovementContentModel[]> = signal( [] )
    protected children: WritableSignal<MovementContentModel[]> = signal( [] )
    protected pools: WritableSignal<Record<string, MovementContentModel[]>> = signal( {} )
    protected driver: WritableSignal<MovementContentModel | undefined> = signal( undefined )

    public constructor (private readonly facade: MovementFacade) {super()}

    public ngOnChanges (): void {
        this.defineActions()
        this.total.set( this.element.content.length - 1 )
        this.adults.set( this.filterContent( true ) )
        this.children.set( this.filterContent( false ) )
        this.pools.set( this.groupByPool() )
        if (this.vehicleId) {
            this.driver.set( this.element.content.find( (content: MovementContentModel): boolean => content.vehicle?.id === this.vehicleId ) )
        }
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
                this.facade.disableMovement( this.element.id, this.contextEventId() )
                break
            case MovementActionEnum.ENABLE_MOVEMENT:
                this.facade.enableMovement( this.element.id, this.contextEventId() )
                break
            case MovementActionEnum.DELETE_MOVEMENT:
                this.facade.deleteMovement( this.element, this.contextEventId() )
                break
            default:
                console.warn( this.translateService.instant( 'warning.message.invalid-action' ) )
        }
    }

    protected get firstNotPurged (): ParticipantModel | undefined {
        return this.element.content.find( (content: MovementContentModel): boolean => !content?.participant.purged )?.participant
    }
}
