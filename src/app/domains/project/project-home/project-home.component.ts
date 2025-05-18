import { Component, computed, Signal } from '@angular/core'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs'
import { TranslatePipe } from '@ngx-translate/core'
import { DashboardComponent } from './dashboard/dashboard.component'
import { CurrentActivitiesComponent } from './current-activities/current-activities.component'
import { CurrentMovementsComponent } from './current-movements/current-movements.component'
import { GenericComponent } from '../../../shared/util-tool/component/generic.component'
import { GenericUtil } from '../../../shared/util-tool/util/generic.util'
import { ParamMap } from '@angular/router'
import { toSignal } from '@angular/core/rxjs-interop'

@Component( {
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
    ],
    templateUrl: './project-home.component.html',
} )
export class ProjectHomeComponent extends GenericComponent {
    protected readonly tabParam: string = 'tab'
    protected readonly tab: string[] = [
        'dashboard',
        'activities',
        'movements',
    ]
    private readonly queryParams: Signal<ParamMap | undefined> = toSignal( this.route.queryParamMap )
    protected readonly currentTab: Signal<string> = computed( (): string => {
        const param: string | null | undefined = this.queryParams()?.get( this.tabParam )
        if (GenericUtil.isNull( param ) || !this.tab.includes( param! )) {
            return this.tab[0]!
        }
        return param!
    } )

    protected navigate (tab: string | number): void {
        this.router.navigate( [], {
            relativeTo: this.route,
            queryParams: { [this.tabParam]: tab },
            queryParamsHandling: 'merge',
        } ).then()
    }
}
