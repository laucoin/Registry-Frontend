import { bootstrapApplication } from '@angular/platform-browser';
import { RegistryComponent } from '@core/layout/registry.component';
import { appConfig } from './app/app.config';

bootstrapApplication(RegistryComponent, appConfig).catch((err: unknown): void =>
	console.error(err),
);
