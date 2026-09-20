import { ApplicationRef } from '@angular/core';
import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { RegistryComponent } from '@core/layout/registry.component';
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext): Promise<ApplicationRef> =>
	bootstrapApplication(RegistryComponent, config, context);

export default bootstrap;
