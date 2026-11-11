import { ComponentHarness, TestElement } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

export enum DetailsButtonEnum {
	DRIVER = 'driver',
	PARTICIPANTS = 'participants',
	VEHICLES = 'vehicles',
}

/**
 * Objectif: Pilote le détail d'un mouvement dans les tests.
 * Périmètre: Lit la date, le squelette, les boutons des personnes, du conducteur et des véhicules, l'étiquette de la
 * dernière communication, et clique sur ces boutons.
 * Limites: N'ouvre aucune couche ; le mouvement parent les détient.
 */
export class MovementDetailsHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-movement-details';

	private readonly date = this.locatorFor(byTestId('movement-details-date'));
	private readonly skeleton = this.locatorForOptional(byTestId('movement-details-skeleton'));
	private readonly communicationTag = this.locatorForOptional(byTestId('movement-details-since-communication'));

	public async dateText(): Promise<string> {
		return (await (await this.date()).text()).trim();
	}

	public async loading(): Promise<boolean> {
		return (await this.skeleton()) !== null;
	}

	public async buttonText(button: DetailsButtonEnum): Promise<string | undefined> {
		return (await (await this.button(button))?.text())?.trim();
	}

	public async click(button: DetailsButtonEnum): Promise<void> {
		return (await this.button(button))?.click();
	}

	public async communicationText(): Promise<string | undefined> {
		return (await (await this.communicationTag())?.text())?.replace(/\s+/g, ' ').trim();
	}

	public async communicationTitle(): Promise<string | null | undefined> {
		return (await this.communicationTag())?.getAttribute('title');
	}

	private button(button: DetailsButtonEnum): Promise<TestElement | null> {
		return this.locatorForOptional(byTestId(`movement-details-${button}-button`))();
	}
}
