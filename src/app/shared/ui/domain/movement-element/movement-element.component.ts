import { Component, computed, inject, input, InputSignal, Signal, signal, WritableSignal} from '@angular/core'
import {MovementModel} from '@shared/models/model/movement.model'
import {MovementFacade} from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import {ElementCardComponent} from '@shared/ui/common/element-card/element-card.component'
import {KeyValuePipe, TitleCasePipe, UpperCasePipe} from '@angular/common'
import {TranslocoPipe} from '@jsverse/transloco'
import {TagModule} from 'primeng/tag'
import {MovementContentModel} from '@shared/models/model/movement-content.model'
import {LayerComponent} from '@shared/ui/common/layer/layer.component'
import {ListboxClickEvent, ListboxModule} from 'primeng/listbox'
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs'
import {Avatar} from 'primeng/avatar'
import {RegistryRouteEnum} from '@core/routing/registry-route.enum'
import {SeverityTagComponent} from '@shared/ui/common/severity-tag/severity-tag.component'
import {Skeleton} from 'primeng/skeleton'
import {GenericElementComponent} from '@shared/ui/base/generic-element.component'
import {MovementHelper} from '@shared/helpers/movement.helper'
import {VehicleHelper} from '@shared/helpers/vehicle.helper'
import {PluralTranslationPipe} from '@shared/helpers/pipe/plural-translation.pipe'
import {DateFormatPipe} from '@shared/helpers/pipe/date-format.pipe'
import {SeverityCircleComponent} from '@shared/ui/common/severity-circle/severity-circle.component'
import {MovementTypeEnum} from '@shared/models/enumeration/movement-type.enum'
import {ProjectAuthorityEnum} from '@shared/models/enumeration/project-authority.enum'
import {SeverityEnum} from '@shared/models/enumeration/severity.enum'
import {ElementActionEnum} from '@shared/models/enumeration/element-action.enum'
import {ProjectOptionIconPipe} from '@shared/helpers/pipe/project-option-icon.pipe'
import {ProjectOptionEnum} from '@shared/models/enumeration/project-option.enum'
import {TruncatePipe} from '@shared/helpers/pipe/truncate.pipe'
import {Button} from 'primeng/button'
import {MovementDto} from '@pages/projects/[projectId]/movements/data/dto/movement.dto'
import {MovementContentDto} from '@pages/projects/[projectId]/movements/data/dto/movement-content.dto'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {FormControl, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms'
import {RegistryValidators} from '@shared/helpers/registry.validator'
import {MenuItem} from 'primeng/api'
import {Dialog} from 'primeng/dialog'
import {Menu} from 'primeng/menu'
import {Popover} from 'primeng/popover'
import {Ripple} from 'primeng/ripple'
import {
    MovementCommunicationsListComponent,
} from '@pages/projects/[projectId]/movements/movement-communications-list/movement-communications-list.component'

@Component({
    selector: 'app-movement-element',
    imports: [
        ElementCardComponent,
        TranslocoPipe,
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
    styleUrl: './movement-element.component.css',
})
export class MovementElementComponent extends GenericElementComponent {
    protected readonly facade: MovementFacade = inject(MovementFacade)
    protected readonly pluralTranslation: PluralTranslationPipe = inject(PluralTranslationPipe)

    protected readonly VehicleHelper: typeof VehicleHelper = VehicleHelper
    protected readonly MovementTypeEnum: typeof MovementTypeEnum = MovementTypeEnum

    protected readonly participantLayerActiveTab: WritableSignal<number> = signal(1)
    protected readonly participantsLayerOpened: WritableSignal<boolean> = signal(false)
    protected readonly communicationsLayerOpened: WritableSignal<boolean> = signal(false)

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
                    RegistryRouteEnum.PROJECTS_MOVEMENTS_EDITION.replace(':movementId', this.movement().id).replace(':projectId', this.sessionFacade.currentProjectId() ?? ''),
                ).catch(console.error)
            },
        },
        {
            label: 'movements.actions.disable',
            icon: 'pi pi-eye-slash',
            disabled: this.busy() || !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_U),
            visible: this.actionIsEnable(ElementActionEnum.MOVEMENT_DISABLE) && this.movement().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'movements.actions.confirmations.disable',
                        'pi pi-exclamation-triangle',
                        this.movement(),
                        SeverityEnum.WARNING,
                        (): void => this.run(this.facade.disableMovement(this.movement().id)),
                    ),
                )
            },
        },
        {
            label: 'movements.actions.enable',
            icon: 'pi pi-replay',
            disabled: this.busy() || !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_U),
            visible: this.actionIsEnable(ElementActionEnum.MOVEMENT_ENABLE) && !this.movement().visible,
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'movements.actions.confirmations.enable',
                        'pi pi-info-circle',
                        this.movement(),
                        SeverityEnum.INFO,
                        (): void => this.run(this.facade.enableMovement(this.movement().id)),
                    ),
                )
            },
        },
        {
            label: 'movements.actions.delete',
            icon: 'pi pi-trash',
            disabled: this.busy() || !this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_D),
            visible: this.actionIsEnable(ElementActionEnum.MOVEMENT_DELETE),
            command: (): void => {
                this.confirmationService.confirm(
                    this.buildConfirmation(
                        'movements.actions.confirmations.delete',
                        'pi pi-exclamation-triangle',
                        this.movement(),
                        SeverityEnum.DANGER,
                        (): void => this.run(this.facade.deleteMovement(this.movement())),
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
        if (GenericHelper.nonNull(this.movement().reason)) {
            text += ` - ${this.movement().reason!.label}`
        }
        return text
    })
    protected readonly total: Signal<number> = computed((): number => this.movement().content.length)
    protected readonly adults: Signal<MovementContentModel[]> = computed((): MovementContentModel[] => MovementHelper.getAdults(
        this.movement()))
    protected readonly children: Signal<MovementContentModel[]> = computed((): MovementContentModel[] => MovementHelper.getChildren(
        this.movement()))
    protected readonly pools: Signal<Record<string, MovementContentModel[]>> = computed((): Record<string, MovementContentModel[]> => MovementHelper.getPools(
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
            this.participantsLayerOpened.set(false)
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
        this.run(this.facade.createMovement(reverseMovement))
    }
}
