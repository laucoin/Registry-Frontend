import { Directive, ElementRef, OnInit, Renderer2 } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

@Directive( {
    selector: '[appRequired]',
    standalone: true,
} )
export class RegistryRequiredDirective implements OnInit {
    public constructor (
        private el: ElementRef,
        private renderer: Renderer2,
        private translateService: TranslateService,
    ) {}

    public ngOnInit (): void {
        this.addRequiredSpan()
    }

    private addRequiredSpan (): void {
        const spanElement: unknown = this.renderer.createElement( 'span' )
        const translatedText: string | unknown = this.translateService.instant( 'global.form.required' )

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
