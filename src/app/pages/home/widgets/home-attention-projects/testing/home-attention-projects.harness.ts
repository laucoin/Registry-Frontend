import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { SectionErrorHarness } from '@shared/ui/common/section-error/testing/section-error.harness';
import { SkeletonListHarness } from '@shared/ui/common/skeleton-list/testing/skeleton-list.harness';

export interface AttentionProjectView {
	name: string;
	alerts: string;
	variant: string;
	link: string | null;
}

/**
 * Objectif: Pilote le widget des projets à surveiller de l'accueil dans les tests.
 * Périmètre: Lit le titre, le compteur, le chargement, l'état vide et les projets listés ; donne l'erreur de section.
 * Limites: Ne lit pas les initiales des projets.
 */
export class HomeAttentionProjectsHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-home-attention-projects';

	private readonly heading = this.locatorFor(byTestId('widget-card-title'));
	private readonly countTag = this.locatorForOptional(byTestId('widget-card-total'));
	private readonly loadingSkeleton = this.locatorForOptional(SkeletonListHarness);
	private readonly emptyText = this.locatorForOptional(byTestId('widget-card-empty'));
	private readonly links = this.locatorForAll(byTestId('home-attention-projects-project-link'));

	public readonly error = this.locatorForOptional(SectionErrorHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}

	public async count(): Promise<string | undefined> {
		return (await (await this.countTag())?.text())?.trim();
	}

	public async loadingShown(): Promise<boolean> {
		return (await this.loadingSkeleton()) !== null;
	}

	public async empty(): Promise<string | undefined> {
		return (await (await this.emptyText())?.text())?.trim();
	}

	public async projects(): Promise<AttentionProjectView[]> {
		const links = await this.links();
		return Promise.all(
			links.map(async (link) => {
				const scope = `${byTestId('home-attention-projects-project-link')}[data-id="${await link.getAttribute('data-id')}"]`;
				const alerts = await this.locatorFor(
					`${scope} ${byTestId('home-attention-projects-project-alerts')}`,
				)();
				return {
					name: (
						await (
							await this.locatorFor(`${scope} ${byTestId('home-attention-projects-project-name')}`)()
						).text()
					).trim(),
					alerts: (await alerts.text()).trim(),
					variant: await alerts.getProperty<string>('variant'),
					link: await link.getAttribute('href'),
				};
			}),
		);
	}
}
