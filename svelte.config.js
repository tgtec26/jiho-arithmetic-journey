import adapter from '@sveltejs/adapter-static';
import { relative, sep } from 'node:path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
        compilerOptions: {
                // defaults to rune mode for the project, except for `node_modules`. Can be removed in svelte 6.
                runes: ({ filename }) => {
                        const relativePath = relative(import.meta.dirname, filename);
                        const pathSegments = relativePath.toLowerCase().split(sep);
                        const isExternalLibrary = pathSegments.includes('node_modules');

                        return isExternalLibrary ? undefined : true;
                }
        },
        kit: {
                adapter: adapter({ fallback: 'index.html' }),
                // 학습지 퍼즐 규칙(순수 모듈)을 앱에서 그대로 쓴다
                alias: { $think: 'worksheets/lib/think' }
        }
};

export default config;
