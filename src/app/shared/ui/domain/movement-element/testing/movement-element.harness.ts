import { ComponentHarness, HarnessPredicate, TestElement } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { ElementActionsHarness } from '@shared/ui/common/element-actions/testing/element-actions.harness';
import { MovementDetailsHarness } from '@shared/ui/domain/movement-element/movement-details/testing/movement-details.harness';
import { MovementParticipantsHarness } from '@shared/ui/domain/movement-element/movement-participants/testing/movement-participants.harness';
import { MovementVehiclesHarness } from '@shared/ui/domain/movement-element/movement-vehicles/testing/movement-vehicles.harness';

export enum MovementDrawerEnum {
	PARTICIPANTS = 'participants',
	COMMUNICATIONS = 'communications',
	VEHICLES = 'vehicles',
}

/**
 * Objectif: Pilote l'élément de liste d'un mouvement dans les tests.
 * Périmètre: Lit le titre, l'avatar, l'état masqué et désactivé, les boutons d'inversion et de communications, les
 * actions, et ouvre ou ferme ses couches ; donne les harnesses de son détail et du contenu de ses couches.
 * Limites: Ne lit pas les communications ni le formulaire de communication, pilotés par leurs propres harnesses.
 */
export class MovementElementHarness extends ComponentHarness {
	public static readonly hostSelector = '[appMovementElement], app-movement-element';

	private readonly titleElement = this.locatorFor(byTestId('movement-element-title'));
	private readonly avatar = this.locatorFor(byTestId('movement-element-avatar'));
	private readonly typeIcon = this.locatorFor(byTestId('movement-element-type-icon'));
	private readonly hiddenTag = this.locatorForOptional(byTestId('movement-element-hidden-tag'));
	private readonly reverseButton = this.locatorForOptional(byTestId('movement-element-reverse-button'));
	private readonly communicationsButton = this.locatorForOptional(byTestId('movement-element-communications-button'));
	private readonly communicationForm = this.locatorForOptional(byTestId('movement-element-communication-form'));

	public readonly details = this.locatorFor(MovementDetailsHarness);
	public readonly participants = this.locatorFor(MovementParticipantsHarness);
	public readonly vehicles = this.locatorFor(MovementVehiclesHarness);
	public readonly actions = this.locatorFor(
		new HarnessPredicate(ElementActionsHarness, { selector: byTestId('movement-element-actions') }),
	);

	public async title(): Promise<string> {
		return (await this.titleElement()).text();
	}

	public async avatarVariant(): Promise<string> {
		return (await this.avatar()).getProperty<string>('variant');
	}

	public async typeIconName(): Promise<string> {
		return (await this.typeIcon()).getProperty<string>('name');
	}

	public async hiddenShown(): Promise<boolean> {
		return (await this.hiddenTag()) !== null;
	}

	public async disabled(): Promise<boolean> {
		return (await this.host()).getProperty<boolean>('disabled');
	}

	public async canReverse(): Promise<boolean> {
		return (await this.reverseButton()) !== null;
	}

	public async reverse(): Promise<void> {
		return (await this.reverseButton())?.click();
	}

	public async canCommunicate(): Promise<boolean> {
		return (await this.communicationsButton()) !== null;
	}

	public async openCommunications(): Promise<void> {
		return (await this.communicationsButton())?.click();
	}

	public async communicationFormShown(): Promise<boolean> {
		return (await this.communicationForm()) !== null;
	}

	public async opened(drawer: MovementDrawerEnum): Promise<boolean> {
		return (await this.drawer(drawer)).getProperty<boolean>('open');
	}

	public async hide(drawer: MovementDrawerEnum): Promise<void> {
		return (await this.drawer(drawer)).dispatchEvent('sgdf-hide');
	}

	private drawer(drawer: MovementDrawerEnum): Promise<TestElement> {
		return this.locatorFor(byTestId(`movement-element-${drawer}-drawer`))();
	}
}
