import { ComponentHarness, TestElement } from '@angular/cdk/testing';

import { byTestId, typeInto } from '@shared/helpers/testing/harness/test-id';

export interface GuestView {
	firstName: string;
	lastName: string;
	removable: boolean;
}

/**
 * Objectif: Pilote la saisie des invités d'un mouvement dans les tests.
 * Périmètre: Lit le titre et les invités, saisit leur nom, ajoute un invité, en retire un et lit l'erreur de la liste.
 * Limites: Ne saisit pas la date de naissance.
 */
export class GuestListFieldsHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-guest-list-fields';

	private readonly heading = this.locatorFor('h2');
	private readonly items = this.locatorForAll(byTestId('guest-list-fields-guest-item'));
	private readonly addButton = this.locatorFor(byTestId('guest-list-fields-add-button'));
	private readonly errorElement = this.locatorFor(byTestId('guest-list-fields-error'));

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}

	public async guests(): Promise<GuestView[]> {
		return Promise.all((await this.items()).map((_, index) => this.guestView(index)));
	}

	public async typeName(index: number, firstName: string, lastName: string): Promise<void> {
		await typeInto(await this.field(index, 'first-name-input'), firstName);
		await typeInto(await this.field(index, 'last-name-input'), lastName);
	}

	public async add(): Promise<void> {
		return (await this.addButton()).click();
	}

	public async remove(index: number): Promise<void> {
		return (await this.field(index, 'remove-button')).click();
	}

	public async error(): Promise<string> {
		return (await (await this.errorElement()).text()).trim();
	}

	private async field(index: number, testId: string): Promise<TestElement> {
		return (await this.locatorForAll(byTestId(`guest-list-fields-${testId}`))())[index];
	}

	private async guestView(index: number): Promise<GuestView> {
		return {
			firstName: (await (await this.field(index, 'first-name-input')).getProperty<string>('value')) ?? '',
			lastName: (await (await this.field(index, 'last-name-input')).getProperty<string>('value')) ?? '',
			removable: !(await (await this.field(index, 'remove-button')).getProperty<boolean>('disabled')),
		};
	}
}
