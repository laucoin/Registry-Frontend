import {Component, computed, inject, input, InputSignal, Signal} from '@angular/core'
import {MovementModel} from '../../util-model/model/movement.model'
import {MovementFacade} from '../../../domains/project/movement/data/state/movement.facade'
import {ElementCardComponent} from '../element-card/element-card.component'
import {KeyValuePipe, TitleCasePipe, UpperCasePipe} from '@angular/common'
import {TranslatePipe} from '@ngx-translate/core'
import {TagModule} from 'primeng/tag'
import {MovementContentModel} from '../../util-model/model/movement-content.model'
import {LayerComponent} from '../layer/layer.component'
import {ListboxClickEvent, ListboxModule} from 'primeng/listbox'
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs'
import {Avatar} from 'primeng/avatar'
import {AppRouteEnum} from '../../../app-route.enum'
import {SeverityTagComponent} from '../severity-tag/severity-tag.component'
import {Skeleton} from 'primeng/skeleton'
import {GenericElementComponent} from '../../util-tool/component/generic-element.component'
import {MovementUtil} from '../../util-tool/util/movement.util'
import {VehicleUtil} from '../../util-tool/util/vehicle.util'
import {PluralTranslationPipe} from '../../util-tool/pipe/plural-translation.pipe'
import {DateFormatPipe} from '../../util-tool/pipe/date-format.pipe'
import {SeverityCircleComponent} from '../severity-circle/severity-circle.component'
import {MovementTypeEnum} from '../../util-model/enumeration/movement-type.enum'
import {ProjectAuthorityEnum} from '../../util-model/enumeration/project-authority.enum'
import {SeverityEnum} from '../../util-model/enumeration/severity.enum'
import {ElementActionEnum} from '../../util-model/enumeration/element-action.enum'
import {ProjectOptionIconPipe} from '../../util-tool/pipe/project-option-icon.pipe'
import {ProjectOptionEnum} from '../../util-model/enumeration/project-option.enum'
import {TruncatePipe} from '../../util-tool/pipe/truncate.pipe'
import {Button} from 'primeng/button'
import {MovementDto} from '../../../domains/project/movement/data/dto/movement.dto'
import {MovementContentDto} from '../../../domains/project/movement/data/dto/movement-content.dto'
import {GenericUtil} from '../../util-tool/util/generic.util'
import {FormControl, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms'
import {RegistryValidators} from '../../util-tool/util/registry.validator'
import {MenuItem} from 'primeng/api'
import {Dialog} from 'primeng/dialog'
import {Menu} from 'primeng/menu'
import {Popover} from 'primeng/popover'
import {Ripple} from 'primeng/ripple'
import {
    MovementCommunicationsListComponent,
} from '../../../domains/project/movement/movement-communications-list/movement-communications-list.component'

@Component({
    selector: 'app-movement-element',
    standalone: true,
    imports: [
        ElementCardComponent,
        TranslatePipe,
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
        SeverityCircleComponent,
        ProjectOptionIconPipe,
        TruncatePipe,
        Button,
        FormsModule,
        ReactiveFormsModule,
        Dialog,
        Menu,
        Popover,
        Ripple,
        MovementCommunicationsListComponent,
    ],
    templateUrl: './movement-element.component.html',
    styleUrl: './movement-element.component.scss',
})
export class MovementElementComponent extends GenericElementComponent {
    protected readonly facade: MovementFacade = inject(MovementFacade)
    protected readonly pluralTranslation: PluralTranslationPipe = inject(PluralTranslationPipe)

    protected readonly VehicleUtil: typeof VehicleUtil = VehicleUtil
    protected readonly MovementTypeEnum: typeof MovementTypeEnum = MovementTypeEnum

    protected participantLayerActiveTab: number = 1
    protected participantsLayerOpened: boolean = false
    protected communicationsLayerOpened: boolean = false

    protected readonly message: FormControl = new FormControl(undefined, [
        RegistryValidators.nonBlank(),
        Validators.maxLength(250),
    ])

    public readonly actionMenuVisible: InputSignal<boolean> = input(true)
    public readonly movement: InputSignal<MovementModel> = input.required()
    public readonly reversible: InputSignal<boolean> = input(false)
    public readonly communicable: InputSignal<boolean> = input(false)
    public readonly vehicleId: InputSignal<string | undefined> = input()

    protected readonly actions: Signal<MenuItem[]> = computed((): MenuItem[] => [
        {
            label: 'movements.actions.edit',
            icon: 'pi pi-pen-to-square',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_U),
            visible: this.actionIsEnable(ElementActionEnum.MOVEMENT_UPDATE),
            command: (): void => {
                this.router.navigateByUrl(
                    AppRouteEnum.PROJECTS_MOVEMENTS_EDITION.replace(':movementId', this.movement().id),
                ).catch(console.error)
            },
        },
        {
            label: 'movements.actions.disable',
            icon: 'pi pi-eye-slash',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_U),
            visible: this.actionIsEnable(ElementActionEnum.MOVEMENT_DISABLE) && this.movement().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'movements.actions.confirmations.disable',
                        'pi pi-exclamation-triangle',
                        this.movement(),
                        SeverityEnum.WARNING,
                        (): void => this.facade.disableMovement(this.movement().id),
                    ),
                )
            },
        },
        {
            label: 'movements.actions.enable',
            icon: 'pi pi-replay',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_U),
            visible: this.actionIsEnable(ElementActionEnum.MOVEMENT_ENABLE) && !this.movement().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'movements.actions.confirmations.enable',
                        'pi pi-info-circle',
                        this.movement(),
                        SeverityEnum.INFO,
                        (): void => this.facade.enableMovement(this.movement().id),
                    ),
                )
            },
        },
        {
            label: 'movements.actions.delete',
            icon: 'pi pi-trash',
            disabled: !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_D),
            visible: this.actionIsEnable(ElementActionEnum.MOVEMENT_DELETE),
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'movements.actions.confirmations.delete',
                        'pi pi-exclamation-triangle',
                        this.movement(),
                        SeverityEnum.DANGER,
                        (): void => this.facade.deleteMovement(this.movement()),
                    ),
                )
            },
        },
    ])

    protected readonly reversibleAuthorized: Signal<boolean> = computed((): boolean =>
        this.reversible()
        && this.actionIsEnable(ElementActionEnum.MOVEMENT_REVERSE)
        && this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_C),
    )

    protected readonly reversedIcon: Signal<string> = computed((): string =>
        this.movement().type.value === MovementTypeEnum.IN ? 'pi pi-arrow-up' : 'pi pi-arrow-down',
    )

    protected readonly communication: Signal<boolean> = computed((): boolean =>
        this.communicable() && this.projectHasOption(ProjectOptionEnum.COMMUNICATION),
    )

    protected readonly typeAndReason: Signal<string> = computed((): string => {
        let text: string = this.movement().type.label ?? ''
        if (GenericUtil.nonNull(this.movement().reason)) {
            text += ` - ${this.movement().reason!.label}`
        }
        return text
    })
    protected readonly total: Signal<number> = computed((): number => this.movement().content.length)
    protected readonly adults: Signal<MovementContentModel[]> = computed((): MovementContentModel[] => MovementUtil.getAdults(
        this.movement()))
    protected readonly children: Signal<MovementContentModel[]> = computed((): MovementContentModel[] => MovementUtil.getChildren(
        this.movement()))
    protected readonly pools: Signal<Record<string, MovementContentModel[]>> = computed((): Record<string, MovementContentModel[]> => MovementUtil.getPools(
        this.movement()))
    protected readonly driver: Signal<MovementContentModel | undefined> = computed((): MovementContentModel | undefined => {
        if (this.vehicleId()) {
            return this.movement().content.find(
                (content: MovementContentModel): boolean => content.vehicle?.id === this.vehicleId(),
            )
        }
        return undefined
    })
    protected readonly driverName: Signal<string | undefined> = computed((): string => `${this.driver()?.participant?.firstName} ${this.driver()?.participant?.lastName?.toUpperCase()}`)

    protected confirmMovementReversion(content: MovementContentModel[]): void {
        const translationKey: string = `movements.actions.confirmations.reverse.${this.movement().type.value}`
        this.confirmationService.confirm(
            this.buildCustomConfirmation(
                `${translationKey}.title`,
                this.pluralTranslation.transform(`${translationKey}.message`, content.length),
                this.reversedIcon(),
                this.movement(),
                SeverityEnum.SUCCESS,
                (): void => this.reverseMovement(content),
            ),
        )
    }

    protected onClickParticipant(event: ListboxClickEvent): void {
        if (this.reversible()) {
            this.participantsLayerOpened = false
            this.confirmMovementReversion([event.option])
        }
    }

    protected reverseMovement(content: MovementContentModel[]): void {
        const reverseMovement: MovementDto = {
            dateTime: new Date(),
            type: this.movement().type.value === MovementTypeEnum.IN ? MovementTypeEnum.OUT : MovementTypeEnum.IN,
            reason: undefined,
            activityId: undefined,
            contentType: this.movement().contentType,
            content: content.map((c: MovementContentModel): MovementContentDto => ({
                poolName: c.poolName,
                participantId: c.participant?.id,
                vehicleId: c.vehicle?.id,
            })),
            guests: [],
        }
        this.facade.createMovement(reverseMovement)
    }
}
