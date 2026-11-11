import { ComponentHarness } from '@angular/cdk/testing';

import { AlertsSearchFieldsHarness } from '@pages/projects/[projectId]/alerts/alerts-list/alerts-search-fields/testing/alerts-search-fields.harness';
import { AlertsStatisticsHarness } from '@pages/projects/[projectId]/alerts/alerts-list/alerts-statistics/testing/alerts-statistics.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { ListHarness } from '@shared/ui/common/list/testing/list.harness';

/**
 * Objectif: Pilote la page de la liste des alertes dans les tests.
 * Périmètre: Donne les statistiques, la liste et les champs de recherche, et lit le titre et les lignes affichées.
 * Limites: Ne pilote pas le contenu d'une ligne ; le harness de l'élément d'alerte le fait.
 */
export class AlertsListHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-alerts-list';

	private readonly heading = this.locatorFor(byTestId('alerts-list-title'));
	private readonly rowElements = this.locatorForAll(byTestId('alert-row'));

	public readonly statistics = this.locatorFor(AlertsStatisticsHarness);
	public readonly list = this.locatorFor(ListHarness);
	public readonly search = this.locatorFor(AlertsSearchFieldsHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}

	public async rows(): Promise<string[]> {
		return Promise.all((await this.rowElements()).map(async (row) => (await row.getAttribute('data-id')) ?? ''));
	}
}
