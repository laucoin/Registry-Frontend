import { AsyncPipe, TitleCasePipe, UpperCasePipe } from '@angular/common'
import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { TagModule } from 'primeng/tag'
import { Observable } from 'rxjs'
import { EventProfileModel } from '../../shared/util-model/model/event-profile.model'
import { PageModel } from '../../shared/util-model/model/page.model'
import { GenericComponent } from '../../shared/util-tool/component/generic.component'
import { PluralTranslationPipe } from '../../shared/util-tool/pipe/plural-translation.pipe'
import { ElementCardComponent } from '../../shared/util-ui/element-card/element-card.component'
import { AppRouteEnum } from '../../app-route.enum'
import { Tab, TabList, Tabs } from 'primeng/tabs'
import { ActionModel } from '../../shared/util-model/model/action.model'
import { AppConfig } from '../../app.config'
import { RegistryActionEnum } from '../../shared/util-common/state/registry.action'

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
        PluralTranslationPipe,
        RouterOutlet,
        Tabs,
        TabList,
        Tab,
    ],
    templateUrl: './preferences.component.html',
    styleUrl: './preferences.component.scss',
} )
export class PreferencesComponent extends GenericComponent {
    protected readonly AppRouteEnum: typeof AppRouteEnum = AppRouteEnum

    protected readonly profilePage$: Observable<PageModel<EventProfileModel> | undefined> = this.registryFacade.userEventProfilesPage
    protected readonly invitationPage$: Observable<PageModel<EventProfileModel> | undefined> = this.registryFacade.userEventProfileInvitationsPage

    protected actions: ActionModel<RegistryActionEnum>[] = AppConfig.config.user.myAction

    protected handleAction (action: RegistryActionEnum): void {
        switch (action) {
            case RegistryActionEnum.IMPERSONATE_CURRENT_USER:
                this.registryFacade.impersonateCurrentUser()
        }
    }

    protected tabNavigation (route: unknown): void {
        this.router.navigateByUrl( route as AppRouteEnum ).catch( console.error )
    }

    protected get activeIndex (): AppRouteEnum {
        return location.pathname.includes( AppRouteEnum.PREFERENCES_INVITATIONS ) ? AppRouteEnum.PREFERENCES_INVITATIONS : AppRouteEnum.PREFERENCES_PROFILES
    }
}
