import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, signal, Signal } from '@angular/core'
import { MovementModel } from '../../util-model/model/movement.model'
import { ActionModel } from '../../util-model/model/action.model'
import { MovementFacade } from '../../../domains/project/movement/data/state/movement.facade'
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
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component'
import { SeverityCircleComponent } from '../severity-circle/severity-circle.component'
import { MovementTypeEnum } from '../../util-model/enumeration/movement-type.enum'
import { ProjectAuthorityEnum } from '../../util-model/enumeration/project-authority.enum'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'
import { ElementActionEnum } from '../../util-model/enumeration/element-action.enum'

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
        ConfirmationDialogComponent,
        SeverityCircleComponent,
    ],
    templateUrl: './movement-element.component.html',
    styleUrl: './movement-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class MovementElementComponent extends GenericElementComponent<MovementModel> {
    protected readonly facade: MovementFacade = inject( MovementFacade )

    protected readonly VehicleUtil: typeof VehicleUtil = VehicleUtil
    protected readonly MovementTypeEnum: typeof MovementTypeEnum = MovementTypeEnum

    protected layerOpened: boolean = false
    protected activeTab: number = 1

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly movement: InputSignal<MovementModel> = input.required()
    public readonly vehicleId: InputSignal<string | undefined> = input()

    private readonly allActions: Signal<ActionModel[]> = signal( [
        {
            id: ElementActionEnum.MOVEMENT_UPDATE,
            label: 'movements.actions.edit',
            icon: 'pi pi-pen-to-square',
            disabled: false,
            requiredUserAuthority: undefined,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_U,
            requiredProjectOption: undefined,
            confirmation: undefined,
        },
        {
            id: ElementActionEnum.MOVEMENT_DISABLE,
            label: 'movements.actions.disable',
            icon: 'pi pi-eye-slash',
            disabled: false,
            requiredUserAuthority: undefined,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_U,
            requiredProjectOption: undefined,
            confirmation: {
                header: 'movements.actions.confirmations.disable.title',
                message: 'movements.actions.confirmations.disable.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.WARNING,
                rejectSeverity: SeverityEnum.SECONDARY,
                confirmProperty: undefined,
            },
        },
        {
            id: ElementActionEnum.MOVEMENT_ENABLE,
            label: 'movements.actions.enable',
            icon: 'pi pi-replay',
            disabled: true,
            requiredUserAuthority: undefined,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_U,
            requiredProjectOption: undefined,
            confirmation: {
                header: 'movements.actions.confirmations.enable.title',
                message: 'movements.actions.confirmations.enable.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.WARNING,
                rejectSeverity: SeverityEnum.SECONDARY,
                confirmProperty: undefined,
            },
        },
        {
            id: ElementActionEnum.MOVEMENT_DELETE,
            label: 'movements.actions.delete',
            icon: 'pi pi-trash',
            disabled: false,
            requiredUserAuthority: undefined,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_D,
            requiredProjectOption: undefined,
            confirmation: {
                header: 'movements.actions.confirmations.delete.title',
                message: 'movements.actions.confirmations.delete.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.DANGER,
                rejectSeverity: SeverityEnum.SECONDARY,
                confirmProperty: undefined,
            },
        },
    ] )

    protected readonly actions: Signal<ActionModel[]>
    protected readonly total: Signal<number>
    protected readonly adults: Signal<MovementContentModel[]>
    protected readonly children: Signal<MovementContentModel[]>
    protected readonly pools: Signal<Record<string, MovementContentModel[]>>
    protected readonly driver: Signal<MovementContentModel | undefined>

    public constructor () {
        super()

        this.actions = computed( (): ActionModel[] => this.buildActions(
            this.movement(),
            this.allActions(),
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

    protected isActionVisible (element: MovementModel, action: ActionModel): boolean {
        if (!AppConfig.config.movement.actions.includes( action.id )) return false

        switch (action.id) {
            case ElementActionEnum.MOVEMENT_DISABLE:
                return element.visible
            case ElementActionEnum.MOVEMENT_ENABLE:
                return !element.visible
            default:
                return true
        }
    }

    protected handleAction (action: ElementActionEnum): void {
        switch (action) {
            case ElementActionEnum.MOVEMENT_UPDATE:
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_MOVEMENTS_EDITION.replace( ':movementId', this.movement().id ),
                ).catch( console.error )
                break
            case ElementActionEnum.MOVEMENT_DISABLE:
                this.facade.disableMovement( this.movement().id )
                break
            case ElementActionEnum.MOVEMENT_ENABLE:
                this.facade.enableMovement( this.movement().id )
                break
            case ElementActionEnum.MOVEMENT_DELETE:
                this.facade.deleteMovement( this.movement() )
                break
            default:
                console.warn( this.translateService.instant( 'global.messages.invalid-action' ) )
        }
    }
}
