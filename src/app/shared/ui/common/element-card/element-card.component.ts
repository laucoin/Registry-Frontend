import { Component, computed, inject, input, InputSignal, Signal} from '@angular/core'
import {TranslocoPipe} from '@jsverse/transloco'
import {AvatarModule} from 'primeng/avatar'
import {Button} from 'primeng/button'
import {CardModule} from 'primeng/card'
import {MenuModule} from 'primeng/menu'
import {GenericModel} from '@shared/models/model/generic.model'
import {HistoryModel} from '@shared/models/model/history.model'
import {ElementSkeletonComponent} from '@shared/ui/common/element-skeleton/element-skeleton.component'
import {DialogModule} from 'primeng/dialog'
import {InputTextModule} from 'primeng/inputtext'
import {Popover} from 'primeng/popover'
import {Ripple} from 'primeng/ripple'
import {ContextMenu} from 'primeng/contextmenu'
import {GenericComponent} from '@shared/ui/base/generic.component'
import {DateFormatPipe} from '@shared/helpers/pipe/date-format.pipe'
import {MenuItem} from 'primeng/api'

/**
 * Purpose: Card frame shared by every element of a list.
 * Scope: Renders the header, the actions menu and the content slot.
 * Limits: No domain logic; actions are provided by the parent.
 */
@Component({
    selector: 'app-element-card',
    imports: [
        CardModule,
        AvatarModule,
        ElementSkeletonComponent,
        Button,
        MenuModule,
        TranslocoPipe,
        DialogModule,
        InputTextModule,
        Popover,
        Ripple,
        ContextMenu,
    ],
    templateUrl: './element-card.component.html',
    styleUrl: './element-card.component.css',
})
export class ElementCardComponent<T extends GenericModel> extends GenericComponent {
    private readonly datePipe: DateFormatPipe = inject(DateFormatPipe)

    public readonly element: InputSignal<T> = input.required()
    public readonly actions: InputSignal<MenuItem[]> = input<MenuItem[]>([])
    public readonly icon: InputSignal<string | undefined> = input()
    public readonly loading: InputSignal<boolean> = input(false)
    public readonly actionMenuVisible: InputSignal<boolean> = input(true)

    protected readonly creationLabel: Signal<string> = computed((): string => this.buildHistoryItem(
        this.element().creation,
        'global.date-and-time-format.element-created',
    ))

    protected readonly lastEditionLabel: Signal<string> = computed((): string => this.buildHistoryItem(
        this.element().lastEdition,
        'global.date-and-time-format.element-last-update',
    ))

    private buildHistoryItem(history: HistoryModel | undefined, translationPrefix: string): string {
        if (!history) return ''
        const key: string = `${translationPrefix}${history.user ? '-user' : ''}`
        return this.translateService.translate(
            key,
            {
                datetime: this.datePipe.transform(history.dateTime, 'datetime'),
                user: history.user?.email,
            },
        )
    }
}
