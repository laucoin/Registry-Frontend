import { ComponentHarness, TestElement } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

export interface VehicleView {
	label: string;
	warning: string | undefined;
	driver: string;
	drivers: string[];
}

/**
 * Objectif: Pilote le choix des véhicules d'un mouvement dans les tests.
 * Périmètre: Lit les véhicules proposés et choisis avec leur avertissement et leur conducteur ; ouvre et filtre la
 * recherche, choisit un véhicule ou un conducteur, retire un véhicule et indique si la liste est vide.
 * Limites: Aucune.
 */
export class RegisteredVehiclesFieldsHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-registered-vehicles-fields';

	private readonly select = this.locatorFor(byTestId('registered-vehicles-fields-vehicle-select'));
	private readonly optionElements = this.locatorForAll(
		`${byTestId('registered-vehicles-fields-vehicle-select')} sgdf-option`,
	);
	private readonly items = this.locatorForAll(byTestId('registered-vehicles-fields-vehicle-item'));
	private readonly empty = this.locatorForOptional(byTestId('registered-vehicles-fields-empty'));

	public async options(): Promise<string[]> {
		return Promise.all((await this.optionElements()).map(async (option) => (await option.text()).trim()));
	}

	public async open(): Promise<void> {
		return (await this.select()).dispatchEvent('sgdf-show');
	}

	public async search(query: string): Promise<void> {
		return (await this.select()).dispatchEvent('sgdf-search', { detail: { query } });
	}

	public async choose(id: string): Promise<string> {
		const select = await this.select();
		await select.setInputValue(id);
		await select.dispatchEvent('change');
		return (await select.getProperty<string>('value')) ?? '';
	}

	public async vehicles(): Promise<VehicleView[]> {
		const count = (await this.items()).length;
		return Promise.all(Array.from({ length: count }, (_, index) => this.viewOf(index)));
	}

	public async chooseDriver(index: number, id: string): Promise<void> {
		const driver = await this.inRow(index, 'driver-select');
		await driver.setInputValue(id);
		await driver.dispatchEvent('change');
	}

	public async driverError(index: number): Promise<string | null> {
		return (await this.inRow(index, 'driver-select')).getAttribute('error');
	}

	public async remove(index: number): Promise<void> {
		return (await this.inRow(index, 'remove-button')).click();
	}

	public async emptyShown(): Promise<boolean> {
		return (await this.empty()) !== null;
	}

	private row(index: number): string {
		return `${byTestId('registered-vehicles-fields-vehicle-item')}[data-index="${index}"]`;
	}

	private async inRow(index: number, testId: string): Promise<TestElement> {
		return this.locatorFor(`${this.row(index)} ${byTestId(`registered-vehicles-fields-${testId}`)}`)();
	}

	private async viewOf(index: number): Promise<VehicleView> {
		const tag = await this.locatorForOptional(
			`${this.row(index)} ${byTestId('registered-vehicles-fields-warning-tag')}`,
		)();
		const driver = await this.inRow(index, 'driver-select');
		const options = await this.locatorForAll(`${this.row(index)} sgdf-option`)();
		return {
			label: (await (await this.inRow(index, 'vehicle-label')).text()).trim(),
			warning: tag ? (await tag.text()).trim() : undefined,
			driver: (await driver.getProperty<string>('value')) ?? '',
			drivers: await Promise.all(options.map(async (option) => (await option.text()).trim())),
		};
	}
}
