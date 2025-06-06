import { GenericComponent } from './generic.component'
import { CurrentUserUtil } from '../../util-authentication/tool/current-user.util'
import { ProjectModel } from '../../util-model/model/project.model'
import { inject } from '@angular/core'
import { ElementActionEnum } from '../../util-model/enumeration/element-action.enum'
import { Confirmation, ConfirmationService } from 'primeng/api'
import { ProjectAuthorityEnum } from '../../util-model/enumeration/project-authority.enum'
import { UserAuthorityEnum } from '../../util-model/enumeration/user-authority.enum'
import { ProjectOptionEnum } from '../../util-model/enumeration/project-option.enum'
import { ProjectUtil } from '../util/project.util'
import { AppConfig } from '../../../app.config'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'

export abstract class GenericElementComponent extends GenericComponent {
    protected readonly confirmationService: ConfirmationService = inject( ConfirmationService )

    protected hasProjectAuthority (
        authority: ProjectAuthorityEnum,
        projectId: string | undefined = this.registryFacade.selectedProject()?.id,
    ): boolean {
        return CurrentUserUtil.hasProjectAuthority(
            this.registryFacade.currentUser(),
            projectId,
            authority,
        )
    }

    protected hasAuthority (authority: UserAuthorityEnum): boolean {
        return CurrentUserUtil.hasUserAuthority( this.registryFacade.currentUser(), authority )
    }

    protected actionIsEnable (action: ElementActionEnum): boolean {
        return AppConfig.settings.enabledActions.includes( action )
    }

    protected projectHasOption (
        option: ProjectOptionEnum,
        project: ProjectModel | undefined = this.registryFacade.selectedProject(),
    ): boolean {
        return ProjectUtil.hasOption( project, option )
    }

    protected buildConfirmation (
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

    protected buildCustomConfirmation (
        titleTranslationKey: string,
        messageTranslationKey: string,
        icon: string,
        element: unknown,
        acceptSeverity: SeverityEnum,
        accept: () => void,
    ): Confirmation {
        return {
            header: this.translateService.instant( titleTranslationKey, { element: element } ),
            message: this.translateService.instant( messageTranslationKey, { element: element } ),
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
