import { ActionModel } from '../../util-model/model/action.model'
import { DateIntervalModel } from '../../util-model/model/date-interval.model'
import { GenericComponent } from './generic.component'
import { GenericModel } from '../../util-model/model/generic.model'
import { CurrentUserUtil } from '../../util-authentication/tool/current-user.util'
import { EventModel } from '../../util-model/model/event.model'
import { FormUtil } from '../util/form.util'
import { Subscription } from 'rxjs'
import { signal, WritableSignal } from '@angular/core'

export abstract class GenericElementComponent<M extends GenericModel, A> extends GenericComponent {
    protected readonly FormUtil: typeof FormUtil = FormUtil

    protected readonly subscriptions: Subscription = new Subscription()
    public readonly action: WritableSignal<ActionModel<A> | undefined> = signal( undefined )

    protected buildActions (element: M, actions: ActionModel<A>[]): ActionModel<A>[] {
        return actions
            .filter( (action: ActionModel<A>): boolean => this.isActionVisible( element, action ) )
            .map( (action: ActionModel<A>): ActionModel<A> => ({
                    ...action,
                    disabled: this.disabledAction( element, action ),
                }),
            )
    }

    protected showDialogIfNeeded (action: ActionModel<A>): void {
        if (action?.confirmation) {
            this.action.set( action )
        } else {
            this.handleAction( action!.id )
        }
    }

    protected abstract isActionVisible (element: M, action: ActionModel<A>): boolean

    protected disabledAction (element: M, action: ActionModel<A>): boolean {
        return !CurrentUserUtil.isFeasible(
            this.registryFacade.currentUser(),
            'event' in element ? (element.event as EventModel) : undefined,
            action,
        )
    }

    protected abstract handleAction (action: A): void

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
