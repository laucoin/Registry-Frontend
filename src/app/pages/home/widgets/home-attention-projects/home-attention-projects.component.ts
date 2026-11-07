import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { HomeFacade } from '@pages/home/data/state/home.facade';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';
import { NotificationModel } from '@shared/models/model/notification.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';

import '@sgdf/ui/table';
import '@sgdf/ui/table-row';
import '@sgdf/ui/table-cell';
import '@sgdf/ui/icon';
import '@sgdf/ui/tag';
import '@sgdf/ui/avatar';
import '@sgdf/ui/skeleton';

const INITIALS_LENGTH = 3;
const DANGER_ALERTS = 2;

/**
 * Purpose: Affiche sur la page d'accueil les projets qui ont des alertes actives, les plus alertés en premier.
 * Scope: Charge les projets triés par alertes actives, garde ceux qui en ont au moins une, et renvoie chacun vers ses alertes.
 * Limits: Lit uniquement la facade d'accueil ; le backend fait le tri et seul le nombre d'alertes est affiché.
 */
@Component({
	selector: 'app-home-attention-projects',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('home')],
	imports: [TranslocoPipe, PluralTranslationPipe, RouterLink, SectionErrorComponent],
	templateUrl: './home-attention-projects.component.html',
})
export class HomeAttentionProjectsComponent implements OnInit {
	private readonly facade = inject(HomeFacade);
	private readonly autoRefresh = injectAutoRefresh('home/attention', 'counts', () => this.facade.refreshAttention());

	protected readonly projects = this.facade.attention;
	protected readonly loading = this.facade.attentionLoading;
	protected readonly error: Signal<NotificationModel | undefined> = this.facade.attentionError;
	protected readonly initialLoading = computed(() => this.loading() && this.projects().length === 0);
	protected readonly skeletonRows: readonly number[] = [1, 2, 3];

	public ngOnInit(): void {
		this.reload();
	}

	protected reload(): void {
		this.facade.fetchAttention();
	}

	protected alerts(project: ProjectModel): number {
		return project.counts?.activeAlerts ?? 0;
	}

	protected variant(project: ProjectModel): 'danger' | 'info' {
		return this.alerts(project) >= DANGER_ALERTS ? 'danger' : 'info';
	}

	protected link(project: ProjectModel): string {
		return RegistryRouteEnum.PROJECTS_ALERTS.replace(':projectId', project.id);
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
