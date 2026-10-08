import {NgTemplateOutlet} from '@angular/common'
import {
    Component,
    computed,
    ContentChildren,
    input,
    InputSignal,
    output,
    OutputEmitterRef,
    QueryList,
    Signal,
    TemplateRef,
    ViewChild,
} from '@angular/core'
import {TranslocoPipe} from '@jsverse/transloco'
import {ToastMessageOptions} from 'primeng/api'
import {CardModule} from 'primeng/card'
import {DataView, DataViewModule, DataViewPageEvent} from 'primeng/dataview'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {GenericModel} from '@shared/models/model/generic.model'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {PageModel} from '@shared/models/model/page.model'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {ElementSkeletonComponent} from '@shared/ui/common/element-skeleton/element-skeleton.component'
import {Panel} from 'primeng/panel'
import {FormsModule} from '@angular/forms'
import {GenericComponent} from '@shared/ui/base/generic.component'
import {Skeleton} from 'primeng/skeleton'
import {DateFormatPipe} from '@shared/helpers/pipe/date-format.pipe'
import {SeverityEnum} from '@shared/models/enumeration/severity.enum'

@Component({
    selector: 'app-list',
    imports: [
        DataViewModule,
        TranslocoPipe,
        ToggleButtonModule,
        NgTemplateOutlet,
        CardModule,
        ElementSkeletonComponent,
        Panel,
        FormsModule,
        Skeleton,
        DateFormatPipe,
    ],
    templateUrl: './list.component.html',
    styleUrl: './list.component.css',
})
export class ListComponent<T extends GenericModel> extends GenericComponent {
    @ContentChildren(RegistryTemplateDirective) public templates: QueryList<RegistryTemplateDirective> | undefined
    @ViewChild('data') public dataView!: DataView

    protected readonly message: Signal<ToastMessageOptions>

    public readonly elementPage: InputSignal<PageModel<T> | undefined> = input.required()
    public readonly loading: InputSignal<boolean> = input.required()
    public readonly error: InputSignal<ToastMessageOptions | undefined> = input.required()
    public readonly emptyMessagePrefix: InputSignal<string> = input('global.notifications.EMPTY')

    public readonly updateRequired: OutputEmitterRef<PageEventModel> = output()

    public constructor() {
        super()

        this.message = computed(() => ({
            severity: SeverityEnum.WARNING,
            summary: `${this.emptyMessagePrefix()}.title`,
            detail: `${this.emptyMessagePrefix()}.message`,
        }))
    }

    protected updateData(pageEvent: DataViewPageEvent | undefined = undefined): void {
        return this.updateRequired.emit(this.pageEvent(pageEvent))
    }

    protected pageEvent(pageEvent: DataViewPageEvent | undefined = undefined): PageEventModel {
        const pageSize: number = pageEvent?.rows || this.dataView?.rows() || 20
        return {
            pageNumber: (pageEvent?.first || this.dataView?.first() || 0) / pageSize,
            pageSize: pageSize,
        }
    }

    protected getTemplate(name: string): TemplateRef<unknown> | null {
        const customTemplate: RegistryTemplateDirective | undefined = this.templates?.find((t: RegistryTemplateDirective): boolean => t.appTemplate() === name)
        return customTemplate ? customTemplate.template : null
    }

    protected counterArray(n: number): unknown[] {
        return Array(n)
    }
}
