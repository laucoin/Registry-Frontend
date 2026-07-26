// ADR 023 — fail-fast boot validation: if config.json is missing or malformed,
// or the production legal notice is incomplete, the thrown error aborts Nitro
// startup before a single request is served.
export default defineNitroPlugin(() => {
	const config = loadRegistryConfig()
	assertLegalHostingConfigured()
	console.info(
		`[registry] runtime config loaded — languages: ${config.languages.join(', ')}, `
		+ `default: ${config.defaultLanguage}`,
	)
})
