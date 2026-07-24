import {ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, Signal} from '@angular/core'
import {TranslatePipe} from '@ngx-translate/core'
import {AvatarModule} from 'primeng/avatar'
import {Button} from 'primeng/button'
import {CardModule} from 'primeng/card'
import {MenuModule} from 'primeng/menu'
import {GenericModel} from '../../util-model/model/generic.model'
import {HistoryModel} from '../../util-model/model/history.model'
import {ElementSkeletonComponent} from '../element-skeleton/element-skeleton.component'
import {DialogModule} from 'primeng/dialog'
import {FormsModule, ReactiveFormsModule} from '@angular/forms'
import {InputTextModule} from 'primeng/inputtext'
import {Popover} from 'primeng/popover'
import {Ripple} from 'primeng/ripple'
import {ContextMenu} from 'primeng/contextmenu'
import {GenericComponent} from '../../util-tool/component/generic.component'
import {DateFormatPipe} from '../../util-tool/pipe/date-format.pipe'
import {MenuItem} from 'primeng/api'

@Component({
    selector: 'app-element-card',
    standalone: true,
    imports: [
        CardModule,
        AvatarModule,
        ElementSkeletonComponent,
        Button,
        MenuModule,
        TranslatePipe,
        DialogModule,
        FormsModule,
        InputTextModule,
        ReactiveFormsModule,
        Popover,
        Ripple,
        ContextMenu,
    ],
    templateUrl: './element-card.component.html',
    styleUrl: './element-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
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

    private buildHistoryItem(history: HistoryModel, translationPrefix: string): string {
        const key: string = `${translationPrefix}${history.user ? '-user' : ''}`
        return this.translateService.instant(
            key,
            {
                datetime: this.datePipe.transform(history.dateTime, 'datetime'),
                user: history.user?.email,
            },
        )
    }
}
