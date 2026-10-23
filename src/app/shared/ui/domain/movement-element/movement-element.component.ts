import { notifyOnError } from '@shared/helpers/rx.helper'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { KeyValuePipe, NgTemplateOutlet, TitleCasePipe, UpperCasePipe } from '@angular/common'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, model, ModelSignal, Signal } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/avatar'
import '@sgdf/ui/button'
import '@sgdf/ui/drawer'
import '@sgdf/ui/list'
import '@sgdf/ui/tab-group'
import '@sgdf/ui/icon'
import '@sgdf/ui/list-item'
import '@sgdf/ui/skeleton'
import '@sgdf/ui/tag'
import { MovementContentDto } from '@pages/projects/[projectId]/movements/data/dto/movement-content.dto'
import { GuestMovementDto } from '@pages/projects/[projectId]/movements/data/dto/guest-movement.dto'
import { MovementDto } from '@pages/projects/[projectId]/movements/data/dto/movement.dto'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import {
    MovementCommunicationsListComponent,
} from '@shared/ui/domain/movement-communications-list/movement-communications-list.component'
import { CommunicationFormComponent } from '@shared/ui/domain/communication-form/communication-form.component'
import { EventHelper } from '@shared/helpers/event.helper'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { MovementHelper } from '@shared/helpers/movement.helper'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { TruncatePipe } from '@shared/helpers/pipe/truncate.pipe'
import { VehicleHelper } from '@shared/helpers/vehicle.helper'
import { ElementActionEnum } from '@shared/models/enumeration/element-action.enum'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { MovementActions } from '@shared/ui/domain/movement-element/movement-actions.service'
import { ElementActionModel } from '@shared/models/model/element-action.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { GenericElementComponent } from '@shared/ui/base/generic-element.component'
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component'

/**
 * Purpose: List item presenting one movement with its actions; used as an attribute of `sgdf-list-item`.
 * Scope: Renders the details, the action menu, the reversal and the layers listing the people and the communications of the movement.
 * Limits: Receives the element as an input and calls the facade for commands; it holds no list state.
 */
@Component({
    selector: 'sgdf-list-item[appMovementElement], app-movement-element',
    providers: [MovementActions],
    host: { '[disabled]': '!movement().visible' },
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [
        ElementActionsComponent,
        TranslocoPipe,
        NgTemplateOutlet,
        TitleCasePipe,
        UpperCasePipe,
        KeyValuePipe,
        PluralTranslationPipe,
        DateFormatPipe,
        TruncatePipe,
        MovementCommunicationsListComponent,
        CommunicationFormComponent,
    ],
    templateUrl: './movement-element.component.html',
})
export class MovementElementComponent extends GenericElementComponent {
    protected readonly facade: MovementFacade = inject(MovementFacade)
    private readonly actionsService: MovementActions = inject(MovementActions)
    protected readonly pluralTranslation: PluralTranslationPipe = inject(PluralTranslationPipe)

    protected readonly VehicleHelper: typeof VehicleHelper = VehicleHelper
    protected readonly MovementTypeEnum: typeof MovementTypeEnum = MovementTypeEnum

    protected readonly participantsLayerOpened: ModelSignal<boolean> = model<boolean>(false)
    protected readonly communicationsLayerOpened: ModelSignal<boolean> = model<boolean>(false)

    public readonly actionMenuVisible: InputSignal<boolean> = input(true)
    public readonly movement: InputSignal<MovementModel> = input.required()
    public readonly reversible: InputSignal<boolean> = input(false)
    public readonly communicable: InputSignal<boolean> = input(false)
    public readonly vehicleId: InputSignal<string | undefined> = input()

    protected readonly actions: Signal<ElementActionModel[]> = computed((): ElementActionModel[] => this.actionsService.actionsFor(this.movement()))

    protected readonly reversibleAuthorized: Signal<boolean> = computed((): boolean =>
        this.reversible()
        && this.actionIsEnable(ElementActionEnum.MOVEMENT_REVERSE)
        && this.hasProjectAuthority(ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_C),
    )

    protected readonly reversedIcon: Signal<string> = computed((): string =>
        this.movement().type.value === MovementTypeEnum.IN ? 'pi pi-arrow-up' : 'pi pi-arrow-down',
    )

    protected readonly reversedIconName: Signal<string> = computed((): string =>
        this.movement().type.value === MovementTypeEnum.IN ? 'arrow-up' : 'arrow-down',
    )

    protected readonly typeIconName: Signal<string> = computed((): string =>
        this.movement().type.value === MovementTypeEnum.OUT ? 'arrow-up' : 'arrow-down',
    )

    private readonly hasCommunicationOption: Signal<boolean> = this.sessionFacade.selectedProjectHasOption(ProjectOptionEnum.COMMUNICATION)

    protected readonly communication: Signal<boolean> = computed((): boolean =>
        this.communicable() && this.hasCommunicationOption(),
    )

    protected readonly typeAndReason: Signal<string> = computed((): string => {
        let text: string = this.movement().type.label ?? ''
        if (GenericHelper.nonNull(this.movement().reason)) {
            text += ` - ${this.movement().reason!.label}`
        }
        return text
    })
    protected readonly vehiclesCount: Signal<number> = computed((): number =>
        new Set(this.movement().content.filter((content: MovementContentModel): boolean => !!content.vehicle).map((content: MovementContentModel): string => content.vehicle!.id)).size,
    )
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
    protected readonly driverName: Signal<string> = computed((): string => {
        const participant: ParticipantModel | undefined = this.driver()?.participant
        return participant ? `${participant.firstName} ${participant.lastName?.toUpperCase()}` : ''
    })

    protected confirmMovementReversion(content: MovementContentModel[]): void {
        const translationKey: string = `movements.actions.confirmations.reverse.${this.movement().type.value}`
        this.uiFacade.confirm(
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

    protected reverseOne(content: MovementContentModel): void {
        this.participantsLayerOpened.set(false)
        this.confirmMovementReversion([content])
    }

    protected closeParticipants(event: Event): void {
        if (EventHelper.isFromHost(event)) {
            this.participantsLayerOpened.set(false)
        }
    }

    protected closeCommunications(event: Event): void {
        if (EventHelper.isFromHost(event)) {
            this.communicationsLayerOpened.set(false)
        }
    }

    protected reverseMovement(content: MovementContentModel[]): void {
        const type: string = this.movement().type.value === MovementTypeEnum.IN ? MovementTypeEnum.OUT : MovementTypeEnum.IN
        this.run((this.movement().contentType === ParticipantTypeEnum.GUEST
                  ? this.facade.createGuestMovement(this.reverseGuestMovement(type, content))
                  : this.facade.createRegisteredMovement(this.reverseRegisteredMovement(type, content))
        ).pipe(notifyOnError(this.uiFacade)))
    }

    private reverseRegisteredMovement(type: string, content: MovementContentModel[]): MovementDto {
        return {
            dateTime: new Date(),
            type,
            reason: undefined,
            activityId: undefined,
            content: content.map((c: MovementContentModel): MovementContentDto => ({
                poolName: c.poolName,
                participantId: c.participant?.id,
                vehicleId: c.vehicle?.id,
            })),
        }
    }

    private reverseGuestMovement(type: string, content: MovementContentModel[]): GuestMovementDto {
        return {
            dateTime: new Date(),
            type,
            reason: undefined,
            content: content.map((c: MovementContentModel): { participantId: string } => ({ participantId: c.participant?.id })),
            guests: [],
        }
    }
}
