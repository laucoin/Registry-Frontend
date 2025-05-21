import { NgTemplateOutlet } from '@angular/common'
import {
    ChangeDetectionStrategy,
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
import { TranslateModule } from '@ngx-translate/core'
import { ToastMessageOptions } from 'primeng/api'
import { CardModule } from 'primeng/card'
import { DataView, DataViewModule, DataViewPageEvent } from 'primeng/dataview'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { GenericModel } from '../../util-model/model/generic.model'
import { PageEventModel } from '../../util-model/model/page-event.model'
import { PageModel } from '../../util-model/model/page.model'
import { RegistryTemplateDirective } from '../../util-tool/directive/registry-template.directive'
import { ElementSkeletonComponent } from '../element-skeleton/element-skeleton.component'
import { Panel } from 'primeng/panel'
import { FormsModule } from '@angular/forms'
import { GenericComponent } from '../../util-tool/component/generic.component'
import { Skeleton } from 'primeng/skeleton'
import { DateFormatPipe } from '../../util-tool/pipe/date-format.pipe'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'
import { SeverityInformationComponent } from '../severity-information/severity-information.component'

@Component( {
    selector: 'app-list',
    standalone: true,
    imports: [
        DataViewModule,
        TranslateModule,
        ToggleButtonModule,
        NgTemplateOutlet,
        CardModule,
        ElementSkeletonComponent,
        Panel,
        FormsModule,
        Skeleton,
        DateFormatPipe,
        SeverityInformationComponent,
    ],
    templateUrl: './list.component.html',
    styleUrl: './list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class ListComponent<T extends GenericModel> extends GenericComponent {
    @ContentChildren( RegistryTemplateDirective ) public templates: QueryList<RegistryTemplateDirective> | undefined
    @ViewChild( 'data' ) public dataView!: DataView

    protected readonly message: Signal<ToastMessageOptions>

    public readonly elementPage: InputSignal<PageModel<T> | undefined> = input.required()
    public readonly loading: InputSignal<boolean> = input.required()
    public readonly error: InputSignal<ToastMessageOptions | undefined> = input.required()
    public readonly warningTitle: InputSignal<string | undefined> = input()
    public readonly warningMessage: InputSignal<string | undefined> = input()

    public readonly updateRequired: OutputEmitterRef<PageEventModel> = output()

    public constructor () {
        super()

        this.message = computed( () => ({
            severity: SeverityEnum.WARNING,
            summary: this.warningTitle() ?? 'global.notifications.EMPTY.title',
            detail: this.warningMessage() ?? 'global.notifications.EMPTY.message',
        }) )
    }

    protected updateData (pageEvent: DataViewPageEvent | undefined = undefined): void {
        return this.updateRequired.emit( this.pageEvent( pageEvent ) )
    }

    protected pageEvent (pageEvent: DataViewPageEvent | undefined = undefined): PageEventModel {
        const pageSize: number = pageEvent?.rows || this.dataView?.rows || 20
        return {
            pageNumber: (pageEvent?.first || this.dataView?.first || 0) / pageSize,
            pageSize: pageSize,
        }
    }

    protected getTemplate (name: string): TemplateRef<unknown> | null {
        const customTemplate: RegistryTemplateDirective | undefined = this.templates?.find( (t: RegistryTemplateDirective): boolean => t.appTemplate() === name )
        return customTemplate ? customTemplate.template : null
    }

    protected counterArray (n: number): unknown[] {
        return Array( n )
    }
}
