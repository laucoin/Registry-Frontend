export interface EnvironmentModel {
    production: boolean
    backend: {
        url: string
        noAuthPaths: string[]
    }
    hosting: {
        providerName: string | null
        providerAddress: string | null
    }
}
