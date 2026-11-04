import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Register jest-dom's matchers explicitly instead of importing
// '@testing-library/jest-dom/vitest'. That subpath does `import 'vitest'`,
// which fails under npm workspaces when jest-dom is hoisted to the root
// node_modules while vitest is only installed in apps/web/node_modules.
// Using the matchers entry + expect.extend avoids that resolution path.
expect.extend(matchers);
