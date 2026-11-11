import { ComponentHarness, TestKey } from '@angular/cdk/testing';

import { byTestId, typeInto } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote le champ du titre d'une nouvelle alerte dans les tests.
 * Périmètre: Saisit et lit le titre, lit son erreur, soumet par Entrée et retire le champ.
 * Limites: Ne lit pas le libellé du champ.
 */
export class CommunicationNewAlertFieldHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-communication-new-alert-field';

	private readonly input = this.locatorFor(byTestId('communication-new-alert-field-title-input'));
	private readonly removeButton = this.locatorFor(byTestId('communication-new-alert-field-remove-button'));

	public async type(title: string): Promise<void> {
		return typeInto(await this.input(), title);
	}

	public async value(): Promise<string> {
		return (await this.input()).getProperty<string>('value');
	}

	public async error(): Promise<string | null> {
		return (await this.input()).getAttribute('error');
	}

	public async pressEnter(): Promise<void> {
		return (await this.input()).sendKeys(TestKey.ENTER);
	}

	public async remove(): Promise<void> {
		return (await this.removeButton()).click();
	}
}
