import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/divider'
import '@sgdf/ui/option'
import '@sgdf/ui/select'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileInvitationFormModel } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile.form'
import { FieldErrorDirective } from '@shared/directives/field-error.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { UserHelper } from '@shared/helpers/user.helper'
import { SelectElementsFieldComponent } from '@shared/ui/common/select-elements-field/select-elements-field.component'

/**
 * Purpose: Champs d'une invitation à un projet : le rôle, la période d'accès et les utilisateurs invités.
 * Scope: Lie les champs du formulaire d'invitation donné, recherche les utilisateurs à inviter pour le projet donné ou le projet sélectionné, et affiche les rôles assignables chargés par son hôte.
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
    protected readonly facade: ProjectProfileFacade = inject( ProjectProfileFacade )
    protected readonly UserHelper: typeof UserHelper = UserHelper

    public readonly fields: InputSignal<FieldTree<ProjectProfileInvitationFormModel>> = input.required()
    public readonly projectId: InputSignal<string | undefined> = input<string | undefined>()

    protected handleSearch ( searched: { query: string } ): void {
        this.facade.searchUsers( searched.query, this.projectId() ?? this.facade.selectedProjectId() )
    }
}
