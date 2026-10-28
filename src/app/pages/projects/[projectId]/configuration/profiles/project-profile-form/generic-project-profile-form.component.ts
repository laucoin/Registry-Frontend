import { inject } from '@angular/core'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { BaseFormComponent } from '@shared/ui/base/base-form.component'

/**
 * Purpose: Base partagée des pages d'invitation et d'édition de profil de projet.
 * Scope: Fournit la facade de profil et charge les rôles assignables.
 * Limits: Ne possède pas de modèle de formulaire ; les pages concrètes le font.
 */
export abstract class GenericProjectProfileFormComponent extends BaseFormComponent {
    protected readonly facade: ProjectProfileFacade = inject( ProjectProfileFacade )

    protected override loadData (): void {
        this.facade.fetchAssignableRoles()
    }

    protected handleLoadedElement (): void {
        // le formulaire est rempli une fois le profil récupéré, voir loadData
    }

    protected get idParam (): string | undefined {
        return this.route.snapshot.params['profileId']
    }
}
