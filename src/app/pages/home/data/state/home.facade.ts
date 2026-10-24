import { computed, inject, Injectable, Signal } from '@angular/core'
import { tap } from 'rxjs'
import { HomeStore } from '@pages/home/data/state/home.store'
import { ProjectApi } from '@core/registry/state/project.api'
import { UiFacade } from '@core/registry/state/ui.facade'
import { GenericFacade } from '@shared/helpers/facade/generic.facade'
import { notifyOnError } from '@shared/helpers/rx.helper'
import { NotificationModel } from '@shared/models/model/notification.model'
import { ProjectModel } from '@shared/models/model/project.model'

const FAVORITES_SIZE: number = 3
const ATTENTION_SIZE: number = 5

/**
 * Purpose: Point d'entrée public de la page d'accueil globale pour ses widgets.
 * Scope: Expose les projets favoris et les projets avec alertes actives sous forme de signals, relaie leurs requêtes et bascule un favori.
 * Limits: Ne détient aucun état propre ; les autres données de l'accueil (invitations) viennent de la facade des profils utilisateur.
 */
@Injectable()
export class HomeFacade extends GenericFacade {
	private readonly store: InstanceType<typeof HomeStore> = inject(HomeStore)
	private readonly api: ProjectApi = inject(ProjectApi)
	private readonly uiFacade: UiFacade = inject(UiFacade)

	public readonly favorites: Signal<ProjectModel[]> = computed((): ProjectModel[] => this.store.favorites.element()?.content ?? [])
	public readonly favoritesTotal: Signal<number | undefined> = computed((): number | undefined => this.store.favorites.element()?.totalElements)
	public readonly favoritesLoading: Signal<boolean> = this.store.favorites.loading
	public readonly favoritesError: Signal<NotificationModel | undefined> = this.store.favorites.error

	public readonly attention: Signal<ProjectModel[]> = computed((): ProjectModel[] =>
		(this.store.attention.element()?.content ?? []).filter((project: ProjectModel): boolean => (project.counts?.activeAlerts ?? 0) > 0),
	)
	public readonly attentionLoading: Signal<boolean> = this.store.attention.loading
	public readonly attentionError: Signal<NotificationModel | undefined> = this.store.attention.error

	public fetchFavorites(): void {
		this.store.fetchFavorites({ page: 0, size: FAVORITES_SIZE })
	}

	public fetchAttention(): void {
		this.store.fetchAttention({ page: 0, size: ATTENTION_SIZE })
	}

	public refreshFavorites(): void {
		this.store.refreshFavorites({ page: 0, size: FAVORITES_SIZE })
	}

	public refreshAttention(): void {
		this.store.refreshAttention({ page: 0, size: ATTENTION_SIZE })
	}

	public removeFavorite(project: ProjectModel): void {
		this.api.setFavoriteById(project.id, false).pipe(
			notifyOnError(this.uiFacade),
			tap((): void => this.fetchFavorites()),
		).subscribe()
	}
}
