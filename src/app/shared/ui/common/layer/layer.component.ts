import {
    Component,
    ContentChildren,
    input,
    InputSignal,
    model,
    ModelSignal,
    output,
    OutputEmitterRef,
    QueryList,
    TemplateRef,
} from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { DialogModule } from 'primeng/dialog'
import { GenericComponent } from '@shared/ui/base/generic.component'

@Component( {
    selector: 'app-layer',
    imports: [
        NgTemplateOutlet,
        DialogModule,
    ],
    templateUrl: './layer.component.html',
} )
export class LayerComponent extends GenericComponent {
    @ContentChildren( RegistryTemplateDirective ) public templates: QueryList<RegistryTemplateDirective> | undefined

    public readonly title: InputSignal<string | undefined> = input()

    public readonly visible: ModelSignal<boolean> = model<boolean>( false )

    public readonly closeLayer: OutputEmitterRef<Event> = output<Event>()

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
