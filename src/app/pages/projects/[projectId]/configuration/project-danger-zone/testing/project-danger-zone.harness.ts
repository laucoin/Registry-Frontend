import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { ProjectDangerCommandEnum } from '@shared/models/enumeration/project-danger-command.enum';

export interface DangerCommandView {
	id: string | null;
	title: string;
	variant: string | null;
	buttonVariant: string | null;
}

/**
 * Objectif: Pilote la zone de danger du projet sélectionné dans les tests.
 * Périmètre: Indique si elle est affichée, lit les commandes proposées (titre et couleurs) et lance une commande.
 * Limites: La confirmation est pilotée par le service de confirmation.
 */
export class ProjectDangerZoneHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-project-danger-zone';

	private readonly zone = this.locatorForOptional(byTestId('project-danger-zone'));
	private readonly callouts = this.locatorForAll(byTestId('project-danger-zone-command-callout'));

	public async shown(): Promise<boolean> {
		return (await this.zone()) !== null;
	}

	public async commands(): Promise<DangerCommandView[]> {
		return Promise.all(
			(await this.callouts()).map(async (callout) => {
				const id = await callout.getAttribute('data-id');
				const button = await this.locatorFor(this.button(id ?? ''))();
				return {
					id,
					title: (await (await this.locatorFor(`${this.callout(id ?? '')} [slot="title"]`)()).text()).trim(),
					variant: await callout.getProperty<string>('variant'),
					buttonVariant: await button.getProperty<string>('variant'),
				};
			}),
		);
	}

	public async run(command: ProjectDangerCommandEnum): Promise<void> {
		return (await this.locatorFor(this.button(command))()).click();
	}

	private callout(id: string): string {
		return `${byTestId('project-danger-zone-command-callout')}[data-id="${id}"]`;
	}

	private button(id: string): string {
		return `${byTestId('project-danger-zone-command-button')}[data-id="${id}"]`;
	}
}
