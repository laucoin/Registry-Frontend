import { inject, signal, WritableSignal } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { ProjectProfileDto } from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profile.dto'
import { GenericFormComponent } from '@shared/ui/base/generic-form.component'
import { withLoading } from '@shared/helpers/rx.helper'
import { ProjectProfilesDto } from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profiles.dto'
import { GenericHelper } from '@shared/helpers/generic.helper'

/**
 * Purpose: Shared form of the project profile invitation and edition.
 * Scope: Builds the common fields and role selection.
 * Limits: Does not choose between creation and edition; the concrete pages do.
 */
export abstract class GenericProjectProfileFormComponent extends GenericFormComponent<ProjectProfileModel, ProjectProfilesDto | ProjectProfileDto> {
    protected readonly facade: ProjectProfileFacade = inject( ProjectProfileFacade )

    protected readonly form: FormGroup
    protected readonly projectProfile: WritableSignal<ProjectProfileModel | undefined> = signal( undefined )

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()

        this.handleLoadedElement()
    }

    protected override loadData (): void {
        this.facade.fetchAssignableRoles()

        if (GenericHelper.nonNull( this.idParam )) {
            this.subscriptions.add(
                this.facade.fetchProjectProfile( this.idParam! ).pipe(
                    withLoading( this.loading ),
                ).subscribe( (profile: ProjectProfileModel): void => {
                    this.projectProfile.set( profile )
                    this.fillForm( profile )
                } ),
            )
        }
    }

    protected handleLoadedElement (): void {
        // the form is filled once the profile is fetched, see loadData
    }

    protected get idParam (): string | undefined {
        return this.route.snapshot.params['profileId']
    }

    protected get role (): FormControl {
        return this.form.get( 'role' ) as FormControl
    }

    protected get beginDateTime (): FormControl {
        return this.form.get( 'beginDateTime' ) as FormControl
    }

    protected get endDateTime (): FormControl {
        return this.form.get( 'endDateTime' ) as FormControl
    }
}
