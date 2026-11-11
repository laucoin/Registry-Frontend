import { ComponentHarness, TestElement } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { SectionErrorHarness } from '@shared/ui/common/section-error/testing/section-error.harness';
import { SkeletonListHarness } from '@shared/ui/common/skeleton-list/testing/skeleton-list.harness';

export interface PlannedMovementRowView {
	title: string;
	description: string;
	time: string | undefined;
}

/**
 * Objectif: Pilote la carte des mouvements prévus dans les tests.
 * Périmètre: Lit le titre, le total, les lignes, le message vide et le compteur des mouvements non affichés ; donne le
 * squelette et l'erreur ; lit le lien des lignes et en ouvre une.
 * Limites: Ne lit pas les icônes.
 */
export class PlannedMovementCardHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-planned-movement-card';

	private readonly heading = this.locatorFor(byTestId('widget-card-title'));
	private readonly totalTag = this.locatorForOptional(byTestId('widget-card-total'));
	private readonly empty = this.locatorForOptional(byTestId('widget-card-empty'));
	private readonly more = this.locatorForOptional(byTestId('planned-movement-card-more'));
	private readonly rowElements = this.locatorForAll(byTestId('planned-movement-card-row'));

	public readonly skeleton = this.locatorForOptional(SkeletonListHarness);
	public readonly error = this.locatorForOptional(SectionErrorHarness);

	public async title(): Promise<string> {
		return (await this.heading()).text();
	}

	public async totalText(): Promise<string | undefined> {
		return (await (await this.totalTag())?.text())?.trim();
	}

	public async emptyText(): Promise<string | undefined> {
		return (await this.empty())?.text();
	}

	public async moreText(): Promise<string | undefined> {
		return (await (await this.more())?.text())?.trim();
	}

	public async rows(): Promise<PlannedMovementRowView[]> {
		const rows = await this.rowElements();
		return Promise.all(rows.map(async (row) => this.viewOf(await row.getAttribute('data-id'))));
	}

	public async links(): Promise<(string | undefined)[]> {
		return Promise.all((await this.rowElements()).map((row) => row.getProperty<string | undefined>('href')));
	}

	public async open(index: number): Promise<void> {
		return (await this.rowElements())[index].dispatchEvent('sgdf-navigate');
	}

	private async viewOf(key: string | null): Promise<PlannedMovementRowView> {
		const scope = `${byTestId('planned-movement-card-row')}[data-id="${key}"]`;
		return {
			title: await this.textIn(scope, 'planned-movement-card-row-title'),
			description: (await this.textIn(scope, 'planned-movement-card-row-description'))
				.replace(/\s+/g, ' ')
				.trim(),
			time: await this.optionalTextIn(scope, 'planned-movement-card-row-time'),
		};
	}

	private async textIn(scope: string, testId: string): Promise<string> {
		return (await this.locatorFor(`${scope} ${byTestId(testId)}`)()).text();
	}

	private async optionalTextIn(scope: string, testId: string): Promise<string | undefined> {
		const element: TestElement | null = await this.locatorForOptional(`${scope} ${byTestId(testId)}`)();
		return (await element?.text())?.trim();
	}
}
