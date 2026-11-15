export interface EnvironmentModel {
	production: boolean;
	backend: {
		url: string;
		noRefreshPaths: string[];
		credentialFreePaths: string[];
	};
	hosting: {
		providerName: string | null;
		providerAddress: string | null;
	};
}
