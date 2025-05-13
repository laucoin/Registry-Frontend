import { Component } from '@angular/core'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs'
import { TranslatePipe } from '@ngx-translate/core'
import { DashboardComponent } from './dashboard/dashboard.component'
import { CurrentActivitiesComponent } from './current-activities/current-activities.component'
import { CurrentMovementsComponent } from './current-movements/current-movements.component'
import { GenericComponent } from '../../../shared/util-tool/component/generic.component'

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
export class ProjectHomeComponent extends GenericComponent {}
