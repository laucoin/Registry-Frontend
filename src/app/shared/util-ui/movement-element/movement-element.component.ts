import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, Signal } from '@angular/core'
import { MovementModel } from '../../util-model/model/movement.model'
import { MovementActionEnum } from '../../../domains/movement/data/state/movement.action'
import { ActionModel } from '../../util-model/model/action.model'
import { MovementFacade } from '../../../domains/movement/data/state/movement.facade'
import { ElementCardComponent } from '../element-card/element-card.component'
import { KeyValuePipe, TitleCasePipe, UpperCasePipe } from '@angular/common'
import { AppConfig } from '../../../app.config'
import { TranslateModule } from '@ngx-translate/core'
import { TagModule } from 'primeng/tag'
import { MovementContentModel } from '../../util-model/model/movement-content.model'
import { LayerComponent } from '../layer/layer.component'
import { ListboxModule } from 'primeng/listbox'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs'
import { Avatar } from 'primeng/avatar'
import { AppRouteEnum } from '../../../app-route.enum'
import { SeverityTagComponent } from '../severity-tag/severity-tag.component'
import { Skeleton } from 'primeng/skeleton'
import { GenericElementComponent } from '../../util-tool/component/generic-element.component'
import { MovementUtil } from '../../util-tool/util/movement.util'
import { VehicleUtil } from '../../util-tool/util/vehicle.util'
import { PluralTranslationPipe } from '../../util-tool/pipe/plural-translation.pipe'
import { DateFormatPipe } from '../../util-tool/pipe/date-format.pipe'
import { VisibilityNamePipe } from '../../util-tool/pipe/visibility.pipe'

@Component( {
    selector: 'app-movement-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        TranslateModule,
        TagModule,
        TitleCasePipe,
        UpperCasePipe,
        LayerComponent,
        ListboxModule,
        Tabs,
        TabPanels,
        TabList,
        Tab,
        TabPanel,
        Avatar,
        KeyValuePipe,
        SeverityTagComponent,
        Skeleton,
        PluralTranslationPipe,
        DateFormatPipe,
        VisibilityNamePipe,
    ],
    templateUrl: './movement-element.component.html',
    styleUrl: './movement-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class MovementElementComponent extends GenericElementComponent<MovementModel, MovementActionEnum> {
    private readonly facade: MovementFacade = inject( MovementFacade )

    protected readonly VehicleUtil: typeof VehicleUtil = VehicleUtil

    protected layerOpened: boolean = false
    protected activeTab: number = 1

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly movement: InputSignal<MovementModel> = input.required()
    public readonly vehicleId: InputSignal<string | undefined> = input()

    protected readonly actions: Signal<ActionModel<MovementActionEnum>[]>
    protected readonly total: Signal<number>
    protected readonly adults: Signal<MovementContentModel[]>
    protected readonly children: Signal<MovementContentModel[]>
    protected readonly pools: Signal<Record<string, MovementContentModel[]>>
    protected readonly driver: Signal<MovementContentModel | undefined>

    public constructor () {
        super()

        this.actions = computed( (): ActionModel<MovementActionEnum>[] => this.buildActions(
            this.movement(),
            AppConfig.config.movement.action,
        ) )

        this.total = computed( (): number => this.movement().content.length )
        this.adults = computed( (): MovementContentModel[] => MovementUtil.getAdults( this.movement() ) )
        this.children = computed( (): MovementContentModel[] => MovementUtil.getChildren( this.movement() ) )
        this.pools = computed( (): Record<string, MovementContentModel[]> => MovementUtil.getPools( this.movement() ) )
        this.driver = computed( (): MovementContentModel | undefined => {
            if (this.vehicleId()) {
                return this.movement().content.find(
                    (content: MovementContentModel): boolean => content.vehicle?.id === this.vehicleId(),
                )
            }
            return undefined
        } )
    }

    protected isActionVisible (element: MovementModel, action: ActionModel<MovementActionEnum>): boolean {
        switch (action.id) {
            case MovementActionEnum.DISABLE_MOVEMENT:
                return element.visible
            case MovementActionEnum.ENABLE_MOVEMENT:
                return !element.visible
            default:
                return true
        }
    }

    protected handleAction (action: MovementActionEnum): void {
        switch (action) {
            case MovementActionEnum.UPDATE_MOVEMENT:
                this.router.navigateByUrl(
                    this.buildUri( AppRouteEnum.MOVEMENTS_EDITION.replace( ':movementId', this.movement().id ) ),
                ).catch( console.error )
                break
            case MovementActionEnum.DISABLE_MOVEMENT:
                this.facade.disableMovement( this.movement().id, this.contextEventId() )
                break
            case MovementActionEnum.ENABLE_MOVEMENT:
                this.facade.enableMovement( this.movement().id, this.contextEventId() )
                break
            case MovementActionEnum.DELETE_MOVEMENT:
                this.facade.deleteMovement( this.movement(), this.contextEventId() )
                break
            default:
                console.warn( this.translateService.instant( 'global.messages.invalid-action' ) )
        }
    }
}
