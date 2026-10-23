import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { HomeStoreModel } from '@pages/home/data/model/home-store.model'
import { ProjectPageParamsModel } from '@pages/projects/data/model/project-page-params.model'
import { ProjectApi } from '@pages/projects/data/state/project.api'
import { CumulativePageRequest } from '@shared/helpers/store/cumulative-page.helper'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { pageFetcher } from '@shared/helpers/store/paged-store.methods'
import { ProjectModel } from '@shared/models/model/project.model'

const baseParams: ProjectPageParamsModel = { resetSearch: false, q: undefined, isVisible: undefined, at: undefined, isFavorite: undefined, withProfile: undefined }

const defaultHomeStore: HomeStoreModel = {
	favorites: PageStateHelper.initial<ProjectPageParamsModel, ProjectModel>({ ...baseParams, isFavorite: true, sort: 'name' }),
	attention: PageStateHelper.initial<ProjectPageParamsModel, ProjectModel>({ ...baseParams, sort: '-activeAlerts' }),
}

/**
 * Purpose: Holds the state of the global home page.
 * Scope: Owns the favorite projects and the projects with the most active alerts, with their loading and error flags.
 * Limits: Reached through the home facade; it reads the project api and does not notify the user of command results.
 */
export const HomeStore = signalStore(
	withState<HomeStoreModel>(defaultHomeStore),
	withMethods((store, api = inject(ProjectApi), errors = inject(ErrorReporter)) => ({
		fetchFavorites: pageFetcher(store, 'favorites', (request: CumulativePageRequest, params: ProjectPageParamsModel) =>
			api.findProjects(request.page, request.size, params), errors),
		fetchAttention: pageFetcher(store, 'attention', (request: CumulativePageRequest, params: ProjectPageParamsModel) =>
			api.findProjects(request.page, request.size, params), errors),
		refreshFavorites: pageFetcher(store, 'favorites', (request: CumulativePageRequest, params: ProjectPageParamsModel) =>
			api.findProjects(request.page, request.size, params), errors, { silent: true }),
		refreshAttention: pageFetcher(store, 'attention', (request: CumulativePageRequest, params: ProjectPageParamsModel) =>
			api.findProjects(request.page, request.size, params), errors, { silent: true }),
		reset: (): void => patchState(store, defaultHomeStore),
	})),
)
