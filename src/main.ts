import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from '@app/app.config';
import { Registry } from '@layout/registry/registry';

bootstrapApplication(Registry, appConfig).catch((err: unknown): void => console.error(err));
