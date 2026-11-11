import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { AvailabilityPeriodHarness } from '@shared/ui/common/availability-period/testing/availability-period.harness';
import { ElementActionsHarness } from '@shared/ui/common/element-actions/testing/element-actions.harness';
import { ElementPrimaryActionHarness } from '@shared/ui/common/element-primary-action/testing/element-primary-action.harness';
import { FavoriteToggleHarness } from '@shared/ui/common/favorite-toggle/testing/favorite-toggle.harness';

export enum InvitationAnswerEnum {
	ACCEPT = 'accept',
	REJECT = 'reject',
}

export interface RowView {
	title: string;
	initials: string;
	description: string;
	tags: string[];
	disabled: boolean;
}

/**
 * Objectif: Pilote la ligne d'un profil dans les tests.
 * Périmètre: Lit le titre, les initiales, la description, les étiquettes et l'état désactivé ; donne la période de
 * disponibilité, le favori, les réponses à une invitation et le menu d'actions.
 * Limites: Ne lit pas les dates elles-mêmes, mises en forme par le harness de la période.
 */
export class ProjectProfileRowHarness extends ComponentHarness {
	public static readonly hostSelector = '[appProjectProfileRow]';

	private readonly titleElement = this.locatorFor(byTestId('project-profile-row-name'));
	private readonly descriptionElement = this.locatorFor(byTestId('project-profile-row-description'));
	private readonly avatar = this.locatorFor('sgdf-avatar');
	private readonly tagElements = this.locatorForAll('sgdf-tag');

	public readonly period = this.locatorForOptional(AvailabilityPeriodHarness);
	public readonly primary = this.locatorForOptional(ElementPrimaryActionHarness);
	public readonly actions = this.locatorFor(
		new HarnessPredicate(ElementActionsHarness, { selector: byTestId('project-profile-row-actions') }),
	);

	public async view(): Promise<RowView> {
		const host = await this.host();
		return {
			title: (await (await this.titleElement()).text()).trim(),
			initials: (await (await this.avatar()).getProperty<string>('initials')) ?? '',
			description: (await (await this.descriptionElement()).text()).replace(/\s+/g, ' ').trim(),
			tags: await Promise.all((await this.tagElements()).map(async (tag) => (await tag.text()).trim())),
			disabled: await host.getProperty<boolean>('disabled'),
		};
	}

	public async statusVariant(): Promise<string> {
		return (
			(await (
				await this.locatorFor(byTestId('project-profile-row-status-tag'))()
			).getProperty<string>('variant')) ?? ''
		);
	}

	public async favorite(): Promise<FavoriteToggleHarness | null> {
		return this.locatorForOptional(FavoriteToggleHarness)();
	}

	public async answers(): Promise<string[]> {
		const buttons = await this.locatorForAll(
			`${byTestId('project-profile-row-reject-button')}, ${byTestId('project-profile-row-accept-button')}`,
		)();
		return Promise.all(buttons.map(async (button) => (await button.getAttribute('data-test-id')) ?? ''));
	}

	public async answer(answer: InvitationAnswerEnum): Promise<void> {
		return (await this.locatorFor(byTestId(`project-profile-row-${answer}-button`))()).click();
	}

	public async avatarVariant(): Promise<string> {
		return (await (await this.locatorFor('sgdf-avatar')()).getProperty<string>('variant')) ?? '';
	}
}
