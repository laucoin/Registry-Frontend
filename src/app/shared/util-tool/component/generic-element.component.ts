import { ActionModel } from '../../util-model/model/action.model'
import { DateIntervalModel } from '../../util-model/model/date-interval.model'
import { GenericComponent } from './generic.component'
import { GenericModel } from '../../util-model/model/generic.model'
import { CurrentUserUtil } from '../../util-authentication/tool/current-user.util'
import { ProjectModel } from '../../util-model/model/project.model'
import { FormUtil } from '../util/form.util'
import { signal, WritableSignal } from '@angular/core'
import { IntervalStatusEnum } from '../../util-model/enumeration/interval-status.enum'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'
import { ElementActionEnum } from '../../util-model/enumeration/element-action.enum'

export abstract class GenericElementComponent<M extends GenericModel> extends GenericComponent {
    protected readonly FormUtil: typeof FormUtil = FormUtil

    protected readonly SeverityEnum: typeof SeverityEnum = SeverityEnum
    protected readonly IntervalStatusEnum: typeof IntervalStatusEnum = IntervalStatusEnum

    public readonly action: WritableSignal<ActionModel | undefined> = signal( undefined )

    protected buildActions (element: M, actions: ActionModel[]): ActionModel[] {
        return actions
            .filter( (action: ActionModel): boolean => this.isActionVisible( element, action ) )
            .map( (action: ActionModel): ActionModel => ({
                    ...action,
                    disabled: this.disabledAction( element, action ),
                }),
            )
    }

    protected showDialogIfNeeded (action: ActionModel): void {
        if (action?.confirmation) {
            this.action.set( action )
        } else {
            this.handleAction( action!.id )
        }
    }

    protected abstract isActionVisible (element: M, action: ActionModel): boolean

    protected disabledAction (element: M, action: ActionModel): boolean {
        return !CurrentUserUtil.isFeasible(
            this.registryFacade.currentUser(),
            'project' in element ? (element.project as ProjectModel) : undefined,
            action,
        )
    }

    protected abstract handleAction (action: ElementActionEnum): void

    protected buildInterval (interval: DateIntervalModel | undefined): string {
        let result: string = ''
        if (!interval) return result
        Object.entries( interval ).reverse().forEach( ([ key, value ]: [ string, number ]): void => {
            if (value !== 0) {
                result = this.translateService.instant(
                    'global.date-and-time-format.' + key + (value > 1 ? '.few' : '.one'),
                    { count: value },
                )
            }
        } )
        return result
    }
}
