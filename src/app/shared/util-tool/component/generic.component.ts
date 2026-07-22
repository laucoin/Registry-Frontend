import {RegistryFacade} from '../../util-common/state/registry.facade'
import {inject} from '@angular/core'
import {TranslateService} from '@ngx-translate/core'
import {ActivatedRoute, Router} from '@angular/router'
import {FormBuilder} from '@angular/forms'
import {UserAuthorityEnum} from '../../util-model/enumeration/user-authority.enum'
import {ProjectAuthorityEnum} from '../../util-model/enumeration/project-authority.enum'
import {CurrentUserUtil} from '../../util-authentication/tool/current-user.util'
import {GenericUtil} from '../util/generic.util'
import {StringUtil} from '../util/string.util'
import {breakPoint} from '../util/breakpoint.const'
import {AppRouteEnum} from '../../../app-route.enum'
import {ProjectUtil} from '../util/project.util'
import {ProjectOptionEnum} from '../../util-model/enumeration/project-option.enum'
import {SeverityEnum} from '../../util-model/enumeration/severity.enum'
import {FormUtil} from '../util/form.util'

export abstract class GenericComponent {
    protected readonly AppRouteEnum: typeof AppRouteEnum = AppRouteEnum

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
