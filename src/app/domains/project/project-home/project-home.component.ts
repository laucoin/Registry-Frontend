import { Component } from '@angular/core'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs'
import { TranslatePipe } from '@ngx-translate/core'
import { DashboardComponent } from './dashboard/dashboard.component'
import { Card } from 'primeng/card'
import { Divider } from 'primeng/divider'
import { MessageComponent } from '../../../shared/util-ui/message/message.component'
import { PluralTranslationPipe } from '../../../shared/util-tool/pipe/plural-translation.pipe'
import { Skeleton } from 'primeng/skeleton'

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
        Card,
        Divider,
        MessageComponent,
        PluralTranslationPipe,
        Skeleton,
    ],
    templateUrl: './project-home.component.html',
    styleUrl: './project-home.component.scss',
} )
export class ProjectHomeComponent {}
