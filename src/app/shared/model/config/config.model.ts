import { EnvironmentConfigModel } from './environment-config.model'
import { ContextConfigModel } from './context-config.model'
import { EnvironmentModel } from '../../../config/environment.model'

export type ConfigModel = EnvironmentModel & EnvironmentConfigModel & ContextConfigModel
