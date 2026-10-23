import '@sgdf/ui/table'
import '@sgdf/ui/table-row'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/icon'
import '@sgdf/ui/tag'
import '@sgdf/ui/avatar'
import '@sgdf/ui/skeleton'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco'
import { HomeFacade } from '@pages/home/data/state/home.facade'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { NotificationModel } from '@shared/models/model/notification.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component'
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh'

const INITIALS_LENGTH: number = 3
const DANGER_ALERTS: number = 2

/**
 * Purpose: Shows the projects that have active alerts, the most alerted first, on the home page.
 * Scope: Loads the projects sorted by active alerts, keeps those with at least one, and links each to its alerts.
 * Limits: Reads the home facade only; the backend does the sorting and only the alert count is shown.
 */
@Component({
	selector: 'app-home-attention-projects',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('home')],
	imports: [TranslocoPipe, PluralTranslationPipe, RouterLink, SectionErrorComponent],
	templateUrl: './home-attention-projects.component.html',
})
export class HomeAttentionProjectsComponent implements OnInit {
	private readonly facade: HomeFacade = inject(HomeFacade)
	private readonly autoRefresh: void = injectAutoRefresh('home/attention', 'counts', (): void => this.facade.refreshAttention())

	protected readonly projects: Signal<ProjectModel[]> = this.facade.attention
	protected readonly loading: Signal<boolean> = this.facade.attentionLoading
	protected readonly error: Signal<NotificationModel | undefined> = this.facade.attentionError
	protected readonly initialLoading: Signal<boolean> = computed((): boolean => this.loading() && this.projects().length === 0)
	protected readonly skeletonRows: readonly number[] = [1, 2, 3]

	public ngOnInit(): void {
		this.reload()
	}

	protected reload(): void {
		this.facade.fetchAttention()
	}

	protected alerts(project: ProjectModel): number {
		return project.counts?.activeAlerts ?? 0
	}

	protected variant(project: ProjectModel): 'danger' | 'info' {
		return this.alerts(project) >= DANGER_ALERTS ? 'danger' : 'info'
	}

	protected link(project: ProjectModel): string {
		return RegistryRouteEnum.PROJECTS_ALERTS.replace(':projectId', project.id)
	}

	protected initials(project: ProjectModel): string {
		const words: string[] = project.name.trim().split(/\s+/)
		const letters: string = words.length > 1 ? words.slice(0, INITIALS_LENGTH).map((word: string): string => word[0]).join('') : words[0].slice(0, INITIALS_LENGTH)
		return letters.toUpperCase()
	}
}
