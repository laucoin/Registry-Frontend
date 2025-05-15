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
import { ListboxClickEvent, ListboxModule } from 'primeng/listbox'
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
import { ProjectOptionIconPipe } from '../../util-tool/pipe/project-option-icon.pipe'
import { ProjectOptionEnum } from '../../util-model/enumeration/project-option.enum'
import { TruncatePipe } from '../../util-tool/pipe/truncate.pipe'
import { Button } from 'primeng/button'
import { ConfirmationService } from 'primeng/api'
import { MovementDto } from '../../../domains/project/movement/data/dto/movement.dto'
import { MovementContentDto } from '../../../domains/project/movement/data/dto/movement-content.dto'

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
        ProjectOptionIconPipe,
        TruncatePipe,
        Button,

    ],
    templateUrl: './movement-element.component.html',
    styleUrl: './movement-element.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class MovementElementComponent extends GenericElementComponent<MovementModel> {
    protected readonly facade: MovementFacade = inject( MovementFacade )
    protected readonly optionPipe: ProjectOptionIconPipe = inject( ProjectOptionIconPipe )
    private readonly confirmationService: ConfirmationService = inject( ConfirmationService )
    private readonly pluralTranslation: PluralTranslationPipe = inject( PluralTranslationPipe )

    protected readonly VehicleUtil: typeof VehicleUtil = VehicleUtil
    protected readonly MovementTypeEnum: typeof MovementTypeEnum = MovementTypeEnum

    protected layerOpened: boolean = false
    protected activeTab: number = 1

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly movement: InputSignal<MovementModel> = input.required()
    public readonly reversible: InputSignal<boolean> = input( false )
    public readonly vehicleId: InputSignal<string | undefined> = input()

    private readonly allActions: Signal<ActionModel[]> = signal( [
        {
            id: ElementActionEnum.MOVEMENT_CONSULT_COMMUNICATIONS,
            label: 'movements.actions.communications-history',
            icon: this.optionPipe.transform( ProjectOptionEnum.COMMUNICATION ),
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_COMMUNICATION_R,
            requiredProjectOption: ProjectOptionEnum.COMMUNICATION,
        },
        {
            id: ElementActionEnum.MOVEMENT_UPDATE,
            label: 'movements.actions.edit',
            icon: 'pi pi-pen-to-square',
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_U,
        },
        {
            id: ElementActionEnum.MOVEMENT_DISABLE,
            label: 'movements.actions.disable',
            icon: 'pi pi-eye-slash',
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_U,
            confirmation: {
                header: 'movements.actions.confirmations.disable.title',
                message: 'movements.actions.confirmations.disable.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.WARNING,
                rejectSeverity: SeverityEnum.SECONDARY,
            },
        },
        {
            id: ElementActionEnum.MOVEMENT_ENABLE,
            label: 'movements.actions.enable',
            icon: 'pi pi-replay',
            disabled: true,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_U,
            confirmation: {
                header: 'movements.actions.confirmations.enable.title',
                message: 'movements.actions.confirmations.enable.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.WARNING,
                rejectSeverity: SeverityEnum.SECONDARY,
            },
        },
        {
            id: ElementActionEnum.MOVEMENT_DELETE,
            label: 'movements.actions.delete',
            icon: 'pi pi-trash',
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_D,
            confirmation: {
                header: 'movements.actions.confirmations.delete.title',
                message: 'movements.actions.confirmations.delete.message',
                icon: 'pi pi-exclamation-triangle',
                acceptSeverity: SeverityEnum.DANGER,
                rejectSeverity: SeverityEnum.SECONDARY,
            },
        },
    ] )

    private readonly allButtonActions: Signal<ActionModel[]> = computed( (): ActionModel[] => [
        {
            id: ElementActionEnum.MOVEMENT_REVERSE,
            label: `movements.actions.reverse.${this.movement().type.value}`,
            icon: this.movement().type.value === MovementTypeEnum.IN ? 'pi pi-arrow-up' : 'pi pi-arrow-down',
            disabled: false,
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_C,
        },
    ] )

    protected readonly buttonAction: Signal<ActionModel | undefined> = computed( (): ActionModel | undefined =>
        this.reversible() ? this.buildActions( this.movement(), this.allButtonActions() )[0] : undefined,
    )

    protected readonly actions: Signal<ActionModel[]>
    protected readonly total: Signal<number>
    protected readonly adults: Signal<MovementContentModel[]>
    protected readonly children: Signal<MovementContentModel[]>
    protected readonly pools: Signal<Record<string, MovementContentModel[]>>
    protected readonly driver: Signal<MovementContentModel | undefined>
    protected readonly driverName: Signal<string | undefined>

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
        this.driverName = computed( (): string => `${this.driver()?.participant?.firstName} ${this.driver()?.participant?.lastName?.toUpperCase()}` )
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
            case ElementActionEnum.MOVEMENT_CONSULT_COMMUNICATIONS:
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_MOVEMENTS_COMMUNICATIONS.replace( ':movementId', this.movement().id ),
                ).catch( console.error )
                break
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

    protected showDialogIfNeededForMovementReverse (content: MovementContentModel[]): void {
        this.confirmationService.confirm( {
            ...this.buttonAction()!.confirmation!,
            header: this.translateService.instant( `movements.actions.confirmations.reverse.${this.movement().type.value}.title` ),
            message: this.translateService.instant(
                this.pluralTranslation.transform(
                    `movements.actions.confirmations.reverse.${this.movement().type.value}.message`,
                    content,
                ),
                { size: content.length },
            ),
            closable: true,
            closeOnEscape: true,
            rejectButtonProps: {
                severity: 'secondary',
                outlined: true,
                rounded: true,
            },
            acceptButtonProps: {
                severity: 'success',
                outlined: true,
                rounded: true,
            },
            accept: (): void => this.handleMovementReverse( content ),
        } )
    }

    protected onClickParticipant (event: ListboxClickEvent): void {
        if (this.reversible()) {
            this.layerOpened = false
            this.showDialogIfNeededForMovementReverse( [ event.option ] )
        }
    }

    protected handleMovementReverse (content: MovementContentModel[]): void {
        const reverseMovement: MovementDto = {
            dateTime: new Date(),
            type: this.movement().type.value === MovementTypeEnum.IN ? MovementTypeEnum.OUT : MovementTypeEnum.IN,
            reason: undefined,
            activityId: undefined,
            contentType: this.movement().contentType,
            content: content.map( (c: MovementContentModel): MovementContentDto => ({
                poolName: c.poolName,
                participantId: c.participant?.id,
                vehicleId: c.vehicle?.id,
            }) ),
            guests: [],
        }
        this.facade.createMovement( reverseMovement )
    }
}
