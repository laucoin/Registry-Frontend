export interface EnvironmentModel {
    production: boolean
    backend: {
        url: string
        noAuthPaths: string[]
    }
}
