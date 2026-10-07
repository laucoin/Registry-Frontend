import {GenericComponent} from '@shared/ui/base/generic.component'
import {CurrentUserUtil} from '@core/authentication/tool/current-user.util'
import {ProjectModel} from '@shared/models/model/project.model'
import {inject, signal, WritableSignal} from '@angular/core'
import {Observable} from 'rxjs'
import {withLoading} from '@shared/helpers/util/rx.util'
import {ElementActionEnum} from '@shared/models/enumeration/element-action.enum'
import {Confirmation, ConfirmationService} from 'primeng/api'
import {ProjectAuthorityEnum} from '@shared/models/enumeration/project-authority.enum'
import {UserAuthorityEnum} from '@shared/models/enumeration/user-authority.enum'
import {ProjectOptionEnum} from '@shared/models/enumeration/project-option.enum'
import {ProjectUtil} from '@shared/helpers/util/project.util'
import {RegistryConfig} from '@core/config/registry.config'
import {SeverityEnum} from '@shared/models/enumeration/severity.enum'

export abstract class GenericElementComponent extends GenericComponent {
    protected readonly confirmationService: ConfirmationService = inject(ConfirmationService)

    protected readonly busy: WritableSignal<boolean> = signal(false)

    protected run(command: Observable<unknown>): void {
        command.pipe(withLoading(this.busy)).subscribe()
    }

    protected hasProjectAuthority(
        authority: ProjectAuthorityEnum,
        projectId: string | undefined = this.registryFacade.selectedProject()?.id,
    ): boolean {
        return CurrentUserUtil.hasProjectAuthority(
            this.registryFacade.currentUser(),
            projectId,
            authority,
        )
    }

    protected hasAuthority(authority: UserAuthorityEnum): boolean {
        return CurrentUserUtil.hasUserAuthority(this.registryFacade.currentUser(), authority)
    }

    protected actionIsEnable(action: ElementActionEnum): boolean {
        return RegistryConfig.config.enabledActions.includes(action)
    }

    protected projectHasOption(
        option: ProjectOptionEnum,
        project: ProjectModel | undefined = this.registryFacade.selectedProject(),
    ): boolean {
        return ProjectUtil.hasOption(project, option)
    }

    protected buildConfirmation(
        translationPrefix: string,
        icon: string,
        element: unknown,
        acceptSeverity: SeverityEnum,
        accept: () => void,
    ): Confirmation {
        return this.buildCustomConfirmation(
            `${translationPrefix}.title`,
            `${translationPrefix}.message`,
            icon,
            element,
            acceptSeverity,
            accept,
        )
    }

    protected buildCustomConfirmation(
        titleTranslationKey: string,
        messageTranslationKey: string,
        icon: string,
        element: unknown,
        acceptSeverity: SeverityEnum,
        accept: () => void,
    ): Confirmation {
        return {
            header: this.translateService.instant(titleTranslationKey, {element: element}),
            message: this.translateService.instant(messageTranslationKey, {element: element}),
            icon: icon,
            rejectButtonProps: {
                severity: SeverityEnum.SECONDARY,
                outlined: true,
                rounded: true,
            },
            acceptButtonProps: {
                severity: acceptSeverity,
                outlined: true,
                rounded: true,
            },
            accept: accept,
        }
    }
}
