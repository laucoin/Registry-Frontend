import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { SectionErrorHarness } from '@shared/ui/common/section-error/testing/section-error.harness';
import { SkeletonListHarness } from '@shared/ui/common/skeleton-list/testing/skeleton-list.harness';

/**
 * Objectif: Pilote le widget des anniversaires de l'accueil projet dans les tests.
 * Périmètre: Lit le titre, le total, l'état vide, les lignes (nom et détail) et le nombre d'anniversaires non affichés ;
 * donne le squelette et l'erreur.
 * Limites: Ne lit pas les icônes.
 */
export class ProjectBirthdayHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-project-birthday';

	private readonly heading = this.locatorFor(byTestId('widget-card-title'));
	private readonly totalTag = this.locatorForOptional(byTestId('widget-card-total'));
	private readonly emptyText = this.locatorForOptional(byTestId('widget-card-empty'));
	private readonly moreText = this.locatorForOptional(byTestId('project-birthday-more'));
	private readonly rowElements = this.locatorForAll(byTestId('birthday-row'));

	public readonly skeleton = this.locatorForOptional(SkeletonListHarness);
	public readonly error = this.locatorForOptional(SectionErrorHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}

	public async total(): Promise<string | undefined> {
		return (await (await this.totalTag())?.text())?.trim();
	}

	public async empty(): Promise<string | undefined> {
		return (await (await this.emptyText())?.text())?.trim();
	}

	public async more(): Promise<string | undefined> {
		return (await (await this.moreText())?.text())?.trim();
	}

	public async rows(): Promise<{ name: string; detail: string }[]> {
		return Promise.all(
			(await this.rowElements()).map(async (row) => {
				const detail = await this.locatorFor(
					`${byTestId('birthday-row')}[data-id="${await row.getAttribute('data-id')}"] ${byTestId('birthday-row-detail')}`,
				)();
				return {
					name: (await row.text({ exclude: byTestId('birthday-row-detail') })).trim(),
					detail: (await detail.text()).replace(/\s+/g, ' ').trim(),
				};
			}),
		);
	}
}
