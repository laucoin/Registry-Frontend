import { FormControl, FormGroup } from '@angular/forms'
import { GenericComponent } from './generic.component'
import { AppRouteEnum } from '../../../app-route.enum'
import { Subscription } from 'rxjs'
import { ProjectModel } from '../../util-model/model/project.model'
import { RegistryValidators } from '../util/registry.validator'
import { inject } from '@angular/core'
import { FormUtil } from '../util/form.util'
import { CustomDateFormatPipe } from '../pipe/custom-date-format.pipe'
import { Location } from '@angular/common'
import { GenericUtil } from '../util/generic.util'

export abstract class GenericFormComponent<M, D> extends GenericComponent {
    protected readonly FormUtil: typeof FormUtil = FormUtil

    protected readonly datePipe: CustomDateFormatPipe = inject( CustomDateFormatPipe )
    private readonly location: Location = inject( Location )

    protected readonly subscriptions: Subscription = new Subscription()

    protected readonly invalidFormMessage: string = this.translateService.instant( 'global.messages.invalid-form' )
    protected readonly startDateExample: Date = GenericFormComponent.startDateExample
    protected readonly endDateExample: Date = GenericFormComponent.endDateExample

    protected constructor () {
        super()
    }

    private static get startDateExample (): Date {
        const now: Date = new Date()

        if (now.getMonth() > 6) {
            now.setFullYear( now.getFullYear() + 1 )
        }

        now.setMonth( 6, 20 )
        now.setHours(
            Math.floor( Math.random() * 23 ),
            Math.floor( Math.random() * 59 ),
        )
        return now
    }

    private static get endDateExample (): Date {
        const now: Date = this.startDateExample
        now.setMonth( 7, 2 )
        now.setHours(
            Math.floor( Math.random() * 23 ),
            Math.floor( Math.random() * 59 ),
        )
        return now
    }

    protected abstract loadData (): void

    protected abstract initForm (): FormGroup

    protected abstract handleLoadedElement (): void

    protected addProjectDateValidators (
        project: ProjectModel | undefined,
        control: FormControl,
    ): void {
        if (project?.begin) {
            control.addValidators( RegistryValidators.minDateTime(
                project?.begin,
                this.datePipe.transform( project?.begin ),
            ) )
        }
        if (project?.end) {
            control.addValidators( RegistryValidators.maxDateTime(
                project?.end,
                this.datePipe.transform( project?.end ),
            ) )
        }
    }

    protected abstract fillForm (element: M | undefined): void

    protected abstract submit (): void

    protected abstract buildDto (): D

    protected navigateToRedirectUri (route: AppRouteEnum | undefined = undefined): void {
        if (GenericUtil.nonNull( route )) this.router.navigateByUrl( route! ).catch( (): void => this.location.back() )
        this.location.back()
    }

    protected abstract get idParam (): string | undefined
}
