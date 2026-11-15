import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

export enum ProjectAccessEnum {
	SELECT = 'select',
	SUPPORT = 'support',
}

export interface ProjectRowStatusView {
	hidden: boolean;
	status: { label: string; variant: string } | undefined;
	options: string;
	access: ProjectAccessEnum | undefined;
}

/**
 * Objectif: Pilote la fin de ligne d'un projet de la liste dans les tests.
 * Périmètre: Lit les étiquettes, les options et l'accès proposé ; ouvre les options, rejoint le projet ou demande un
 * profil de support.
 * Limites: Ne lit pas les libellés accessibles.
 */
export class ProjectRowStatusHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-project-row-status';

	private readonly hiddenTag = this.locatorForOptional(byTestId('project-row-status-hidden-tag'));
	private readonly statusTag = this.locatorForOptional(byTestId('project-row-status-status-tag'));
	private readonly options = this.locatorFor(
		byTestId('project-row-status-options-button'),
		byTestId('project-row-status-options-tag'),
	);
	private readonly selectButton = this.locatorForOptional(byTestId('project-row-status-select-button'));
	private readonly supportButton = this.locatorForOptional(byTestId('project-row-status-create-support-button'));

	public async view(): Promise<ProjectRowStatusView> {
		const status = await this.statusTag();
		return {
			hidden: (await this.hiddenTag()) !== null,
			status: status
				? { label: (await status.text()).trim(), variant: await status.getProperty<string>('variant') }
				: undefined,
			options: (await (await this.options()).text()).replace(/\s+/g, ' ').trim(),
			access: await this.access(),
		};
	}

	public async openOptions(): Promise<void> {
		return (await this.options()).click();
	}

	public async select(): Promise<void> {
		return (await this.selectButton())?.click();
	}

	public async requestSupport(): Promise<void> {
		return (await this.supportButton())?.click();
	}

	private async access(): Promise<ProjectAccessEnum | undefined> {
		if (await this.selectButton()) return ProjectAccessEnum.SELECT;
		return (await this.supportButton()) ? ProjectAccessEnum.SUPPORT : undefined;
	}
}
