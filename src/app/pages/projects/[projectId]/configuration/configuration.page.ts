import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import { SessionFacade } from '@core/registry/state/session.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { CONFIGURATION_TILES } from '@pages/projects/[projectId]/configuration/data/configuration-tiles.definitions';
import { ConfigurationTileModel } from '@pages/projects/[projectId]/configuration/data/model/configuration-tile.model';
import { ProjectDangerZoneComponent } from '@pages/projects/[projectId]/configuration/project-danger-zone/project-danger-zone.component';
import { ProjectInformationComponent } from '@pages/projects/[projectId]/configuration/project-information/project-information.component';
import { RouteHelper } from '@shared/helpers/route.helper';

import '@sgdf/ui/callout';
import '@sgdf/ui/icon';
import '@sgdf/ui/page-title';
import '@sgdf/ui/skeleton';
import '@sgdf/ui/tag';
import '@sgdf/ui/tile';

/**
 * Objectif: Page d'atterrissage de la configuration du projet.
 * Périmètre: Affiche les informations du projet et une tuile par espace de configuration que l'utilisateur peut ouvrir, avec les compteurs du projet sélectionné.
 * Limites: Lit uniquement le projet sélectionné ; n'appelle jamais le backend.
 */
@Component({
	selector: 'app-configuration',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-configuration')],
	imports: [RouterLink, TranslocoPipe, ProjectInformationComponent, ProjectDangerZoneComponent],
	templateUrl: './configuration.page.html',
})
export class ConfigurationPage {
	private readonly sessionFacade = inject(SessionFacade);

	protected readonly project = this.sessionFacade.selectedProject;
	protected readonly tiles: Signal<ConfigurationTileModel[]> = computed((): ConfigurationTileModel[] =>
		CONFIGURATION_TILES.filter((tile: ConfigurationTileModel) =>
			CurrentUserHelper.isFeasible(this.sessionFacade.currentUser(), this.project(), tile),
		).map((tile: ConfigurationTileModel): ConfigurationTileModel => ({ ...tile, url: this.resolveUrl(tile.url) })),
	);

	protected countOf(tile: ConfigurationTileModel): number | undefined {
		return this.project()?.counts?.[tile.count];
	}

	// Absolu : sans le slash initial, `routerLink` résout l'url depuis la route courante et finit sur le wildcard
	private resolveUrl(url: string): string {
		return RouteHelper.withProjectId(
			RouteHelper.absolute(url as RegistryRouteEnum),
			this.sessionFacade.currentProjectId(),
		);
	}
}
