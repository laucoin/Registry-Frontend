import {
    ChangeDetectionStrategy,
    Component,
    ContentChildren,
    EventEmitter,
    input,
    Input,
    InputSignal,
    output,
    Output,
    OutputEmitterRef,
    QueryList,
    TemplateRef,
} from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import { RegistryTemplateDirective } from '../../util-tool/directive/registry-template.directive'
import { DialogModule } from 'primeng/dialog'
import { GenericComponent } from '../../util-tool/component/generic.component'

@Component( {
    selector: 'app-layer',
    standalone: true,
    imports: [
        NgTemplateOutlet,
        DialogModule,
    ],
    templateUrl: './layer.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class LayerComponent extends GenericComponent {
    @ContentChildren( RegistryTemplateDirective ) public templates: QueryList<RegistryTemplateDirective> | undefined

    public readonly title: InputSignal<string | undefined> = input()

    @Input()
    public get visible (): boolean {
        return this._visible
    }

    public set visible (value: boolean) {
        this._visible = value
        this.visibleChange.emit( this._visible ) // Emit updated value
    }

    public closeLayer: OutputEmitterRef<Event> = output<Event>()
    @Output() private visibleChange: EventEmitter<boolean> = new EventEmitter<boolean>()

    private _visible: boolean = false

    protected getTemplate (name: string): TemplateRef<unknown> | null {
        const customTemplate: RegistryTemplateDirective | undefined = this.templates?.find( (t: RegistryTemplateDirective): boolean => t.appTemplate() === name )
        return customTemplate ? customTemplate.template : null
    }

    protected get dialogStyle (): object {
        return this.registryFacade.tinyScreen() ? {
            'width': '95vw',
            'height': '90vh',
            'margin-bottom': '0',
            'border-bottom-left-radius': '0',
            'border-bottom-right-radius': '0',
        } : {
            'min-width': '25em',
            'width': '30%',
            'height': '100vh',
            'margin-right': '0',
            'border-top-right-radius': '0',
            'border-bottom-right-radius': '0',
        }
    }
}
