import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote une ligne de suivi dans les tests.
 * Périmètre: Lit le titre, le sous-titre, l'indication de régularisation, le statut et sa couleur, et la case à cocher.
 * Limites: Ne lit pas l'icône de l'avatar.
 */
export class MonitoringRowHarness extends ComponentHarness {
	public static readonly hostSelector = '[appMonitoringRow], app-monitoring-row';

	private readonly avatar = this.locatorFor(byTestId('monitoring-row-avatar'));
	private readonly titleElement = this.locatorFor(byTestId('monitoring-row-title'));
	private readonly subtitle = this.locatorForOptional(byTestId('monitoring-row-subtitle'));
	private readonly overdue = this.locatorForOptional(byTestId('monitoring-row-overdue'));
	private readonly status = this.locatorForOptional(byTestId('monitoring-row-status'));
	private readonly checkbox = this.locatorForOptional(byTestId('monitoring-row-checkbox'));

	public async title(): Promise<string> {
		return (await this.titleElement()).text();
	}

	public async subtitleText(): Promise<string | undefined> {
		return (await this.subtitle())?.text();
	}

	public async overdueText(): Promise<string | undefined> {
		return (await this.overdue())?.text();
	}

	public async statusText(): Promise<string | undefined> {
		return (await (await this.status())?.text())?.trim();
	}

	public async variants(): Promise<{ avatar: string; status: string | undefined }> {
		return {
			avatar: await (await this.avatar()).getProperty<string>('variant'),
			status: await (await this.status())?.getProperty<string>('variant'),
		};
	}

	public async selectable(): Promise<boolean> {
		return (await this.checkbox()) !== null;
	}

	public async checked(): Promise<boolean | undefined> {
		return (await this.checkbox())?.getProperty<boolean>('checked');
	}
}
