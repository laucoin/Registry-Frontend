import { ComponentHarness } from '@angular/cdk/testing';

import { ActiveAlertCardHarness } from '@pages/projects/[projectId]/widgets/project-active-alert/active-alert-card/testing/active-alert-card.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { SectionErrorHarness } from '@shared/ui/common/section-error/testing/section-error.harness';

/**
 * Objectif: Pilote le widget des alertes ouvertes de l'accueil projet dans les tests.
 * Périmètre: Lit le titre, le total, la règle de criticité, le chargement, l'état vide, le lien vers les alertes et le
 * tiroir des communications ; donne les cartes et l'erreur, et ferme le tiroir.
 * Limites: Le formulaire et la liste des communications ont leurs propres harnesses.
 */
export class ProjectActiveAlertHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-project-active-alert';

	private readonly heading = this.locatorFor(byTestId('widget-card-title'));
	private readonly totalTag = this.locatorForOptional(byTestId('widget-card-total'));
	private readonly ruleCell = this.locatorForOptional(byTestId('project-active-alert-rule'));
	private readonly loadingText = this.locatorForOptional(byTestId('project-active-alert-loading'));
	private readonly emptyText = this.locatorForOptional(byTestId('widget-card-empty'));
	private readonly linkButton = this.locatorFor(byTestId('project-active-alert-link'));
	private readonly drawer = this.locatorFor(byTestId('project-active-alert-drawer'));
	private readonly form = this.locatorForOptional(byTestId('project-active-alert-form'));

	public readonly cards = this.locatorForAll(ActiveAlertCardHarness);
	public readonly error = this.locatorForOptional(SectionErrorHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}

	public async total(): Promise<string | undefined> {
		return (await (await this.totalTag())?.text())?.trim();
	}

	public async rule(): Promise<string | undefined> {
		return (await (await this.ruleCell())?.text())?.trim();
	}

	public async loadingShown(): Promise<boolean> {
		return (await this.loadingText()) !== null;
	}

	public async empty(): Promise<string | undefined> {
		return (await (await this.emptyText())?.text())?.trim();
	}

	public async link(): Promise<{ text: string; href: string | null }> {
		const button = await this.linkButton();
		return { text: (await button.text()).trim(), href: await button.getProperty<string | null>('href') };
	}

	public async drawerTitle(): Promise<string> {
		return (await this.drawer()).getProperty<string>('title');
	}

	public async communicationShown(): Promise<boolean> {
		return (await this.form()) !== null;
	}

	public async hideDrawer(): Promise<void> {
		return (await this.drawer()).dispatchEvent('sgdf-hide');
	}
}
