import { Component } from '@angular/core'
import { RouterOutlet } from "@angular/router";
import { TranslocoPipe } from '@jsverse/transloco';
import { FooterComponent } from "@core/layout/footer/footer.component";
import { NavbarComponent } from "@core/layout/navbar/navbar.component";

/**
 * Purpose: Shell of the authenticated pages.
 * Scope: Frames the routed page between the navbar and the footer.
 * Limits: Holds no state and contains no business logic.
 */
@Component({
	selector: 'app-main',
	templateUrl: './main.component.html',
	styleUrl: './main.component.css',
	imports: [
		RouterOutlet,
		NavbarComponent,
		FooterComponent,
		TranslocoPipe,
	]
})
export class MainComponent {
	protected focusContent(event: Event, content: HTMLElement): void {
		event.preventDefault()
		content.focus()
	}
}
