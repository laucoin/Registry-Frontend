import { Directive, Input, TemplateRef } from '@angular/core'

@Directive( {
    selector: '[appTemplate]', standalone: true,
} )
export class RegistryTemplateDirective {
    @Input( 'appTemplate' ) public name: string | undefined

    public constructor (public template: TemplateRef<unknown>) {
    }
}
