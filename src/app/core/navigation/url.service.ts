import { Injectable } from '@angular/core';
import { APP_VERSION } from '@core/config/app-version';

const GITHUB_ISSUES_URL_PATTERN: RegExp = /github\.com\/.+\/issues/i;

// Matches the "id" of each field in .github/ISSUE_TEMPLATE/bug_report.yml — GitHub prefills an issue
// form field by matching a query param name against its id.
const BUG_REPORT_TEMPLATE: string = 'bug_report.yml';

@Injectable({ providedIn: 'root' })
/**
 * Purpose: Builds URLs that need more than static display — currently, a GitHub "new issue" link
 * prefilled against the app's bug_report.yml template with a description and the running app version.
 * Scope: Pure URL construction, no navigation or HTTP side effects; safe to call from any layer.
 * Limits: The GitHub prefill only applies when `issuesUrl` matches a `github.com/.../issues` pattern —
 * any other URL is returned unchanged.
 */
export class UrlService {
	public buildGithubIssueUrl(issuesUrl: string, description: string): string {
		if (!GITHUB_ISSUES_URL_PATTERN.test(issuesUrl)) {
			return issuesUrl;
		}
		const base: string = issuesUrl.endsWith('/') ? issuesUrl.slice(0, -1) : issuesUrl;
		const params: URLSearchParams = new URLSearchParams({
			template: BUG_REPORT_TEMPLATE,
			description,
			version: APP_VERSION,
		});
		return `${base}/new?${params.toString()}`;
	}
}
