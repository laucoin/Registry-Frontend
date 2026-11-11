import { TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, output, Signal } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { ClockService } from '@shared/helpers/clock.service';
import { DateHelper } from '@shared/helpers/date.helper';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { TruncatePipe } from '@shared/helpers/pipe/truncate.pipe';
import { DateFormatTypeEnum } from '@shared/models/enumeration/date-format-type.enum';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementContentModel } from '@shared/models/model/movement-content.model';

import '@sgdf/ui/button';
import '@sgdf/ui/icon';
import '@sgdf/ui/skeleton';
import '@sgdf/ui/tag';

interface CommunicationAge {
	days: number;
	elapsed: string;
}

/**
 * Objectif: Détail d'un mouvement sous son titre : date, personnes ou conducteur, dernière communication et véhicules.
 * Périmètre: Calcule le conducteur du véhicule affiché, le nombre de véhicules distincts et le temps écoulé depuis la
 * dernière communication ; demande l'ouverture des couches des personnes et des véhicules.
 * Limites: N'ouvre aucune couche lui-même ; le mouvement parent les détient.
 */
@Component({
	selector: 'app-movement-details',
	imports: [TranslocoPipe, TitleCasePipe, UpperCasePipe, PluralTranslationPipe, DateFormatPipe, TruncatePipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './movement-details.component.html',
})
export class MovementDetailsComponent {
	protected readonly DateFormatTypeEnum = DateFormatTypeEnum;
	private readonly clock = inject(ClockService);

	public readonly movement: InputSignal<MovementModel> = input.required();
	public readonly vehicleId: InputSignal<string | undefined> = input();
	public readonly communication = input(false);

	public readonly participantsOpened = output();
	public readonly vehiclesOpened = output();

	protected readonly total: Signal<number> = computed((): number => this.movement().content.length);
	protected readonly driver = computed(() => this.buildDriver());
	protected readonly firstParticipant = computed(() => this.movement().content[0]?.participant);
	protected readonly vehiclesCount = computed(
		() =>
			new Set(
				this.movement().content.flatMap((content: MovementContentModel): string[] =>
					content.vehicle ? [content.vehicle.id] : [],
				),
			).size,
	);

	private readonly lastCommunication: Signal<Date | undefined> = computed((): Date | undefined =>
		this.communication() ? this.movement().lastCommunicationDateTime : undefined,
	);

	protected readonly communicationAge = computed(() => this.buildCommunicationAge());

	private buildCommunicationAge(): CommunicationAge | undefined {
		const last: Date | undefined = this.lastCommunication();
		if (!last) return undefined;
		const now = this.clock.now();
		return { days: DateHelper.elapsedDays(last, now), elapsed: DateHelper.formatElapsed(last, now) };
	}

	private buildDriver(): MovementContentModel | undefined {
		const vehicleId = this.vehicleId();
		if (!vehicleId) return undefined;
		return this.movement().content.find((content: MovementContentModel) => content.vehicle?.id === vehicleId);
	}
}
