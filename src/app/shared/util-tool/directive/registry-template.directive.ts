import { Directive, input, InputSignal, TemplateRef } from '@angular/core'

@Directive( {
    selector: '[appTemplate]',
    standalone: true,
} )
export class RegistryTemplateDirective {
    public appTemplate: InputSignal<string | undefined> = input.required()

    public constructor (public template: TemplateRef<unknown>) {}
}
