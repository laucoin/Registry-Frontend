import { AsyncPipe, TitleCasePipe, UpperCasePipe } from '@angular/common'
import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { TabViewChangeEvent, TabViewModule } from 'primeng/tabview'
import { TagModule } from 'primeng/tag'
import { Observable } from 'rxjs'
import { EventProfileModel } from '../../shared/util-model/model/event-profile.model'
import { PageModel } from '../../shared/util-model/model/page.model'
import { GenericComponent } from '../../shared/util-tool/component/generic.component'
import { PluralTranslationPipe } from '../../shared/util-tool/pipe/plural-translation.pipe'
import { ElementCardComponent } from '../../shared/util-ui/element-card/element-card.component'
import { AppRouteEnum } from '../../app-route.enum'

@Component( {
    selector: 'app-preferences',
    standalone: true,
    imports: [
        ElementCardComponent,
        AsyncPipe,
        TitleCasePipe,
        UpperCasePipe,
        TagModule,
        TranslateModule,
        TabViewModule,
        PluralTranslationPipe,
        RouterOutlet,

    ],
    templateUrl: './preferences.component.html',
    styleUrl: './preferences.component.scss',
} )
export class PreferencesComponent extends GenericComponent {
    protected readonly profilePage$: Observable<PageModel<EventProfileModel> | undefined> = this.registryFacade.profilesPage
    protected readonly invitationPage$: Observable<PageModel<EventProfileModel> | undefined> = this.registryFacade.invitationPage

    protected tabNavigation (event: TabViewChangeEvent): void {
        if (event.index == 1) {
            this.router.navigateByUrl( AppRouteEnum.PREFERENCES_INVITATIONS ).catch( console.error )
        } else {
            this.router.navigateByUrl( AppRouteEnum.PREFERENCES_PROFILES ).catch( console.error )
        }
    }

    protected get activeIndex (): number {
        return location.pathname.includes( AppRouteEnum.PREFERENCES_INVITATIONS ) ? 1 : 0
    }
}
