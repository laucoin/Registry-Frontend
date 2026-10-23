import '@sgdf/ui/icon'
import '@sgdf/ui/tag'
import '@sgdf/ui/tile'
import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { SessionFacade } from '@core/registry/state/session.facade'
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco'
import { CONFIGURATION_TILES } from '@pages/projects/[projectId]/configuration/data/configuration-tiles.definitions'
import { ConfigurationTileModel } from '@pages/projects/[projectId]/configuration/data/model/configuration-tile.model'
import { ProjectInformationComponent } from '@shared/ui/domain/project-information/project-information.component'
import { ProjectModel } from '@shared/models/model/project.model'

/**
 * Purpose: Landing page of the project configuration.
 * Scope: Shows the project information and one tile per configuration area the user may open, with the counts of the selected project.
 * Limits: Reads the selected project only; never calls the backend.
 */
@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-configuration',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-configuration')],
	imports: [RouterLink, TranslocoPipe, ProjectInformationComponent],
	templateUrl: './configuration.page.html',
})
export class ConfigurationPage {
	private readonly sessionFacade: SessionFacade = inject(SessionFacade)

	protected readonly project: Signal<ProjectModel | undefined> = this.sessionFacade.selectedProject
	protected readonly tiles: Signal<ConfigurationTileModel[]> = computed((): ConfigurationTileModel[] =>
		CONFIGURATION_TILES
			.filter((tile: ConfigurationTileModel): boolean => CurrentUserHelper.isFeasible(this.sessionFacade.currentUser(), this.project(), tile))
			.map((tile: ConfigurationTileModel): ConfigurationTileModel => ({ ...tile, url: this.resolveUrl(tile.url) })),
	)

	protected countOf(tile: ConfigurationTileModel): number | undefined {
		return this.project()?.counts?.[tile.count]
	}

	private resolveUrl(url: string): string {
		return url.replace(':projectId', this.sessionFacade.currentProjectId() ?? '')
	}
}
