import { ComponentHarness, ComponentHarnessConstructor, HarnessPredicate } from '@angular/cdk/testing';

import { GroupMembersPanelHarness } from '@pages/projects/[projectId]/participants/group-status-list/group-members-panel/testing/group-members-panel.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { LoadMoreHarness } from '@shared/ui/common/load-more/testing/load-more.harness';
import { SectionErrorHarness } from '@shared/ui/common/section-error/testing/section-error.harness';

function withTestId<T extends ComponentHarness>(
	type: ComponentHarnessConstructor<T>,
	testId: string,
): HarnessPredicate<T> {
	return new HarnessPredicate(type, {}).add(
		testId,
		async (harness) => (await (await harness.host()).getAttribute('data-test-id')) === testId,
	);
}

export interface GroupRowView {
	name: string;
	expanded: boolean;
	onSite: string;
	outside: string | undefined;
	overdue: string | undefined;
	checked: string | undefined;
}

/**
 * Objectif: Pilote la liste des groupes du suivi des participants dans les tests.
 * Périmètre: Lit le chargement, l'état vide et chaque groupe (nom, ouverture, compteurs) ; ouvre un groupe et donne ses
 * membres, l'erreur et le chargement de la suite des groupes.
 * Limites: Les membres d'un groupe ont leur propre harness.
 */
export class GroupStatusListHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-group-status-list';

	private readonly skeleton = this.locatorForOptional(byTestId('group-status-list-loading-accordion'));
	private readonly emptyCallout = this.locatorForOptional(byTestId('group-status-list-empty-callout'));
	private readonly groupElements = this.locatorForAll(byTestId('group-row'));

	public readonly error = this.locatorForOptional(withTestId(SectionErrorHarness, 'group-status-list-groups-error'));
	public readonly loadMore = this.locatorForOptional(
		withTestId(LoadMoreHarness, 'group-status-list-groups-load-more'),
	);

	public async loadingShown(): Promise<boolean> {
		return (await this.skeleton()) !== null;
	}

	public async emptyShown(): Promise<boolean> {
		return (await this.emptyCallout()) !== null;
	}

	public async groups(): Promise<GroupRowView[]> {
		const groups = await this.groupElements();
		return Promise.all(groups.map(async (group) => this.groupView(await group.getAttribute('data-id'))));
	}

	public async open(id: string): Promise<void> {
		return (await this.locatorFor(this.scope(id))()).dispatchEvent('sgdf-after-expand');
	}

	public async members(id: string): Promise<GroupMembersPanelHarness | null> {
		return this.locatorForOptional(new HarnessPredicate(GroupMembersPanelHarness, { ancestor: this.scope(id) }))();
	}

	private scope(id: string): string {
		return `${byTestId('group-row')}[data-id="${id}"]`;
	}

	private async groupView(id: string | null): Promise<GroupRowView> {
		const scope = this.scope(id ?? '');
		const text = async (testId: string): Promise<string | undefined> =>
			(await (await this.locatorForOptional(`${scope} ${byTestId(testId)}`)())?.text())
				?.replace(/\s+/g, ' ')
				.trim();
		return {
			name: (await text('group-row-name')) ?? '',
			expanded: await (await this.locatorFor(scope)()).getProperty<boolean>('expanded'),
			onSite: (await text('group-row-on-site')) ?? '',
			outside: await text('group-row-outside'),
			overdue: await text('group-row-overdue'),
			checked: await text('group-row-checked'),
		};
	}
}
