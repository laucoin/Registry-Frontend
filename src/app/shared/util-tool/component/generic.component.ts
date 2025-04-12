import { RegistryFacade } from '../../util-common/state/registry.facade'
import { inject, Signal } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router } from '@angular/router'
import { FormBuilder } from '@angular/forms'
import { UserAuthorityEnum } from '../../util-model/enumeration/user-authority.enum'
import { EventAuthorityEnum } from '../../util-model/enumeration/event-authority.enum'
import { CurrentUserUtil } from '../../util-authentication/tool/current-user.util'
import { GenericUtil } from '../util/generic.util'
import { StringUtil } from '../util/string.util'
import { breakPoint } from '../util/breakpoint.const'
import { AppRouteEnum } from '../../../app-route.enum'

export abstract class GenericComponent {
    protected readonly AppRouteEnum: typeof AppRouteEnum = AppRouteEnum

    protected readonly GenericUtil: typeof GenericUtil = GenericUtil
    protected readonly StringUtil: typeof StringUtil = StringUtil

    protected readonly CurrentUserUtil: typeof CurrentUserUtil = CurrentUserUtil
    protected readonly UserAuthority: typeof UserAuthorityEnum = UserAuthorityEnum
    protected readonly EventAuthority: typeof EventAuthorityEnum = EventAuthorityEnum

    protected readonly formBuilder: FormBuilder = inject( FormBuilder )
    protected readonly registryFacade: RegistryFacade = inject( RegistryFacade )
    protected readonly route: ActivatedRoute = inject( ActivatedRoute )
    protected readonly router: Router = inject( Router )
    protected readonly translateService: TranslateService = inject( TranslateService )

    protected readonly breakpoint: object = breakPoint

    protected readonly contextEventId: Signal<string | undefined> = toSignal( this.registryFacade.contextEventId )

    protected buildUri (route: string): string {
        return route.includes( ':eventId' ) && this.contextEventId() ? route.replace(
            ':eventId',
            this.contextEventId()!,
        ) : route
    }
}
