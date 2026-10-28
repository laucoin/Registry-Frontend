// Valide le message de commit selon Conventional Commits (semantic-release en dépend).
// Le réécrit à partir du nom de branche quand c'est possible, marque les commits « wip » avec [skip ci].
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const keywords = [ 'build', 'chore', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test', 'BREAKING_CHANGE' ];
const conventionRegex = new RegExp(`^(${ keywords.join('|') })(\\([\\w\\-\\s]+\\))?!?\\s?:\\s.+`, 'i');

const file = process.argv[2];
const message = readFileSync(file, 'utf8').split('\n')[0];

// Les commits de merge, de revert et de fixup générés par git lui-même passent
if (/^(Merge |Revert "|fixup! |squash! |\[skip ci\])/.test(message) || conventionRegex.test(message)) {
    process.exit(0);
}

if (/^wip/i.test(message)) {
    writeFileSync(file, `[skip ci] ${ message }\n`);
    console.log('WIP commit: "[skip ci]" prefix added');
    process.exit(0);
}

// Essayer « feat/example » -> « feat(example): message »
const branch = execSync('git branch --show-current').toString().trim();
const keyword = branch.match(new RegExp(`(${ keywords.join('|') })`, 'i'))?.[1];
const detail = branch.match(/([^/]+)$/)?.[1];
if (keyword) {
    for (const candidate of [ `${ keyword }(${ detail }): ${ message }`, `${ keyword }: ${ message }` ]) {
        if (conventionRegex.test(candidate)) {
            writeFileSync(file, `${ candidate }\n`);
            console.log(`Commit message rewritten from branch "${ branch }": ${ candidate }`);
            process.exit(0);
        }
    }
}

console.error(`\n✖ Commit message "${ message }" does not follow Conventional Commits.\n
  Expected: <type>(<scope>): <summary>   e.g. feat(auth): add refresh token
  Types:    ${ keywords.join(', ') }
  Or start with "wip" to skip CI.\n`);
process.exit(1);
