import {GenericComponent} from '@shared/ui/base/generic.component'
import {CurrentUserHelper} from '@core/authentication/tool/current-user.helper'
import {ProjectModel} from '@shared/models/model/project.model'
import {inject, signal, WritableSignal} from '@angular/core'
import {Observable} from 'rxjs'
import {withLoading} from '@shared/helpers/rx.helper'
import {ElementActionEnum} from '@shared/models/enumeration/element-action.enum'
import {Confirmation, ConfirmationService} from 'primeng/api'
import {ProjectAuthorityEnum} from '@shared/models/enumeration/project-authority.enum'
import {UserAuthorityEnum} from '@shared/models/enumeration/user-authority.enum'
import {ProjectOptionEnum} from '@shared/models/enumeration/project-option.enum'
import {ProjectHelper} from '@shared/helpers/project.helper'
import {RegistryConfig} from '@core/config/registry.config'
import {SeverityEnum} from '@shared/models/enumeration/severity.enum'

/**
 * Purpose: Base class of the element cards of a list.
 * Scope: Provides action menu handling, confirmation and the layer state shared by element cards.
 * Limits: Abstract; each card defines its own actions.
 */
export abstract class GenericElementComponent extends GenericComponent {
    protected readonly confirmationService: ConfirmationService = inject(ConfirmationService)

    protected readonly busy: WritableSignal<boolean> = signal(false)

    protected run(command: Observable<unknown>): void {
        command.pipe(withLoading(this.busy)).subscribe()
    }

    protected hasProjectAuthority(
        authority: ProjectAuthorityEnum,
        projectId: string | undefined = this.sessionFacade.selectedProject()?.id,
    ): boolean {
        return CurrentUserHelper.hasProjectAuthority(
            this.sessionFacade.currentUser(),
            projectId,
            authority,
        )
    }

    protected hasAuthority(authority: UserAuthorityEnum): boolean {
        return CurrentUserHelper.hasUserAuthority(this.sessionFacade.currentUser(), authority)
    }

    protected actionIsEnable(action: ElementActionEnum): boolean {
        return RegistryConfig.config.enabledActions.includes(action)
    }

    protected projectHasOption(
        option: ProjectOptionEnum,
        project: ProjectModel | undefined = this.sessionFacade.selectedProject(),
    ): boolean {
        return ProjectHelper.hasOption(project, option)
    }

    protected confirmThen(
        translationPrefix: string,
        icon: string,
        element: unknown,
        acceptSeverity: SeverityEnum,
        accept: () => void,
    ): () => void {
        return (): void => {
            this.confirmationService.confirm( this.buildConfirmation( translationPrefix, icon, element, acceptSeverity, accept ) )
        }
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
            header: this.translateService.translate(titleTranslationKey, {element: element}),
            message: this.translateService.translate(messageTranslationKey, {element: element}),
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
