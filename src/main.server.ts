import { ApplicationRef } from '@angular/core';
import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { config } from '@app/app.config.server';
import { Registry } from '@layout/registry/registry';

const bootstrap = (context: BootstrapContext): Promise<ApplicationRef> =>
	bootstrapApplication(Registry, config, context);

export default bootstrap;
