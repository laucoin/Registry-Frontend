import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '@core/layout/footer/footer.component';
import { HeaderComponent } from '@core/layout/header/header.component';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

@Component({
	selector: 'app-main',
	imports: [RouterOutlet, TranslocoPipe, HeaderComponent, FooterComponent],
	providers: [provideTranslocoScope('main')],
	templateUrl: './main.component.html',
	styleUrl: './main.component.less',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: App shell layout — wraps the routed page between the header and footer.
 * Scope: Pure composition; no logic of its own.
 * Limits: None beyond that — purely structural.
 */
export class MainComponent {}
