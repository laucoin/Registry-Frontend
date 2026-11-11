import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';

import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';

import '@sgdf/ui/icon';

/**
 * Objectif: Affiche une période de disponibilité, de son début à sa fin.
 * Périmètre: Met en forme chaque borne et remplace une borne absente par des points de suspension.
 * Limites: Ne décide pas de s'afficher ; le parent ne l'affiche que si une borne au moins est connue.
 */
@Component({
	selector: 'app-availability-period',
	imports: [CustomDateFormatPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	host: { class: 'inline-flex flex-wrap items-center gap-x-2' },
	templateUrl: './availability-period.component.html',
})
export class AvailabilityPeriodComponent {
	public readonly start = input<CustomDatetimeModel | undefined>();
	public readonly end = input<CustomDatetimeModel | undefined>();
}
