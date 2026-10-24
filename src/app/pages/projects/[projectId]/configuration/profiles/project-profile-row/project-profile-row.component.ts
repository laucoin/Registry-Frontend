import { UserProfileFacade } from '@core/registry/state/user-profile.facade'
import { FavoriteToggleComponent } from '@shared/ui/common/favorite-toggle/favorite-toggle.component'
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, Signal, TemplateRef, viewChild } from '@angular/core'
import { SessionFacade } from '@core/registry/state/session.facade'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/avatar'
import '@sgdf/ui/button'
import '@sgdf/ui/icon'
import '@sgdf/ui/list-item'
import '@sgdf/ui/tag'
import { ProjectProfileActions } from '@pages/projects/[projectId]/configuration/profiles/project-profile-row/project-profile-actions.service'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { isProjectProfile, ListedProfileModel, profileProjectId } from '@shared/models/model/listed-profile.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component'
import { EllipsisDirective } from '@shared/directives/ellipsis.directive'

const INITIALS_LENGTH: number = 2

type TagVariant = 'success' | 'info' | 'warning' | 'danger'

/**
 * Purpose: Template de ligne d'un profil de projet dans une liste, vu depuis l'utilisateur ou depuis le projet.
 * Scope: Contient le `sgdf-list-item` d'un profil (nom, dates d'accès, rôle, disponibilité, statut, réponse à l'invitation et menu d'actions) et l'expose comme un template que les pages de liste affichent dans leur propre liste.
 * Limits: N'affiche rien par lui-même ; la page décide où le template est utilisé. Les commandes sont déléguées à ProjectProfileActions.
 */
@Component({
    selector: 'app-project-profile-row',
    imports: [EllipsisDirective, TranslocoPipe, CustomDateFormatPipe, ElementActionsComponent, FavoriteToggleComponent],
    providers: [ProjectProfileActions],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    host: { hidden: '' },
    templateUrl: './project-profile-row.component.html',
})
export class ProjectProfileRowComponent {
    protected readonly actions: ProjectProfileActions = inject(ProjectProfileActions)
    private readonly sessionFacade: SessionFacade = inject(SessionFacade)
    private readonly userProfileFacade: UserProfileFacade = inject(UserProfileFacade)

    public readonly view: InputSignal<'user' | 'project'> = input.required()
    public readonly template: Signal<TemplateRef<unknown>> = viewChild.required<TemplateRef<unknown>>('row')

    protected readonly ProfileStatusEnum: typeof ProfileStatusEnum = ProfileStatusEnum

    protected title(profile: ListedProfileModel): string {
        return isProjectProfile( profile ) ? this.userName( profile ) : profile.project?.name ?? ''
    }

    protected initials(profile: ListedProfileModel): string {
        const words: string[] = this.title(profile).trim().split(/\s+/)
        const letters: string = words.length > 1 ? words.slice(0, INITIALS_LENGTH).map((word: string): string => word[0]).join('') : words[0].slice(0, INITIALS_LENGTH)
        return letters.toUpperCase()
    }

    protected isSelected(profile: ListedProfileModel): boolean {
        return this.sessionFacade.selectedProject()?.id === profileProjectId( profile )
    }

    protected awaitsAnswer(profile: ListedProfileModel): boolean {
        return profile.status.value === ProfileStatusEnum.INVITED && (!isProjectProfile( profile ) || profile.user.id === this.sessionFacade.currentUser()?.id)
    }

    protected canFavorite(profile: ListedProfileModel): boolean {
        return !isProjectProfile( profile ) && !!profile.project && !this.awaitsAnswer( profile )
    }

    protected isFavorite(profile: ListedProfileModel): boolean {
        return !isProjectProfile( profile ) && !!profile.project?.favorite
    }

    protected toggleFavorite(profile: ListedProfileModel): void {
        if (!isProjectProfile( profile )) this.userProfileFacade.toggleProjectFavorite( profile )
    }

    protected availabilityVariant(profile: ListedProfileModel): TagVariant {
        return profile.availabilityStatus?.value === AvailabilityStatusEnum.AVAILABLE ? 'success' : 'info'
    }

    protected statusVariant(profile: ListedProfileModel): TagVariant {
        switch (profile.status.value) {
            case ProfileStatusEnum.ACCEPTED:
                return 'success'
            case ProfileStatusEnum.REJECTED:
                return 'warning'
            case ProfileStatusEnum.BLOCKED:
                return 'danger'
            default:
                return 'info'
        }
    }

    private userName(profile: ProjectProfileModel): string {
        return [profile.user.firstName, profile.user.lastName?.toUpperCase()].filter(Boolean).join(' ') || profile.user.email
    }
}
