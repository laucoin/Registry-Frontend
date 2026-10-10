import { Directive, ElementRef, inject, OnInit, Renderer2 } from '@angular/core'
import {TranslocoService} from '@jsverse/transloco'

/**
 * Purpose: Marks a form control as required for accessibility and styling.
 * Scope: Binds the required state of the host control.
 * Limits: Does not validate; validators do.
 */
@Directive( {
    selector: '[appRequired]',
} )
export class RegistryRequiredDirective implements OnInit {
    private el: ElementRef = inject( ElementRef )
    private renderer: Renderer2 = inject( Renderer2 )
    private translateService: TranslocoService = inject( TranslocoService )

    public ngOnInit (): void {
        this.addRequiredSpan()
    }

    private addRequiredSpan (): void {
        const spanElement: unknown = this.renderer.createElement( 'span' )
        const translatedText: string | unknown = this.translateService.translate( 'global.form.required' )

        this.renderer.setProperty( spanElement, 'innerHTML', ` - ${translatedText}` )
        this.setStyle( spanElement )
        this.renderer.appendChild( this.el.nativeElement, spanElement )
    }

    private setStyle (spanElement: unknown): void {
        this.renderer.setStyle(
            spanElement,
            'color',
            'var(--text-color-secondary)',
        )
        this.renderer.setStyle( spanElement, 'font-size', '12px' )
    }
}
