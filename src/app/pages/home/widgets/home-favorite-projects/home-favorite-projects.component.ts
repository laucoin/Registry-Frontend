import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal } from '@angular/core';
import { Params, Router, RouterLink } from '@angular/router';

import { provideTranslocoScope, TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { HomeFacade } from '@pages/home/data/state/home.facade';
import { DateHelper } from '@shared/helpers/date.helper';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';
import { RouteHelper } from '@shared/helpers/route.helper';
import { StringHelper } from '@shared/helpers/string.helper';
import { RefreshKindEnum } from '@shared/models/enumeration/refresh-kind.enum';
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

interface FavoriteCard {
	project: ProjectModel;
	link: string;
	initials: string;
	summary: string | undefined;
	period: { begin: string; end: string } | undefined;
}

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
 * Objectif: Affiche les projets favoris de l'utilisateur connecté sur la page d'accueil.
 * Périmètre: Charge les premiers favoris, affiche chacun sous forme de carte avec ses compteurs et sa période, et retire un projet des favoris.
 * Limites: Lit uniquement la facade d'accueil ; affiche quelques cartes et renvoie vers la liste des projets pour les autres.
 */
@Component({
	selector: 'app-home-favorite-projects',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('home'), PluralTranslationPipe],
	imports: [TranslocoPipe, PluralTranslationPipe, RouterLink, SectionErrorComponent, FavoriteToggleComponent],
	templateUrl: './home-favorite-projects.component.html',
})
export class HomeFavoriteProjectsComponent implements OnInit {
	private readonly facade = inject(HomeFacade);
	private readonly autoRefresh = injectAutoRefresh('home/favorites', RefreshKindEnum.COUNTS, () =>
		this.facade.refreshFavorites(),
	);
	private readonly router = inject(Router);
	private readonly translocoService = inject(TranslocoService);
	private readonly plural = inject(PluralTranslationPipe);

	protected readonly projects = this.facade.favorites;
	protected readonly total = this.facade.favoritesTotal;
	protected readonly loading = this.facade.favoritesLoading;
	protected readonly error: Signal<NotificationModel | undefined> = this.facade.favoritesError;
	protected readonly projectsLink = RouteHelper.absolute(RegistryRouteEnum.PROJECTS);
	protected readonly favoritesQuery: Params = { isFavorite: true };
	protected readonly skeletonCards: readonly number[] = [1, 2, 3];
	protected readonly showSkeleton = computed(() => this.loading() && this.total() === undefined);
	protected readonly cards = computed(() => this.projects().map((project) => this.toCard(project)));

	public ngOnInit(): void {
		this.reload();
	}

	protected reload(): void {
		this.facade.fetchFavorites();
	}

	protected remove(project: ProjectModel): void {
		this.facade.removeFavorite(project);
	}

	private link(project: ProjectModel): string {
		return `/${RouteHelper.withProjectId(RegistryRouteEnum.PROJECT, project.id)}`;
	}

	protected open(event: MouseEvent, link: string): void {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return;
		}
		event.preventDefault();
		this.router.navigateByUrl(link).catch((): void => undefined);
	}

	private summary(project: ProjectModel): string | undefined {
		const counts = project.counts;
		if (!counts) {
			return undefined;
		}
		const participants = this.translocoService.translate(
			this.plural.transform('home.favorites.participants', counts.participants),
			{ count: counts.participants },
		);
		const vehicles = counts.vehicles ?? undefined;
		const other =
			vehicles !== undefined
				? this.translocoService.translate(this.plural.transform('home.favorites.vehicles', vehicles), {
						count: vehicles,
					})
				: this.translocoService.translate(this.plural.transform('home.favorites.groups', counts.groups), {
						count: counts.groups,
					});
		return `${participants} · ${other}`;
	}

	private period(project: ProjectModel): { begin: string; end: string } | undefined {
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

	private toCard(project: ProjectModel): FavoriteCard {
		return {
			project,
			link: this.link(project),
			initials: StringHelper.initials(project.name, INITIALS_LENGTH),
			summary: this.summary(project),
			period: this.period(project),
		};
	}
}
