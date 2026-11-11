import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { SectionErrorHarness } from '@shared/ui/common/section-error/testing/section-error.harness';
import { SkeletonListHarness } from '@shared/ui/common/skeleton-list/testing/skeleton-list.harness';

/**
 * Objectif: Pilote le widget des invitations de l'accueil dans les tests.
 * Périmètre: Lit le titre, le total, le chargement, l'état vide et les invitations ; accepte ou refuse une invitation,
 * suit le lien vers toutes les invitations et donne l'erreur de section.
 * Limites: Ne lit pas les libellés accessibles des boutons.
 */
export class HomeInvitationsHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-home-invitations';

	private readonly heading = this.locatorFor(byTestId('widget-card-title'));
	private readonly totalTag = this.locatorForOptional(byTestId('widget-card-total'));
	private readonly loadingSkeleton = this.locatorForOptional(SkeletonListHarness);
	private readonly emptyText = this.locatorForOptional(byTestId('widget-card-empty'));
	private readonly rows = this.locatorForAll(byTestId('home-invitations-row'));
	private readonly acceptButtons = this.locatorForAll(byTestId('home-invitations-accept-button'));
	private readonly refuseButtons = this.locatorForAll(byTestId('home-invitations-refuse-button'));
	private readonly seeAllButton = this.locatorFor(byTestId('home-invitations-see-all-button'));

	public readonly error = this.locatorForOptional(SectionErrorHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}

	public async total(): Promise<string | undefined> {
		return (await (await this.totalTag())?.text())?.trim();
	}

	public async loadingShown(): Promise<boolean> {
		return (await this.loadingSkeleton()) !== null;
	}

	public async empty(): Promise<string | undefined> {
		return (await (await this.emptyText())?.text())?.trim();
	}

	public async invitations(): Promise<{ project: string; role: string }[]> {
		const rows = await this.rows();
		return Promise.all(
			rows.map(async (row) => {
				const scope = `${byTestId('home-invitations-row')}[data-id="${await row.getAttribute('data-id')}"]`;
				const text = async (testId: string): Promise<string> =>
					(await (await this.locatorFor(`${scope} ${byTestId(testId)}`)()).text()).trim();
				return {
					project: await text('home-invitations-row-project'),
					role: await text('home-invitations-row-role'),
				};
			}),
		);
	}

	public async accept(index: number): Promise<void> {
		return (await this.acceptButtons())[index].click();
	}

	public async refuse(index: number): Promise<void> {
		return (await this.refuseButtons())[index].click();
	}

	public async seeAll(): Promise<void> {
		return (await this.seeAllButton()).click();
	}
}
