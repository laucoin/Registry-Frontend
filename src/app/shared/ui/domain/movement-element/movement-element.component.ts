import { KeyValuePipe, NgTemplateOutlet, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, model, Signal } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { MovementPrefillService } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-prefill.service';
import { EllipsisDirective } from '@shared/directives/ellipsis.directive';
import { ClockService } from '@shared/helpers/clock.service';
import { DateHelper } from '@shared/helpers/date.helper';
import { EventHelper } from '@shared/helpers/event.helper';
import { MovementHelper } from '@shared/helpers/movement.helper';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { TruncatePipe } from '@shared/helpers/pipe/truncate.pipe';
import { VehicleHelper } from '@shared/helpers/vehicle.helper';
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementContentModel } from '@shared/models/model/movement-content.model';
import { MovementReasonModel } from '@shared/models/model/movement-reason.model';
import { GenericComponent } from '@shared/ui/base/generic.component';
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component';
import { CommunicationFormComponent } from '@shared/ui/domain/communication-form/communication-form.component';
import { MovementCommunicationsListComponent } from '@shared/ui/domain/movement-communications-list/movement-communications-list.component';
import { MovementActions } from '@shared/ui/domain/movement-element/movement-actions.service';

import '@sgdf/ui/avatar';
import '@sgdf/ui/button';
import '@sgdf/ui/drawer';
import '@sgdf/ui/list';
import '@sgdf/ui/tab-group';
import '@sgdf/ui/icon';
import '@sgdf/ui/list-item';
import '@sgdf/ui/skeleton';
import '@sgdf/ui/tag';

/**
 * Purpose: Élément de liste présentant un mouvement avec ses actions ; utilisé comme attribut de `sgdf-list-item`.
 * Scope: Affiche le détail, le menu d'actions et les couches listant les personnes et les communications du mouvement.
 * Limits: Reçoit l'élément en entrée ; ses commandes passent par le menu d'actions et il ne détient aucun état de liste.
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
	private readonly actionsService = inject(MovementActions);
	private readonly clock = inject(ClockService);
	protected readonly prefillService = inject(MovementPrefillService);

	protected readonly VehicleHelper = VehicleHelper;
	protected readonly MovementTypeEnum = MovementTypeEnum;

	protected readonly participantsLayerOpened = model<boolean>(false);
	protected readonly vehiclesLayerOpened = model<boolean>(false);
	protected readonly communicationsLayerOpened = model<boolean>(false);

	public readonly actionMenuVisible = input(true);
	public readonly movement: InputSignal<MovementModel> = input.required();
	public readonly communicable = input(false);
	public readonly reversible = input(false);
	public readonly vehicleId: InputSignal<string | undefined> = input();

	protected readonly actions = computed(() => this.actionsService.actionsFor(this.movement()));

	protected readonly typeIconName: Signal<string> = computed((): string =>
		this.movement().type.value === MovementTypeEnum.OUT ? 'arrow-up' : 'arrow-down',
	);

	private readonly hasCommunicationOption = this.sessionFacade.selectedProjectHasOption(
		ProjectOptionEnum.COMMUNICATION,
	);

	protected readonly communication = computed(() => this.communicable() && this.hasCommunicationOption());

	private readonly lastCommunication: Signal<Date | undefined> = computed((): Date | undefined =>
		this.communication() ? this.movement().lastCommunicationDateTime : undefined,
	);

	protected readonly daysSinceLastCommunication = computed(() => this.buildDaysSinceLastCommunication());

	protected readonly sinceLastCommunication = computed(() => this.buildSinceLastCommunication());

	protected readonly typeAndReason = computed(() => this.buildTypeAndReason());
	protected readonly vehiclesCount = computed(
		() =>
			new Set(
				this.movement().content.flatMap((content: MovementContentModel): string[] =>
					content.vehicle ? [content.vehicle.id] : [],
				),
			).size,
	);
	protected readonly total: Signal<number> = computed((): number => this.movement().content.length);
	protected readonly adults = computed(() => MovementHelper.getAdults(this.movement()));
	protected readonly children = computed(() => MovementHelper.getChildren(this.movement()));
	protected readonly independent = computed(() => MovementHelper.getIndependent(this.movement()));
	protected readonly vehicles = computed(() => MovementHelper.getVehicles(this.movement()));
	protected readonly pools = computed(() => MovementHelper.getPools(this.movement()));
	protected readonly driver = computed(() => this.buildDriver());
	protected readonly driverName = computed(() => this.buildDriverName());

	protected reverse(contents?: MovementContentModel[]): void {
		this.prefillService.openReverse(this.movement(), contents);
	}

	protected closeParticipants(event: Event): void {
		if (EventHelper.isFromHost(event)) {
			this.participantsLayerOpened.set(false);
		}
	}

	protected closeVehicles(event: Event): void {
		if (EventHelper.isFromHost(event)) {
			this.vehiclesLayerOpened.set(false);
		}
	}

	protected closeCommunications(event: Event): void {
		if (EventHelper.isFromHost(event)) {
			this.communicationsLayerOpened.set(false);
		}
	}

	private buildDaysSinceLastCommunication(): number {
		const last: Date | undefined = this.lastCommunication();
		return last ? DateHelper.elapsedDays(last, this.clock.now()) : 0;
	}

	private buildSinceLastCommunication(): string | undefined {
		const last: Date | undefined = this.lastCommunication();
		return last ? DateHelper.formatElapsed(last, this.clock.now()) : undefined;
	}

	private buildTypeAndReason(): string {
		let text: string = this.movement().type.label ?? '';
		const reason: MovementReasonModel | undefined = this.movement().reason;
		if (reason) {
			text += ` - ${reason.label}`;
		}
		return text;
	}

	private buildDriver(): MovementContentModel | undefined {
		if (this.vehicleId()) {
			return this.movement().content.find(
				(content: MovementContentModel) => content.vehicle?.id === this.vehicleId(),
			);
		}
		return undefined;
	}

	private buildDriverName(): string {
		const participant = this.driver()?.participant;
		return participant ? `${participant.firstName} ${participant.lastName?.toUpperCase()}` : '';
	}
}
