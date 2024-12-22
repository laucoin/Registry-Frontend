import { Component } from '@angular/core'
import { GenericFormComponent } from '../../../shared/util-tool/component/generic-form.component'
import { AppRouteEnum } from '../../../app-route.enum'
import { FormControl } from '@angular/forms'
import { Observable } from 'rxjs'
import { EventProfileFacade } from '../data/state/event-profile.facade'
import { SelectItem } from 'primeng/api'

@Component( {
    template: '',
} )
export abstract class GenericEventProfileFormComponent extends GenericFormComponent {
    protected readonly assignableRoles$: Observable<SelectItem<string>[]>

    protected constructor (protected readonly facade: EventProfileFacade) {
        super(
            AppRouteEnum.PROFILES,
            facade.elementLoading,
            facade.elementError,
        )

        this.assignableRoles$ = facade.assignableRoles
        this.facade.fetchAssignableRoles( this.contextEventId() )
    }

    protected get role (): FormControl {
        return this.form.get( 'role' ) as FormControl
    }

    protected get range (): FormControl {
        return this.form.get( 'range' ) as FormControl
    }
}
