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
import { ClockService } from '@shared/helpers/clock.service'
import { DateHelper } from '@shared/helpers/date.helper'
import { VehicleHelper } from '@shared/helpers/vehicle.helper'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { MovementPrefillService } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-prefill.service'
import { MovementActions } from '@shared/ui/domain/movement-element/movement-actions.service'
import { ElementActionModel } from '@shared/models/model/element-action.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { GenericComponent } from '@shared/ui/base/generic.component'
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component'
import { EllipsisDirective } from '@shared/directives/ellipsis.directive'

/**
 * Purpose: List item presenting one movement with its actions; used as an attribute of `sgdf-list-item`.
 * Scope: Renders the details, the action menu and the layers listing the people and the communications of the movement.
 * Limits: Receives the element as an input; its commands run through the action menu and it holds no list state.
 */
@Component({
    selector: 'sgdf-list-item[appMovementElement], app-movement-element',
    providers: [MovementActions],
    host: { '[disabled]': '!movement().visible' },
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [
        EllipsisDirective,
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
export class MovementElementComponent extends GenericComponent {
    private readonly actionsService: MovementActions = inject(MovementActions)
    private readonly clock: ClockService = inject(ClockService)
    protected readonly prefillService: MovementPrefillService = inject(MovementPrefillService)

    protected readonly VehicleHelper: typeof VehicleHelper = VehicleHelper
    protected readonly MovementTypeEnum: typeof MovementTypeEnum = MovementTypeEnum

    protected readonly participantsLayerOpened: ModelSignal<boolean> = model<boolean>(false)
    protected readonly communicationsLayerOpened: ModelSignal<boolean> = model<boolean>(false)

    public readonly actionMenuVisible: InputSignal<boolean> = input(true)
    public readonly movement: InputSignal<MovementModel> = input.required()
    public readonly communicable: InputSignal<boolean> = input(false)
    public readonly vehicleId: InputSignal<string | undefined> = input()

    protected readonly actions: Signal<ElementActionModel[]> = computed((): ElementActionModel[] => this.actionsService.actionsFor(this.movement()))

    protected readonly typeIconName: Signal<string> = computed((): string =>
        this.movement().type.value === MovementTypeEnum.OUT ? 'arrow-up' : 'arrow-down',
    )

    private readonly hasCommunicationOption: Signal<boolean> = this.sessionFacade.selectedProjectHasOption(ProjectOptionEnum.COMMUNICATION)

    protected readonly communication: Signal<boolean> = computed((): boolean =>
        this.communicable() && this.hasCommunicationOption(),
    )

    private readonly lastCommunication: Signal<Date | undefined> = computed((): Date | undefined =>
        this.communication() ? this.movement().lastCommunicationDateTime : undefined,
    )

    protected readonly daysSinceLastCommunication: Signal<number> = computed((): number => {
        const last: Date | undefined = this.lastCommunication()
        return last ? DateHelper.elapsedDays(last, this.clock.now()) : 0
    })

    protected readonly sinceLastCommunication: Signal<string | undefined> = computed((): string | undefined => {
        const last: Date | undefined = this.lastCommunication()
        return last ? DateHelper.formatElapsed(last, this.clock.now()) : undefined
    })

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

    protected reverse(contents?: MovementContentModel[]): void {
        this.prefillService.openReverse(this.movement(), contents)
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
}
