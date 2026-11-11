import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote l'affichage d'une période de disponibilité dans les tests.
 * Périmètre: Lit le début et la fin affichés.
 * Limites: Aucune.
 */
export class AvailabilityPeriodHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-availability-period';

	private readonly startElement = this.locatorFor(byTestId('availability-period-start'));
	private readonly endElement = this.locatorFor(byTestId('availability-period-end'));

	public async bounds(): Promise<[string, string]> {
		return [(await (await this.startElement()).text()).trim(), (await (await this.endElement()).text()).trim()];
	}
}
