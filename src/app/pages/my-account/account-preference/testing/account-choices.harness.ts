import { ComponentHarness, TestElement } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

import { AccountPreferenceHarness } from './account-preference.harness';

export interface AccountChoiceView {
	value: string;
	label: string;
}

/**
 * Objectif: Base des harnesses des préférences de la page de compte présentées comme un groupe de choix.
 * Périmètre: Lit le cadre commun, la valeur et l'état du contrôle et ses choix, et en choisit un comme l'utilisateur.
 * Limites: Chaque section donne les `data-test-id` de son contrôle et de ses choix.
 */
export abstract class AccountChoicesHarness extends ComponentHarness {
	protected abstract readonly controlTestId: string;
	protected abstract readonly choiceTestId: string;

	public readonly preference = this.locatorFor(AccountPreferenceHarness);

	public async hasControl(): Promise<boolean> {
		return (await this.locatorForOptional(byTestId(this.controlTestId))()) !== null;
	}

	public async value(): Promise<string> {
		return (await this.control()).getProperty<string>('value');
	}

	public async orientation(): Promise<string> {
		return (await this.control()).getProperty<string>('orientation');
	}

	public async disabled(): Promise<boolean> {
		return (await this.control()).getProperty<boolean>('disabled');
	}

	public async choices(): Promise<AccountChoiceView[]> {
		const choices = await this.locatorForAll(byTestId(this.choiceTestId))();
		return Promise.all(
			choices.map(async (choice) => ({
				value: await choice.getProperty<string>('value'),
				label: (await choice.text()).trim(),
			})),
		);
	}

	public async choose(value: string): Promise<void> {
		const control = await this.control();
		await control.setInputValue(value);
		await control.dispatchEvent('change');
	}

	private async control(): Promise<TestElement> {
		return this.locatorFor(byTestId(this.controlTestId))();
	}
}
