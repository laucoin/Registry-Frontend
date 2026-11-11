import { computed, inject, Injectable, Signal } from '@angular/core';

import { tap } from 'rxjs';

import { ProjectApi } from '@core/registry/state/project.api';
import { UiFacade } from '@core/registry/state/ui.facade';
import { HomeStore } from '@pages/home/data/state/home.store';
import { GenericFacade } from '@shared/helpers/facade/generic.facade';
import { notifyOnError } from '@shared/helpers/rx.helper';
import { NotificationModel } from '@shared/models/model/notification.model';
import { ProjectModel } from '@shared/models/model/project.model';

const FAVORITES_SIZE = 3;
const ATTENTION_SIZE = 5;

/**
 * Objectif: Point d'entrée public de la page d'accueil globale pour ses widgets.
 * Périmètre: Expose les projets favoris et les projets avec alertes actives sous forme de signals, relaie leurs requêtes et bascule un favori.
 * Limites: Ne détient aucun état propre ; les autres données de l'accueil (invitations) viennent de la facade des profils utilisateur.
 */
@Injectable()
export class HomeFacade extends GenericFacade {
	private readonly store = inject(HomeStore);
	private readonly api = inject(ProjectApi);
	private readonly uiFacade = inject(UiFacade);

	public readonly favorites = computed(() => this.store.favorites.element()?.content ?? []);
	public readonly favoritesTotal = computed(() => this.store.favorites.element()?.totalElements);
	public readonly favoritesLoading = this.store.favorites.loading;
	public readonly favoritesError: Signal<NotificationModel | undefined> = this.store.favorites.error;

	public readonly attention = computed(() =>
		(this.store.attention.element()?.content ?? []).filter((project) => (project.counts?.activeAlerts ?? 0) > 0),
	);
	public readonly attentionLoading = this.store.attention.loading;
	public readonly attentionError: Signal<NotificationModel | undefined> = this.store.attention.error;

	public fetchFavorites(): void {
		this.store.fetchFavorites({ page: 0, size: FAVORITES_SIZE });
	}

	public fetchAttention(): void {
		this.store.fetchAttention({ page: 0, size: ATTENTION_SIZE });
	}

	public refreshFavorites(): void {
		this.store.refreshFavorites({ page: 0, size: FAVORITES_SIZE });
	}

	public refreshAttention(): void {
		this.store.refreshAttention({ page: 0, size: ATTENTION_SIZE });
	}

	public removeFavorite(project: ProjectModel): void {
		this.api
			.setFavoriteById(project.id, false)
			.pipe(
				notifyOnError(this.uiFacade),
				tap(() => this.fetchFavorites()),
			)
			.subscribe();
	}
}
