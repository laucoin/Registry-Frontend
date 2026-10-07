import { inject } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { ProjectProfileDto } from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profile.dto'
import { GenericFormComponent } from '@shared/ui/base/generic-form.component'
import { map } from 'rxjs'
import { ProjectProfilesDto } from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profiles.dto'
import { GenericUtil } from '@shared/helpers/util/generic.util'

export abstract class GenericProjectProfileFormComponent extends GenericFormComponent<ProjectProfileModel, ProjectProfilesDto | ProjectProfileDto> {
    protected readonly facade: ProjectProfileFacade = inject( ProjectProfileFacade )

    protected readonly form: FormGroup

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()

        this.handleLoadedElement()
    }

    protected override loadData (): void {
        this.facade.resetProjectProfile()
        this.facade.fetchAssignableRoles()

        if (GenericUtil.nonNull( this.idParam )) {
            this.facade.fetchProjectProfile( this.idParam! )
        }
    }

    protected handleLoadedElement (): void {
        this.subscriptions.add(
            this.facade.projectProfile$.pipe(
                map( (activity: ProjectProfileModel | undefined): void => this.fillForm( activity ) ),
            ).subscribe(),
        )
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
