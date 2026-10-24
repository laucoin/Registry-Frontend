import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { HomeStoreModel } from '@pages/home/data/model/home-store.model'
import { ProjectPageParamsModel } from '@shared/models/model/project-page-params.model'
import { ProjectApi } from '@core/registry/state/project.api'
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
 * Purpose: Détient l'état de la page d'accueil globale.
 * Scope: Possède les projets favoris et les projets ayant le plus d'alertes actives, avec leurs drapeaux de chargement et d'erreur.
 * Limits: Atteint via la facade d'accueil ; lit l'api des projets et ne notifie pas l'utilisateur du résultat des commandes.
 */
export const HomeStore = signalStore(
	withState<HomeStoreModel>(defaultHomeStore),
	withMethods((store, api = inject(ProjectApi), errors = inject(ErrorReporter)) => {
		const findProjects = (request: CumulativePageRequest, params: ProjectPageParamsModel): ReturnType<ProjectApi['findProjects']> =>
			api.findProjects(request.page, request.size, params)

		return {
			fetchFavorites: pageFetcher(store, 'favorites', findProjects, errors),
			fetchAttention: pageFetcher(store, 'attention', findProjects, errors),
			refreshFavorites: pageFetcher(store, 'favorites', findProjects, errors, { silent: true }),
			refreshAttention: pageFetcher(store, 'attention', findProjects, errors, { silent: true }),
			reset: (): void => patchState(store, defaultHomeStore),
		}
	}),
)
