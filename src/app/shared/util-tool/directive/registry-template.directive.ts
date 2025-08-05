import { Directive, inject, input, InputSignal, TemplateRef } from '@angular/core'

@Directive( {
    selector: '[appTemplate]',
    standalone: true,
} )
export class RegistryTemplateDirective {
    public appTemplate: InputSignal<string | undefined> = input.required()
    public template: TemplateRef<unknown> = inject( TemplateRef )
}
