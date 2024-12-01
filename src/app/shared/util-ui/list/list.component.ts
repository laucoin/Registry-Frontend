import { AsyncPipe, DatePipe, NgForOf, NgTemplateOutlet } from '@angular/common'
import {
    Component,
    ContentChildren,
    EventEmitter,
    Input,
    Output,
    QueryList,
    TemplateRef,
    ViewChild,
} from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { Message } from 'primeng/api'
import { CardModule } from 'primeng/card'
import { DataView, DataViewModule, DataViewPageEvent } from 'primeng/dataview'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { Observable } from 'rxjs'
import { GenericModel } from '../../util-model/model/generic.model'
import { PageEventModel } from '../../util-model/model/page-event.model'
import { PageModel } from '../../util-model/model/page.model'
import { GenericComponent } from '../../util-tool/component/generic.component'
import { RegistryTemplateDirective } from '../../util-tool/directive/registry-template.directive'
import { ElementSkeletonComponent } from '../element-skeleton/element-skeleton.component'
import { MessageComponent } from '../message/message.component'
import { AccordionModule } from 'primeng/accordion'

@Component( {
    selector: 'app-list',
    standalone: true,
    imports: [
        DataViewModule,
        AsyncPipe,
        TranslateModule,
        DatePipe,
        ToggleButtonModule,
        NgTemplateOutlet,
        NgForOf,
        CardModule,
        ElementSkeletonComponent,
        MessageComponent,
        AccordionModule,
    ],
    templateUrl: './list.component.html',
    styleUrl: './list.component.scss',
} )
export class ListComponent<T extends GenericModel> extends GenericComponent {
    @ContentChildren( RegistryTemplateDirective ) public templates: QueryList<RegistryTemplateDirective> | undefined
    @ViewChild( 'data' ) public dataView!: DataView

    @Input( { required: true } ) public elementPage$!: Observable<PageModel<T> | undefined>
    @Input( { required: true } ) public loading$!: Observable<boolean>
    @Input( { required: true } ) public error$!: Observable<Message | undefined>

    @Output() public readonly updateRequired: EventEmitter<PageEventModel> = new EventEmitter<PageEventModel>()

    protected layout: 'list' | 'grid' = 'list'

    protected updateData (pageEvent: DataViewPageEvent | undefined = undefined): void {
        return this.updateRequired.emit( this.pageEvent( pageEvent ) )
    }

    protected pageEvent (pageEvent: DataViewPageEvent | undefined = undefined): PageEventModel {
        return {
            offset: pageEvent?.first || this.dataView?.first || 0, limit: pageEvent?.rows || this.dataView?.rows || 20,
        }
    }

    protected getTemplate (name: string): TemplateRef<unknown> | null {
        const customTemplate: RegistryTemplateDirective | undefined = this.templates?.find( (t: RegistryTemplateDirective): boolean => t.name === name )
        return customTemplate ? customTemplate.template : null
    }

    protected updateLayout (isGrid: boolean): void {
        this.layout = isGrid ? 'grid' : 'list'
    }

    protected counterArray (n: number): unknown[] {
        return Array( n )
    }
}
