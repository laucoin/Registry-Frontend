import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote la carte de synthèse d'un projet dans les tests.
 * Périmètre: Lit le titre, le total, les compteurs et la date d'actualisation, et suit le lien vers le détail.
 * Limites: Ne lit pas l'icône ni la mise en page des compteurs.
 */
export class ProjectOverviewCardHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-project-overview-card';

	private readonly heading = this.locatorFor(byTestId('project-overview-card-title'));
	private readonly totalTag = this.locatorForOptional(byTestId('project-overview-card-total'));
	private readonly labels = this.locatorForAll(byTestId('project-overview-card-stat-label'));
	private readonly values = this.locatorForAll(byTestId('project-overview-card-stat-value'));
	private readonly refresh = this.locatorForOptional(byTestId('project-overview-card-last-refresh'));
	private readonly seeAll = this.locatorForOptional(byTestId('project-overview-card-see-all-button'));

	public async title(): Promise<string> {
		return (await this.heading()).text();
	}

	public async totalText(): Promise<string | undefined> {
		return (await (await this.totalTag())?.text())?.trim();
	}

	public async stats(): Promise<{ label: string; value: string }[]> {
		const labels = await this.labels();
		const values = await this.values();
		return Promise.all(
			labels.map(async (label, index) => ({ label: await label.text(), value: await values[index].text() })),
		);
	}

	public async lastRefreshText(): Promise<string | undefined> {
		return (await (await this.refresh())?.text())?.trim();
	}

	public async hasLink(): Promise<boolean> {
		return (await this.seeAll()) !== null;
	}

	public async followLink(): Promise<void> {
		return (await this.seeAll())?.click();
	}
}
