import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { FavoriteToggleHarness } from '@shared/ui/common/favorite-toggle/testing/favorite-toggle.harness';

const WIDGETS = [
	'app-project-participant-overview',
	'app-project-vehicle-overview',
	'app-project-participant-regularization',
	'app-project-active-alert',
	'app-project-upcoming-arrival',
	'app-project-upcoming-departure',
	'app-project-birthday',
] as const;

/**
 * Objectif: Pilote la page d'accueil du projet sélectionné dans les tests.
 * Périmètre: Lit le titre, les raccourcis de création, les widgets affichés et le tiroir de création d'alerte ; donne
 * le favori, ouvre et ferme le tiroir.
 * Limites: Chaque widget a son propre harness ; le suivi opérationnel, chargé à la vue, n'est pas lu.
 */
export class ProjectHomeHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-project-home';

	private readonly heading = this.locatorFor(byTestId('project-home-title'));
	private readonly registeredButton = this.locatorForOptional(byTestId('project-home-registered-movement-button'));
	private readonly guestButton = this.locatorForOptional(byTestId('project-home-guest-movement-button'));
	private readonly alertButton = this.locatorForOptional(byTestId('project-home-alert-button'));
	private readonly drawer = this.locatorForOptional(byTestId('project-home-alert-drawer'));
	private readonly alertForm = this.locatorForOptional(byTestId('project-home-alert-form'));

	public readonly favorite = this.locatorFor(FavoriteToggleHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text({ exclude: '[slot="actions"]' })).trim();
	}

	public async movementLinks(): Promise<(string | null)[]> {
		const buttons = [await this.registeredButton(), await this.guestButton()];
		return Promise.all(
			buttons.filter((button) => button !== null).map((button) => button.getProperty<string | null>('href')),
		);
	}

	public async canCreateAlert(): Promise<boolean> {
		return (await this.alertButton()) !== null;
	}

	public async widgets(): Promise<string[]> {
		const shown = await Promise.all(
			WIDGETS.map(async (widget) => ((await this.locatorForOptional(widget)()) ? widget : undefined)),
		);
		return shown.filter((widget): widget is (typeof WIDGETS)[number] => widget !== undefined);
	}

	public async openAlertCreation(): Promise<void> {
		return (await this.alertButton())?.click();
	}

	public async alertCreationShown(): Promise<boolean> {
		return (await this.alertForm()) !== null;
	}

	public async hideAlertDrawer(): Promise<void> {
		return (await this.drawer())?.dispatchEvent('sgdf-hide');
	}
}
