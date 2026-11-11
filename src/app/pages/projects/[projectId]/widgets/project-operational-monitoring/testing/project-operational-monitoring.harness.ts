import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { ListHarness } from '@shared/ui/common/list/testing/list.harness';

/**
 * Objectif: Pilote le widget du suivi opérationnel de l'accueil projet dans les tests.
 * Périmètre: Lit le titre et les onglets (clé et total) et donne la liste de chaque onglet, ou la liste unique sans
 * onglet.
 * Limites: Ne change pas d'onglet ; les lignes de mouvement ont leur propre harness.
 */
export class ProjectOperationalMonitoringHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-project-operational-monitoring';

	private readonly heading = this.locatorFor(byTestId('project-operational-monitoring-title'));
	private readonly tabElements = this.locatorForAll(byTestId('project-operational-monitoring-tab'));

	public readonly lists = this.locatorForAll(ListHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}

	public async tabs(): Promise<{ key: string | null; total: string | undefined }[]> {
		return Promise.all(
			(await this.tabElements()).map(async (tab) => {
				const key = await tab.getAttribute('data-id');
				const total = await this.locatorForOptional(
					`${byTestId('project-operational-monitoring-tab')}[data-id="${key}"] ${byTestId('project-operational-monitoring-tab-total')}`,
				)();
				return { key, total: (await total?.text())?.trim() };
			}),
		);
	}

	public async list(panel: string): Promise<ListHarness> {
		return this.locatorFor(new HarnessPredicate(ListHarness, { ancestor: `sgdf-tab-panel[name="${panel}"]` }))();
	}
}
