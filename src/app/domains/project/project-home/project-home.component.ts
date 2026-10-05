import { ChangeDetectionStrategy, Component, computed, Signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ParamMap } from '@angular/router'
import { TranslatePipe } from '@ngx-translate/core'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs'
import { GenericComponent } from '../../../shared/util-tool/component/generic.component'
import { GenericUtil } from '../../../shared/util-tool/util/generic.util'
import { CurrentActivitiesComponent } from './current-activities/current-activities.component'
import { CurrentAlertsComponent } from './current-alerts/current-alerts.component'
import { CurrentMovementsComponent } from './current-movements/current-movements.component'
import { DashboardComponent } from './dashboard/dashboard.component'

@Component({
	selector: 'app-project-home',
	imports: [
		Tabs,
		TabList,
		Tab,
		TabPanels,
		TabPanel,
		TranslatePipe,
		DashboardComponent,
		CurrentActivitiesComponent,
		CurrentMovementsComponent,
		CurrentAlertsComponent,
	],
	templateUrl: './project-home.component.html',
	changeDetection: ChangeDetectionStrategy.Eager,
})
export class ProjectHomeComponent extends GenericComponent {
	protected readonly tabParam: string = 'tab'
	protected readonly tab: string[] = [
		'dashboard',
		'activities',
		'movements',
	]
	private readonly queryParams: Signal<ParamMap | undefined> = toSignal(this.route.queryParamMap)
	protected readonly currentTab: Signal<string> = computed((): string => {
		const param: string | null | undefined = this.queryParams()?.get(this.tabParam)
		if (GenericUtil.isNull(param) || !this.tab.includes(param!)) {
			return this.tab[0]!
		}
		return param!
	})

	protected navigate(tab: string | number | undefined): void {
		if (!tab) {
			return
		}

		this.router.navigate([], {
			relativeTo: this.route,
			queryParams: { [this.tabParam]: tab },
			queryParamsHandling: 'merge',
		}).then()
	}
}
