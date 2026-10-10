import { inject } from '@angular/core'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { BaseFormComponent } from '@shared/ui/base/base-form.component'

/**
 * Purpose: Shared base of the project profile invitation and edition pages.
 * Scope: Provides the profile facade and loads the assignable roles.
 * Limits: Does not own a form model; the concrete pages do.
 */
export abstract class GenericProjectProfileFormComponent extends BaseFormComponent {
    protected readonly facade: ProjectProfileFacade = inject( ProjectProfileFacade )

    protected override loadData (): void {
        this.facade.fetchAssignableRoles()
    }

    protected handleLoadedElement (): void {
        // the form is filled once the profile is fetched, see loadData
    }

    protected get idParam (): string | undefined {
        return this.route.snapshot.params['profileId']
    }
}
