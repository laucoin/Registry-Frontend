import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    InputSignal,
    output,
    OutputEmitterRef,
    Signal,
} from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { MenuItem } from 'primeng/api'
import { AvatarModule } from 'primeng/avatar'
import { Button } from 'primeng/button'
import { CardModule } from 'primeng/card'
import { MenuModule } from 'primeng/menu'
import { ActionModel } from '../../util-model/model/action.model'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { GenericModel } from '../../util-model/model/generic.model'
import { HistoryModel } from '../../util-model/model/history.model'
import { ElementSkeletonComponent } from '../element-skeleton/element-skeleton.component'
import { DialogModule } from 'primeng/dialog'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { InputTextModule } from 'primeng/inputtext'
import { Popover } from 'primeng/popover'
import { Ripple } from 'primeng/ripple'
import { ContextMenu } from 'primeng/contextmenu'
import { GenericComponent } from '../../util-tool/component/generic.component'
import { DateFormatPipe } from '../../util-tool/pipe/date-format.pipe'

@Component( {
    selector: 'app-element-card',
    standalone: true,
    imports: [
        CardModule,
        AvatarModule,
        ElementSkeletonComponent,
        Button,
        MenuModule,
        TranslateModule,
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
} )
export class ElementCardComponent<T extends GenericModel> extends GenericComponent {
    private readonly datePipe: DateFormatPipe = inject( DateFormatPipe )

    public readonly element: InputSignal<T> = input.required()
    public readonly actions: InputSignal<ActionModel[]> = input<ActionModel[]>( [] )
    public readonly icon: InputSignal<string | undefined> = input()
    public readonly loading: InputSignal<boolean> = input( false )
    public readonly actionMenuVisible: InputSignal<boolean> = input( true )

    protected readonly items: Signal<MenuItem[]>
    protected readonly creationLabel: Signal<string>
    protected readonly lastEditionLabel: Signal<string>

    public readonly action: OutputEmitterRef<ActionModel> = output()

    public constructor () {
        super()

        this.items = computed( (): MenuItem[] => this.definedMenuItems(
            this.registryFacade.currentUser(),
            this.actions(),
        ) )

        this.creationLabel = computed( (): string => this.buildHistoryItem(
            this.element().creation,
            'global.date-and-time-format.element-created',
        ) )

        this.lastEditionLabel = computed( (): string => this.buildHistoryItem(
            this.element().lastEdition,
            'global.date-and-time-format.element-last-update',
        ) )
    }

    private definedMenuItems (currentUser: CurrentUserModel | undefined, actions: ActionModel[]): MenuItem[] {
        if (!currentUser) return []
        return actions
            .map( (action: ActionModel): MenuItem => ({
                label: action.label,
                icon: action.icon,
                disabled: action.disabled,
                command: (): void => this.action.emit( action ),
            }) )
    }

    private buildHistoryItem (history: HistoryModel, translationPrefix: string): string {
        const key: string = `${translationPrefix}${history.user ? '-user' : ''}`
        return this.translateService.instant(
            key,
            {
                datetime: this.datePipe.transform( history.dateTime, 'datetime' ),
                user: history.user?.email,
            },
        )
    }
}
