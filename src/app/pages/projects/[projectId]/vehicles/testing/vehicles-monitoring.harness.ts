import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId, typeInto } from '@shared/helpers/testing/harness/test-id';
import { ListHarness } from '@shared/ui/common/list/testing/list.harness';
import { MonitoringRowHarness } from '@shared/ui/domain/monitoring-row/testing/monitoring-row.harness';

/**
 * Objectif: Pilote la page du suivi des véhicules dans les tests.
 * Périmètre: Lit le titre, saisit et lit le texte recherché, choisit un statut ; donne la liste et ses lignes.
 * Limites: Ne pilote ni le tri ni les compteurs du haut de page.
 */
export class VehiclesMonitoringHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-vehicles-monitoring';

	private readonly heading = this.locatorFor(byTestId('vehicles-monitoring-title'));
	private readonly query = this.locatorFor(byTestId('vehicles-monitoring-q-input'));
	private readonly status = this.locatorFor(byTestId('vehicles-monitoring-status-select'));

	public readonly list = this.locatorFor(ListHarness);
	public readonly rows = this.locatorForAll(MonitoringRowHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}

	public async searchedText(): Promise<string> {
		return (await this.query()).getProperty<string>('value');
	}

	public async search(text: string): Promise<void> {
		const input = await this.query();
		await typeInto(input, text);
		await input.dispatchEvent('focusout');
	}

	public async chooseStatus(value: string): Promise<void> {
		const select = await this.status();
		await select.setInputValue(value);
		await select.dispatchEvent('change');
	}
}
