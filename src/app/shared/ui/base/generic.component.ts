import {RegistryFacade} from '@core/registry/state/registry.facade'
import {UiFacade} from '@core/registry/state/ui.facade'
import {SessionFacade} from '@core/registry/state/session.facade'
import {inject} from '@angular/core'
import {TranslocoService} from '@jsverse/transloco'
import {ActivatedRoute, Router} from '@angular/router'
import {UserAuthorityEnum} from '@shared/models/enumeration/user-authority.enum'
import {ProjectAuthorityEnum} from '@shared/models/enumeration/project-authority.enum'
import {CurrentUserHelper} from '@core/authentication/tool/current-user.helper'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {StringHelper} from '@shared/helpers/string.helper'
import {breakPoint} from '@shared/helpers/breakpoint.const'
import {RegistryRouteEnum} from '@core/routing/registry-route.enum'
import {ProjectHelper} from '@shared/helpers/project.helper'
import {ProjectOptionEnum} from '@shared/models/enumeration/project-option.enum'
import {SeverityEnum} from '@shared/models/enumeration/severity.enum'

/**
 * Purpose: Base class of the components that need the shared facades and helpers.
 * Scope: Provides the registry, UI and session facades, routing and translation.
 * Limits: Abstract; it holds no view logic.
 */
export abstract class GenericComponent {
    protected readonly RegistryRouteEnum: typeof RegistryRouteEnum = RegistryRouteEnum

    protected readonly GenericHelper: typeof GenericHelper = GenericHelper
    protected readonly StringHelper: typeof StringHelper = StringHelper

    protected readonly CurrentUserHelper: typeof CurrentUserHelper = CurrentUserHelper
    protected readonly UserAuthority: typeof UserAuthorityEnum = UserAuthorityEnum
    protected readonly ProjectAuthority: typeof ProjectAuthorityEnum = ProjectAuthorityEnum
    protected readonly ProjectOptionEnum: typeof ProjectOptionEnum = ProjectOptionEnum
    protected readonly SeverityEnum: typeof SeverityEnum = SeverityEnum
    protected readonly ProjectHelper: typeof ProjectHelper = ProjectHelper

    protected readonly registryFacade: RegistryFacade = inject(RegistryFacade)
    protected readonly uiFacade: UiFacade = inject(UiFacade)
    protected readonly sessionFacade: SessionFacade = inject(SessionFacade)
    protected readonly route: ActivatedRoute = inject(ActivatedRoute)
    protected readonly router: Router = inject(Router)
    protected readonly translateService: TranslocoService = inject(TranslocoService)

    protected readonly breakpoint: Record<string, string> = breakPoint
}
