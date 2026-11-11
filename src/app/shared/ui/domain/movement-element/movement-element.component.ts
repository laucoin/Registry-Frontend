import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, model, Signal } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { EllipsisDirective } from '@shared/directives/ellipsis.directive';
import { EventHelper } from '@shared/helpers/event.helper';
import { MovementHelper } from '@shared/helpers/movement.helper';
import { MovementPrefillService } from '@shared/helpers/movement-prefill.service';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementContentModel } from '@shared/models/model/movement-content.model';
import { MovementReasonModel } from '@shared/models/model/movement-reason.model';
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component';
import { CommunicationFormComponent } from '@shared/ui/domain/communication-form/communication-form.component';
import { MovementCommunicationsListComponent } from '@shared/ui/domain/movement-communications-list/movement-communications-list.component';
import { MovementActions } from '@shared/ui/domain/movement-element/movement-actions.service';
import { MovementDetailsComponent } from '@shared/ui/domain/movement-element/movement-details/movement-details.component';
import { MovementParticipantsComponent } from '@shared/ui/domain/movement-element/movement-participants/movement-participants.component';
import { MovementVehiclesComponent } from '@shared/ui/domain/movement-element/movement-vehicles/movement-vehicles.component';

import '@sgdf/ui/avatar';
import '@sgdf/ui/button';
import '@sgdf/ui/drawer';
import '@sgdf/ui/icon';
import '@sgdf/ui/tag';

/**
 * Objectif: Élément de liste présentant un mouvement avec ses actions ; utilisé comme attribut de `sgdf-list-item`.
 * Périmètre: Affiche le détail, le menu d'actions et les couches listant les personnes et les communications du mouvement.
 * Limites: Reçoit l'élément en entrée ; ses commandes passent par le menu d'actions et il ne détient aucun état de liste.
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
		PluralTranslationPipe,
		MovementDetailsComponent,
		MovementParticipantsComponent,
		MovementVehiclesComponent,
		MovementCommunicationsListComponent,
		CommunicationFormComponent,
	],
	templateUrl: './movement-element.component.html',
})
export class MovementElementComponent {
	protected readonly uiFacade = inject(UiFacade);
	private readonly sessionFacade = inject(SessionFacade);
	private readonly actionsService = inject(MovementActions);
	protected readonly prefillService = inject(MovementPrefillService);

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

	protected readonly typeAndReason = computed(() => this.buildTypeAndReason());
	protected readonly total: Signal<number> = computed((): number => this.movement().content.length);
	protected readonly vehicles = computed(() => MovementHelper.getVehicles(this.movement()));

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

	private buildTypeAndReason(): string {
		let text: string = this.movement().type.label ?? '';
		const reason: MovementReasonModel | undefined = this.movement().reason;
		if (reason) {
			text += ` - ${reason.label}`;
		}
		return text;
	}
}
