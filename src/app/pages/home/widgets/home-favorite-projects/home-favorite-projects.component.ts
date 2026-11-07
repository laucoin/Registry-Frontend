import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal } from '@angular/core';
import { Params, Router, RouterLink } from '@angular/router';

import { provideTranslocoScope, TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { HomeFacade } from '@pages/home/data/state/home.facade';
import { DateHelper } from '@shared/helpers/date.helper';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';
import { NotificationModel } from '@shared/models/model/notification.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { FavoriteToggleComponent } from '@shared/ui/common/favorite-toggle/favorite-toggle.component';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';

import '@sgdf/ui/tag';
import '@sgdf/ui/tile';
import '@sgdf/ui/icon';
import '@sgdf/ui/button';
import '@sgdf/ui/skeleton';
import '@sgdf/ui/relative-time';

const INITIALS_LENGTH = 3;

function formatOrEllipsis(formatter: Intl.DateTimeFormat, date: Date | undefined): string {
	return date ? formatter.format(date) : '...';
}

function beginLabel(begin: Date, end: Date, full: Intl.DateTimeFormat, dayAndMonth: Intl.DateTimeFormat): string {
	const sameYear = begin.getFullYear() === end.getFullYear();
	const sameMonth = sameYear && begin.getMonth() === end.getMonth();
	if (sameMonth) return String(begin.getDate());
	return sameYear ? dayAndMonth.format(begin) : full.format(begin);
}

/**
 * Purpose: Affiche les projets favoris de l'utilisateur connecté sur la page d'accueil.
 * Scope: Charge les premiers favoris, affiche chacun sous forme de carte avec ses compteurs et sa période, et retire un projet des favoris.
 * Limits: Lit uniquement la facade d'accueil ; affiche quelques cartes et renvoie vers la liste des projets pour les autres.
 */
@Component({
	selector: 'app-home-favorite-projects',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('home')],
	imports: [TranslocoPipe, PluralTranslationPipe, RouterLink, SectionErrorComponent, FavoriteToggleComponent],
	templateUrl: './home-favorite-projects.component.html',
})
export class HomeFavoriteProjectsComponent implements OnInit {
	private readonly facade = inject(HomeFacade);
	private readonly autoRefresh = injectAutoRefresh('home/favorites', 'counts', () => this.facade.refreshFavorites());
	private readonly router = inject(Router);
	private readonly translocoService = inject(TranslocoService);

	protected readonly projects = this.facade.favorites;
	protected readonly total = this.facade.favoritesTotal;
	protected readonly loading = this.facade.favoritesLoading;
	protected readonly error: Signal<NotificationModel | undefined> = this.facade.favoritesError;
	protected readonly projectsLink: string = RegistryRouteEnum.PROJECTS;
	protected readonly favoritesQuery: Params = { isFavorite: true };
	protected readonly skeletonCards: readonly number[] = [1, 2, 3];
	protected readonly showSkeleton = computed(() => this.loading() && this.total() === undefined);

	public ngOnInit(): void {
		this.reload();
	}

	protected reload(): void {
		this.facade.fetchFavorites();
	}

	protected remove(project: ProjectModel): void {
		this.facade.removeFavorite(project);
	}

	protected link(project: ProjectModel): string {
		return `/${RegistryRouteEnum.PROJECT.replace(':projectId', project.id)}`;
	}

	protected open(event: MouseEvent, project: ProjectModel): void {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return;
		}
		event.preventDefault();
		this.router.navigateByUrl(this.link(project)).catch((): void => undefined);
	}

	protected summary(project: ProjectModel): string | undefined {
		const counts = project.counts;
		if (!counts) {
			return undefined;
		}
		const participants = this.translocoService.translate(
			this.pluralKey('home.favorites.participants', counts.participants),
			{ count: counts.participants },
		);
		const vehicles = counts.vehicles ?? undefined;
		const other =
			vehicles !== undefined
				? this.translocoService.translate(this.pluralKey('home.favorites.vehicles', vehicles), {
						count: vehicles,
					})
				: this.translocoService.translate(this.pluralKey('home.favorites.groups', counts.groups), {
						count: counts.groups,
					});
		return `${participants} · ${other}`;
	}

	protected period(project: ProjectModel): { begin: string; end: string } | undefined {
		const begin = DateHelper.toDate(project.begin);
		const end = DateHelper.toDate(project.end);
		if (!begin && !end) {
			return undefined;
		}
		const locale = this.translocoService.getActiveLang();
		const full = new Intl.DateTimeFormat(locale, {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		});
		if (!begin || !end) return { begin: formatOrEllipsis(full, begin), end: formatOrEllipsis(full, end) };
		const dayAndMonth = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' });
		return { begin: beginLabel(begin, end, full, dayAndMonth), end: full.format(end) };
	}

	private pluralKey(key: string, count: number): string {
		return `${key}.${count === 0 || count === 1 ? 'one' : 'few'}`;
	}

	protected initials(project: ProjectModel): string {
		const words = project.name.trim().split(/\s+/);
		const letters =
			words.length > 1
				? words
						.slice(0, INITIALS_LENGTH)
						.map((word) => word[0])
						.join('')
				: words[0].slice(0, INITIALS_LENGTH);
		return letters.toUpperCase();
	}
}
