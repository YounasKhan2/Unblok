import { resolve } from 'node:path';
import { auditArchitecture } from './architecture';

const result = auditArchitecture(resolve(import.meta.dir, '../..'));
for (const finding of result.findings) console.error(`${finding.file}:${finding.line} [${finding.rule}] ${finding.message}`);
for (const exception of result.exceptions) console.info(`Preserved infrastructure: ${exception}`);
console.info(`Architecture checked ${result.files} source files and ${result.edges} resolved internal edges; ${result.findings.length} violations.`);
if (result.findings.length) process.exitCode = 1;
