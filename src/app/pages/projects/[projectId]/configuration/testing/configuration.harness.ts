import { ComponentHarness } from '@angular/cdk/testing';

import { ProjectDangerZoneHarness } from '@pages/projects/[projectId]/configuration/project-danger-zone/testing/project-danger-zone.harness';
import { ProjectInformationHarness } from '@pages/projects/[projectId]/configuration/project-information/testing/project-information.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';

export interface ConfigurationTileView {
	key: string | null;
	title: string;
	count: string | undefined;
	link: string | null;
}

/**
 * Objectif: Pilote la page d'atterrissage de la configuration du projet dans les tests.
 * Périmètre: Lit les tuiles (clé, titre, compteur, lien) et l'erreur de chargement des informations ; donne les
 * informations du projet et la zone de danger.
 * Limites: Ne suit pas les liens des tuiles.
 */
export class ConfigurationHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-configuration';

	private readonly tileElements = this.locatorForAll(byTestId('configuration-tile'));
	private readonly informationError = this.locatorForOptional(byTestId('configuration-information-error'));

	public readonly information = this.locatorForOptional(ProjectInformationHarness);
	public readonly dangerZone = this.locatorFor(ProjectDangerZoneHarness);

	public async tiles(): Promise<ConfigurationTileView[]> {
		return Promise.all(
			(await this.tileElements()).map(async (tile) => {
				const key = await tile.getAttribute('data-id');
				const inside = `${byTestId('configuration-tile')}[data-id="${key}"]`;
				const count = await this.locatorForOptional(`${inside} ${byTestId('configuration-tile-count-tag')}`)();
				return {
					key,
					title: (
						await (await this.locatorFor(`${inside} ${byTestId('configuration-tile-title')}`)()).text()
					).trim(),
					count: count ? (await count.text()).trim() : undefined,
					link: await tile.getAttribute('href'),
				};
			}),
		);
	}

	public async informationErrorTitle(): Promise<string | undefined> {
		return (await (await this.informationError())?.getProperty<string>('title')) ?? undefined;
	}
}
