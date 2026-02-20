/**
 * Validation script to check for common issues
 * Run with: node validate.js
 */

const fs = require('fs');
const path = require('path');

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

function check(name, condition, errorMsg) {
  if (condition) {
    checks.passed.push(name);
    console.log(`✅ ${name}`);
  } else {
    checks.failed.push(name);
    console.error(`❌ ${name}: ${errorMsg}`);
  }
}

function warn(name, message) {
  checks.warnings.push(name);
  console.warn(`⚠️  ${name}: ${message}`);
}

console.log('🔍 Validating JavaScript Chart Performance Test Suite\n');

// Check TypeScript config
check(
  'TypeScript config exists',
  fs.existsSync('tsconfig.json'),
  'tsconfig.json not found'
);

// Check package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
check(
  'React dependency installed',
  packageJson.dependencies.react !== undefined,
  'React not found in dependencies'
);
check(
  'TypeScript dev dependency installed',
  packageJson.devDependencies.typescript !== undefined,
  'TypeScript not found in devDependencies'
);

// Check React entry points
check(
  'Index React HTML exists',
  fs.existsSync('public/index-react.html'),
  'public/index-react.html not found'
);
check(
  'Charts React HTML exists',
  fs.existsSync('public/charts-react.html'),
  'public/charts-react.html not found'
);

// Check React entry modules
check(
  'Main.tsx exists',
  fs.existsSync('src/main.tsx'),
  'src/main.tsx not found'
);
check(
  'Charts.tsx exists',
  fs.existsSync('src/charts.tsx'),
  'src/charts.tsx not found'
);

// Check test runner
check(
  'Test runner TypeScript exists',
  fs.existsSync('src/test-runner.ts'),
  'src/test-runner.ts not found'
);
check(
  'TypeScript test HTML exists',
  fs.existsSync('public/scichart/scichart-ts.html'),
  'public/scichart/scichart-ts.html not found'
);

// Check core directories
const coreDirs = [
  'src/components',
  'src/contexts',
  'src/hooks',
  'src/services',
  'src/types',
  'src/utils',
  'src/constants'
];

coreDirs.forEach(dir => {
  check(
    `${dir} directory exists`,
    fs.existsSync(dir),
    `${dir} directory not found`
  );
});

// Check key service files
const serviceFiles = [
  'src/services/indexeddb/database.ts',
  'src/services/indexeddb/testResults.ts',
  'src/services/indexeddb/resultSets.ts',
  'src/services/calculations/benchmarkScore.ts',
  'src/services/calculations/dataIngestionRate.ts'
];

serviceFiles.forEach(file => {
  check(
    path.basename(file),
    fs.existsSync(file),
    `${file} not found`
  );
});

// Check component files
const componentFiles = [
  'src/components/common/ErrorBoundary.tsx',
  'src/components/common/LoadingSpinner.tsx',
  'src/components/index/TestTable.tsx',
  'src/components/charts/ChartSection.tsx'
];

componentFiles.forEach(file => {
  check(
    path.basename(file),
    fs.existsSync(file),
    `${file} not found`
  );
});

// Check type definitions
const typeFiles = [
  'src/types/testResults.ts',
  'src/types/testConfig.ts',
  'src/types/database.ts',
  'src/types/css-modules.d.ts'
];

typeFiles.forEach(file => {
  check(
    path.basename(file),
    fs.existsSync(file),
    `${file} not found`
  );
});

// Check vite config
check(
  'Vite config exists',
  fs.existsSync('vite.config.ts'),
  'vite.config.ts not found'
);

if (fs.existsSync('vite.config.ts')) {
  const viteConfig = fs.readFileSync('vite.config.ts', 'utf-8');
  check(
    'Vite React plugin configured',
    viteConfig.includes('@vitejs/plugin-react'),
    'React plugin not configured in vite.config.ts'
  );
  check(
    'Vite root set to public',
    viteConfig.includes("root: 'public'"),
    'Root not set to public in vite.config.ts'
  );
}

// Check old vanilla JS files still exist (for comparison)
if (!fs.existsSync('public/index.html')) {
  warn('Old vanilla index.html', 'Original index.html not found - OK if intentionally removed');
}
if (!fs.existsSync('public/charts.html')) {
  warn('Old vanilla charts.html', 'Original charts.html not found - OK if intentionally removed');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${checks.passed.length}`);
console.log(`❌ Failed: ${checks.failed.length}`);
console.log(`⚠️  Warnings: ${checks.warnings.length}`);
console.log('='.repeat(50));

if (checks.failed.length > 0) {
  console.log('\n❌ Validation failed. Please fix the issues above.');
  process.exit(1);
} else {
  console.log('\n✅ Validation passed!');
  console.log('\nNext steps:');
  console.log('  1. Run `npm start` to start the dev server');
  console.log('  2. Visit http://localhost:5173/index-react.html');
  console.log('  3. Visit http://localhost:5173/charts-react.html');
  console.log('  4. Run tests with `npm test` (requires dev server running)');
  process.exit(0);
}
