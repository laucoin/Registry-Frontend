import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, Signal, signal, WritableSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/divider'
import '@sgdf/ui/option'
import '@sgdf/ui/select'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileInvitationFormModel } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile.form'
import { FieldErrorDirective } from '@shared/directives/field-error.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { StringHelper } from '@shared/helpers/string.helper'
import { UserHelper } from '@shared/helpers/user.helper'
import { InvitedUserModel } from '@shared/models/model/invited-user.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { UserModel } from '@shared/models/model/user.model'
import { SelectElementsFieldComponent } from '@shared/ui/common/select-elements-field/select-elements-field.component'

/**
 * Purpose: Champs d'une invitation à un projet : le rôle, la période d'accès et les utilisateurs invités.
 * Scope: Lie les champs du formulaire d'invitation donné, recherche les utilisateurs à inviter pour le projet donné ou le projet sélectionné, propose d'inviter par email une adresse inconnue quand la fonctionnalité est activée, et affiche les rôles assignables chargés par son hôte.
 * Limits: Ne possède aucun modèle de formulaire, ne charge aucun rôle et ne soumet jamais ; la page qui l'héberge le fait.
 */
@Component( {
    selector: 'app-project-profile-invitation-fields',
    imports: [
        TranslocoPipe,
        FormField,
        FieldErrorDirective,
        SgdfFieldDirective,
        SelectElementsFieldComponent,
        PluralTranslationPipe,
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
    templateUrl: './project-profile-invitation-fields.component.html',
} )
export class ProjectProfileInvitationFieldsComponent {
    private readonly transloco: TranslocoService = inject( TranslocoService )
    private readonly query: WritableSignal<string> = signal( '' )

    protected readonly facade: ProjectProfileFacade = inject( ProjectProfileFacade )
    protected readonly UserHelper: typeof UserHelper = UserHelper
    protected readonly suggestions: Signal<SelectOptionModel<InvitedUserModel>[]> = computed( (): SelectOptionModel<InvitedUserModel>[] =>
        this.withInvitationByEmail( this.facade.searchedUsersMetadata(), this.query().trim() ),
    )

    public readonly fields: InputSignal<FieldTree<ProjectProfileInvitationFormModel>> = input.required()
    public readonly projectId: InputSignal<string | undefined> = input<string | undefined>()

    public constructor () {
        this.facade.fetchFeatures()
    }

    protected handleSearch ( searched: { query: string } ): void {
        this.query.set( searched.query )
        this.facade.searchUsers( searched.query, this.projectId() ?? this.facade.selectedProjectId() )
    }

    private withInvitationByEmail ( found: SelectOptionModel<UserModel>[], email: string ): SelectOptionModel<InvitedUserModel>[] {
        if (!this.canInviteByEmail( found, email )) return found

        return [ ...found, { label: this.transloco.translate( 'project-profiles.form.users.invite', { email } ), value: UserHelper.toInvitedByEmail( email ) } ]
    }

    private canInviteByEmail ( found: SelectOptionModel<UserModel>[], email: string ): boolean {
        return this.facade.inviteByEmailEnabled()
               && StringHelper.isEmail( email )
               && !found.some( (item: SelectOptionModel<UserModel>): boolean => item.value.email.toLowerCase() === email.toLowerCase() )
    }
}
