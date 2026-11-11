import { ComponentHarness, ComponentHarnessConstructor, HarnessPredicate } from '@angular/cdk/testing';

import { ParticipantsSearchFieldsHarness } from '@pages/projects/[projectId]/configuration/participants/participants-search-fields/testing/participants-search-fields.harness';
import { GroupStatusListHarness } from '@pages/projects/[projectId]/participants/group-status-list/testing/group-status-list.harness';
import { ParticipantsRollCallHarness } from '@pages/projects/[projectId]/participants/participants-roll-call/testing/participants-roll-call.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { ListHarness } from '@shared/ui/common/list/testing/list.harness';
import { SectionErrorHarness } from '@shared/ui/common/section-error/testing/section-error.harness';

function withTestId<T extends ComponentHarness>(
	type: ComponentHarnessConstructor<T>,
	testId: string,
): HarnessPredicate<T> {
	return new HarnessPredicate(type, {}).add(
		testId,
		async (harness) => (await (await harness.host()).getAttribute('data-test-id')) === testId,
	);
}

/**
 * Objectif: Pilote la page du suivi des participants dans les tests.
 * Périmètre: Lit le titre, le chargement, les onglets (clé et total) et l'onglet actif, montre un onglet ; donne le
 * résumé de l'appel, l'erreur de mes groupes, la liste des groupes de l'onglet affiché, la liste individuelle et ses
 * champs de recherche.
 * Limites: Ne lit pas les compteurs du haut de page.
 */
export class ParticipantsMonitoringHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-participants-monitoring';

	private readonly heading = this.locatorFor(byTestId('participants-monitoring-title'));
	private readonly loadingText = this.locatorForOptional(byTestId('participants-monitoring-loading'));
	private readonly tabGroup = this.locatorForOptional(byTestId('participants-monitoring-tabs'));
	private readonly tabElements = this.locatorForAll(byTestId('participants-monitoring-tab'));

	public readonly rollCall = this.locatorFor(ParticipantsRollCallHarness);
	public readonly error = this.locatorForOptional(withTestId(SectionErrorHarness, 'participants-monitoring-error'));
	public readonly groups = this.locatorForOptional(GroupStatusListHarness);
	public readonly individual = this.locatorForOptional(
		withTestId(ListHarness, 'participants-monitoring-individual-list'),
	);
	public readonly search = this.locatorForOptional(ParticipantsSearchFieldsHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}

	public async loadingShown(): Promise<boolean> {
		return (await this.loadingText()) !== null;
	}

	public async tabs(): Promise<{ key: string | null; total: string | undefined }[]> {
		return Promise.all(
			(await this.tabElements()).map(async (tab) => {
				const key = await tab.getAttribute('data-id');
				const total = await this.locatorForOptional(
					`${byTestId('participants-monitoring-tab')}[data-id="${key}"] ${byTestId('participants-monitoring-tab-total')}`,
				)();
				return { key, total: (await total?.text())?.trim() };
			}),
		);
	}

	public async activeTab(): Promise<string | null | undefined> {
		return (await this.tabGroup())?.getAttribute('active');
	}

	public async showTab(name: string | undefined): Promise<void> {
		return (await this.tabGroup())?.dispatchEvent('sgdf-tab-show', { detail: { name } });
	}
}
