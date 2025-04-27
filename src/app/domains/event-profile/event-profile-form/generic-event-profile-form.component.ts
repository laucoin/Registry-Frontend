import { inject } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { EventProfileFacade } from '../data/state/event-profile.facade'
import { EventProfileModel } from '../../../shared/util-model/model/event-profile.model'
import { EventProfileDto } from '../data/dto/event-profile.dto'
import { GenericFormComponent } from '../../../shared/util-tool/component/generic-form.component'
import { AppRouteEnum } from '../../../app-route.enum'
import { map } from 'rxjs'
import { EventProfilesDto } from '../data/dto/event-profiles.dto'
import { GenericUtil } from '../../../shared/util-tool/util/generic.util'

export abstract class GenericEventProfileFormComponent extends GenericFormComponent<EventProfileModel, EventProfilesDto | EventProfileDto> {
    protected readonly facade: EventProfileFacade = inject( EventProfileFacade )

    protected readonly form: FormGroup
    protected readonly nextNavigation: AppRouteEnum = AppRouteEnum.PROFILES

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()

        this.handleLoadedElement()
    }

    protected override loadData (): void {
        this.facade.resetEventProfile()
        this.facade.fetchAssignableRoles()

        if (GenericUtil.nonNull( this.idParam )) {
            this.facade.fetchEventProfile( this.idParam! )
        }
    }

    protected handleLoadedElement (): void {
        this.subscriptions.add(
            this.facade.eventProfile$.pipe(
                map( (activity: EventProfileModel | undefined): void => this.fillForm( activity ) ),
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
