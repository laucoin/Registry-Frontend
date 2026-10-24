import {GenericComponent} from '@shared/ui/base/generic.component'
import {CurrentUserHelper} from '@core/authentication/tool/current-user.helper'
import {signal, WritableSignal} from '@angular/core'
import {Observable} from 'rxjs'
import {withLoading} from '@shared/helpers/rx.helper'
import {ConfirmationModel} from '@shared/models/model/confirmation.model'
import {ElementActionModel} from '@shared/models/model/element-action.model'
import {ProjectAuthorityEnum} from '@shared/models/enumeration/project-authority.enum'
import {UserAuthorityEnum} from '@shared/models/enumeration/user-authority.enum'
import {SeverityEnum} from '@shared/models/enumeration/severity.enum'

/**
 * Purpose: Base class of the element cards of a list.
 * Scope: Provides action menu handling, confirmation and the layer state shared by element cards.
 * Limits: Abstract; each card defines its own actions.
 */
export abstract class GenericElementComponent extends GenericComponent {
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

    protected confirmThen(
        translationPrefix: string,
        icon: string,
        element: unknown,
        acceptSeverity: SeverityEnum,
        accept: () => void,
    ): () => void {
        return (): void => {
            this.uiFacade.confirm( this.buildConfirmation( translationPrefix, icon, element, acceptSeverity, accept ) )
        }
    }

    protected buildConfirmation(
        translationPrefix: string,
        icon: string,
        element: unknown,
        acceptSeverity: SeverityEnum,
        accept: () => void,
    ): ConfirmationModel {
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
    ): ConfirmationModel {
        return {
            header: this.translateService.translate(titleTranslationKey, {element: element}),
            message: this.translateService.translate(messageTranslationKey, {element: element}),
            icon: icon,
            acceptSeverity: acceptSeverity,
            accept: accept,
        }
    }
}
