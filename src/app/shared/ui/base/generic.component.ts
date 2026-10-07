import {RegistryFacade} from '@core/registry/state/registry.facade'
import {inject} from '@angular/core'
import {TranslateService} from '@ngx-translate/core'
import {ActivatedRoute, Router} from '@angular/router'
import {FormBuilder} from '@angular/forms'
import {UserAuthorityEnum} from '@shared/models/enumeration/user-authority.enum'
import {ProjectAuthorityEnum} from '@shared/models/enumeration/project-authority.enum'
import {CurrentUserUtil} from '@core/authentication/tool/current-user.util'
import {GenericUtil} from '@shared/helpers/util/generic.util'
import {StringUtil} from '@shared/helpers/util/string.util'
import {breakPoint} from '@shared/helpers/util/breakpoint.const'
import {RegistryRouteEnum} from '@core/routing/registry-route.enum'
import {ProjectUtil} from '@shared/helpers/util/project.util'
import {ProjectOptionEnum} from '@shared/models/enumeration/project-option.enum'
import {SeverityEnum} from '@shared/models/enumeration/severity.enum'
import {FormUtil} from '@shared/helpers/util/form.util'

export abstract class GenericComponent {
    protected readonly RegistryRouteEnum: typeof RegistryRouteEnum = RegistryRouteEnum

    protected readonly GenericUtil: typeof GenericUtil = GenericUtil
    protected readonly StringUtil: typeof StringUtil = StringUtil
    protected readonly FormUtil: typeof FormUtil = FormUtil

    protected readonly CurrentUserUtil: typeof CurrentUserUtil = CurrentUserUtil
    protected readonly UserAuthority: typeof UserAuthorityEnum = UserAuthorityEnum
    protected readonly ProjectAuthority: typeof ProjectAuthorityEnum = ProjectAuthorityEnum
    protected readonly ProjectOptionEnum: typeof ProjectOptionEnum = ProjectOptionEnum
    protected readonly SeverityEnum: typeof SeverityEnum = SeverityEnum
    protected readonly ProjectUtil: typeof ProjectUtil = ProjectUtil

    protected readonly formBuilder: FormBuilder = inject(FormBuilder)
    protected readonly registryFacade: RegistryFacade = inject(RegistryFacade)
    protected readonly route: ActivatedRoute = inject(ActivatedRoute)
    protected readonly router: Router = inject(Router)
    protected readonly translateService: TranslateService = inject(TranslateService)

    protected readonly breakpoint: Record<string, string> = breakPoint
}
