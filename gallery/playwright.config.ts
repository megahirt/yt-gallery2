import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration for the gallery SvelteKit app.
 *
 * Tests mock the /videos.json fetch to avoid network dependencies.
 * Run with: npm run test:e2e
 */
export default defineConfig({
	testDir: './tests',

	// Run each test file in parallel; tests within a file run serially
	fullyParallel: false,

	// Fail the build on CI if test.only is accidentally left in
	forbidOnly: !!process.env.CI,

	// No retries — tests should be deterministic
	retries: 0,

	// Use a single worker in CI for stability; local runs can use more
	workers: process.env.CI ? 1 : undefined,

	reporter: [['list'], ['html', { open: 'never' }]],

	use: {
		baseURL: 'http://localhost:5173',

		// Collect traces on failure for debugging
		trace: 'on-first-retry',
	},

	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],

	// Start the SvelteKit dev server before running tests.
	// The dev server serves the app without building to static files,
	// which is intentional — we want fast test startup.
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:5173',
		// Reuse an already-running server for faster local development
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
	},
});
