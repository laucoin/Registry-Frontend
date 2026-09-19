import {
	AngularNodeAppEngine,
	createNodeRequestHandler,
	isMainModule,
	writeResponseToNodeResponse,
} from '@angular/ssr/node';
import { RuntimeConfigModel } from '@features/config/runtime-config.model';
import compression from 'compression';
import { config as loadDotenv } from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import { join } from 'node:path';

loadDotenv();

function readRequiredEnv(name: string): string {
	const value: string | undefined = process.env[name];
	if (!value) {
		throw new Error(
			`Missing required environment variable: ${name}. Copy .env.example to .env (dev) or set it on the host/container (prod).`,
		);
	}
	return value;
}

function readOptionalEnv(name: string): string | null {
	const value: string | undefined = process.env[name];
	return value && value.trim() ? value : null;
}

const hostingProviderName: string | null = readOptionalEnv('HOSTING_PROVIDER_NAME');
const hostingProviderAddress: string | null = readOptionalEnv('HOSTING_PROVIDER_ADDRESS');
if (!hostingProviderName || !hostingProviderAddress) {
	console.warn(
		'[config] HOSTING_PROVIDER_NAME and/or HOSTING_PROVIDER_ADDRESS are not set — the /terms and /privacy pages will show a fallback message instead of the hosting details.',
	);
}

const runtimeConfig: RuntimeConfigModel = {
	backend: {
		url: readRequiredEnv('BACKEND_URL'),
	},
	organization: {
		name: readRequiredEnv('ORGANIZATION_NAME'),
		website: readOptionalEnv('ORGANIZATION_WEBSITE'),
	},
	creator: {
		name: readRequiredEnv('CREATOR_NAME'),
		website: readOptionalEnv('CREATOR_WEBSITE'),
		email: readRequiredEnv('CREATOR_EMAIL'),
	},
	hosting: {
		providerName: hostingProviderName,
		providerAddress: hostingProviderAddress,
	},
	support: {
		issuesUrl: readOptionalEnv('SUPPORT_ISSUES_URL'),
	},
};

const browserDistFolder: string = join(import.meta.dirname, '../browser');

const app: express.Express = express();
const angularApp: AngularNodeAppEngine = new AngularNodeAppEngine();

app.use(compression());

app.get('/api/config', (req: Request, res: Response): void => {
	res.json(runtimeConfig);
});

/**
 * Serve static files from /browser
 */
app.use(
	express.static(browserDistFolder, {
		maxAge: '1y',
		index: false,
		redirect: false,
	}),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req: Request, res: Response, next: NextFunction): void => {
	angularApp
		.handle(req)
		.then((response: globalThis.Response | null): void | Promise<void> =>
			response ? writeResponseToNodeResponse(response, res) : next(),
		)
		.catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
	const port: string | number = process.env['PORT'] || 4000;
	app.listen(port, (error?: Error): void => {
		if (error) {
			throw error;
		}

		console.log(`Node Express server listening on http://localhost:${port}`);
	});
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler: ReturnType<typeof createNodeRequestHandler> =
	createNodeRequestHandler(app);
