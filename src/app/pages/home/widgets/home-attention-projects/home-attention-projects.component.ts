import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import type { SgdfStatusVariant } from '@sgdf/ui';

import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { HomeFacade } from '@pages/home/data/state/home.facade';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh';
import { RouteHelper } from '@shared/helpers/route.helper';
import { StringHelper } from '@shared/helpers/string.helper';
import { WidgetStateHelper } from '@shared/helpers/widget-state.helper';
import { RefreshKindEnum } from '@shared/models/enumeration/refresh-kind.enum';
import { NotificationModel } from '@shared/models/model/notification.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { WidgetCardComponent } from '@shared/ui/common/widget-card/widget-card.component';

import '@sgdf/ui/list';
import '@sgdf/ui/list-item';
import '@sgdf/ui/tag';
import '@sgdf/ui/avatar';

const INITIALS_LENGTH = 3;
const DANGER_ALERTS = 2;

/**
 * Objectif: Affiche sur la page d'accueil les projets qui ont des alertes actives, les plus alertés en premier.
 * Périmètre: Charge les projets triés par alertes actives, garde ceux qui en ont au moins une, et renvoie chacun vers ses alertes.
 * Limites: Lit uniquement la facade d'accueil ; le backend fait le tri et seul le nombre d'alertes est affiché.
 */
@Component({
	selector: 'app-home-attention-projects',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('home')],
	imports: [TranslocoPipe, PluralTranslationPipe, RouterLink, WidgetCardComponent],
	templateUrl: './home-attention-projects.component.html',
})
export class HomeAttentionProjectsComponent implements OnInit {
	private readonly facade = inject(HomeFacade);
	private readonly autoRefresh = injectAutoRefresh('home/attention', RefreshKindEnum.COUNTS, () =>
		this.facade.refreshAttention(),
	);

	protected readonly projects = this.facade.attention;
	protected readonly loading = this.facade.attentionLoading;
	protected readonly error: Signal<NotificationModel | undefined> = this.facade.attentionError;
	protected readonly total = computed(() =>
		this.loading() && this.projects().length === 0 ? undefined : this.projects().length,
	);
	protected readonly state = computed(() => WidgetStateHelper.of(this.loading(), this.total()));

	public ngOnInit(): void {
		this.reload();
	}

	protected reload(): void {
		this.facade.fetchAttention();
	}

	protected alerts(project: ProjectModel): number {
		return project.counts?.activeAlerts ?? 0;
	}

	protected variant(project: ProjectModel): SgdfStatusVariant {
		return this.alerts(project) >= DANGER_ALERTS ? 'danger' : 'info';
	}

	protected link(project: ProjectModel): string {
		return `/${RouteHelper.withProjectId(RegistryRouteEnum.PROJECTS_ALERTS, project.id)}`;
	}

	protected initials(project: ProjectModel): string {
		return StringHelper.initials(project.name, INITIALS_LENGTH);
	}
}
