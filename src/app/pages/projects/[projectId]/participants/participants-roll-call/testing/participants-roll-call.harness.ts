import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote le résumé de l'appel du suivi des participants dans les tests.
 * Périmètre: Lit le nombre annoncé, l'état du bouton « tout décocher » et l'avertissement, et décoche tout.
 * Limites: Ne lit pas l'icône de l'avertissement.
 */
export class ParticipantsRollCallHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-participants-roll-call';

	private readonly count = this.locatorFor(byTestId('participants-roll-call-count'));
	private readonly uncheckButton = this.locatorFor(byTestId('participants-roll-call-uncheck-all-button'));
	private readonly disclaimerText = this.locatorFor(byTestId('participants-roll-call-disclaimer'));

	public async countText(): Promise<string> {
		return (await (await this.count()).text()).trim();
	}

	public async canUncheck(): Promise<boolean> {
		return !(await (await this.uncheckButton()).getProperty<boolean>('disabled'));
	}

	public async disclaimer(): Promise<string> {
		return (await (await this.disclaimerText()).text()).trim();
	}

	public async uncheckAll(): Promise<void> {
		return (await this.uncheckButton()).click();
	}
}
