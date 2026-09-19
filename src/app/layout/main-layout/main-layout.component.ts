import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { Footer } from '@layout/footer/footer.component';
import { Header } from '@layout/header/header.component';

@Component({
	selector: 'app-main-layout',
	standalone: true,
	imports: [RouterOutlet, TranslocoPipe, Header, Footer],
	providers: [provideTranslocoScope('mainLayout')],
	templateUrl: './main-layout.component.html',
	styleUrl: './main-layout.component.less',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {
}
