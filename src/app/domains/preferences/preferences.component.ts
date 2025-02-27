import { TitleCasePipe, UpperCasePipe } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { TagModule } from 'primeng/tag'
import { PluralTranslationPipe } from '../../shared/util-tool/pipe/plural-translation.pipe'
import { ElementCardComponent } from '../../shared/util-ui/element-card/element-card.component'
import { AppRouteEnum } from '../../app-route.enum'
import { Tab, TabList, Tabs } from 'primeng/tabs'
import { ActionModel } from '../../shared/util-model/model/action.model'
import { AppConfig } from '../../app.config'
import { RegistryActionEnum } from '../../shared/util-common/state/registry.action'
import { GenericComponent } from '../../shared/util-tool/component/generic.component'

@Component( {
    selector: 'app-preferences',
    standalone: true,
    imports: [
        ElementCardComponent,
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
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class PreferencesComponent extends GenericComponent {
    protected actions: ActionModel<RegistryActionEnum>[] = AppConfig.config.user.myAction

    public constructor () {
        super()
    }

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
