import { Component, inject } from '@angular/core'
import { GenericFormComponent } from '../../../shared/util-tool/component/generic-form.component'
import { AppRouteEnum } from '../../../app-route.enum'
import { FormControl } from '@angular/forms'
import { Observable } from 'rxjs'
import { EventProfileFacade } from '../data/state/event-profile.facade'
import { SelectItem } from 'primeng/api'
import { EventModel } from '../../../shared/util-model/model/event.model'
import { CustomValidators } from '../../../shared/util-tool/util/custom-validator'
import { DatePipe } from '@angular/common'

@Component( {
    template: '',
} )
export abstract class GenericEventProfileFormComponent extends GenericFormComponent {
    protected readonly assignableRoles$: Observable<SelectItem<string>[]>
    private readonly datePipe: DatePipe = inject( DatePipe )

    protected constructor (protected readonly facade: EventProfileFacade) {
        super(
            AppRouteEnum.PROFILES,
            facade.elementLoading,
        )

        this.assignableRoles$ = facade.assignableRoles
        this.facade.fetchAssignableRoles( this.contextEventId() )

        this.handleContextEvent()
    }

    private handleContextEvent (): void {
        this.subscriptions.add(
            this.contextEvent$.subscribe( (event: EventModel | undefined): void => {
                if (event?.begin) {
                    this.range.addValidators( CustomValidators.minDate(
                        new Date( event?.begin ),
                        this.datePipe.transform(
                            new Date( event?.begin ),
                            this.translateService.instant( 'datetime.format.datetime' ),
                        )!,
                    ) )
                }
                if (event?.end) {
                    this.range.addValidators( CustomValidators.maxDate(
                        new Date( event?.end ),
                        this.datePipe.transform(
                            new Date( event?.end ),
                            this.translateService.instant( 'datetime.format.datetime' ),
                        )!,
                    ) )
                }
            } ),
        )
    }

    protected get role (): FormControl {
        return this.form.get( 'role' ) as FormControl
    }

    protected get range (): FormControl {
        return this.form.get( 'range' ) as FormControl
    }
}
