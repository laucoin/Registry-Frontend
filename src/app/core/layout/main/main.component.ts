import { Component } from '@angular/core'
import { RouterOutlet } from "@angular/router";
import { FooterComponent } from "@core/layout/footer/footer.component";
import { NavbarComponent } from "@core/layout/navbar/navbar.component";

@Component({
	selector: 'app-main',
	templateUrl: './main.component.html',
	styleUrl: './main.component.css',
	imports: [
		RouterOutlet,
		NavbarComponent,
		FooterComponent,
	]
})
export class MainComponent {}
