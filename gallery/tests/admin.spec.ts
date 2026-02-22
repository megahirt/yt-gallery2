import { test, expect, type Page } from '@playwright/test';
import { sampleVideos } from './fixtures/sample-videos.js';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

async function mockVideos(page: Page, videos: ReadonlyArray<object> = sampleVideos) {
	await page.route('**/videos.json', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(videos),
		});
	});
}

async function mockVideosError(page: Page, status = 500) {
	await page.route('**/videos.json', async (route) => {
		await route.fulfill({ status, body: 'Internal Server Error' });
	});
}

// ---------------------------------------------------------------------------
// Admin page — structure & navigation
// ---------------------------------------------------------------------------

test.describe('Admin page — layout and navigation', () => {
	test.beforeEach(async ({ page }) => {
		await mockVideos(page);
		await page.goto('/admin');
	});

	test('renders the browser tab title', async ({ page }) => {
		await expect(page).toHaveTitle('Admin - Family Videos');
	});

	test('shows the Admin heading', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible();
	});

	test('shows "Refresh Video Data" button linking to GitHub Actions', async ({ page }) => {
		const refreshLink = page.getByRole('link', { name: 'Refresh Video Data' });
		await expect(refreshLink).toBeVisible();

		const href = await refreshLink.getAttribute('href');
		expect(href).toContain('github.com');
		expect(href).toContain('fetch-videos.yml');
	});

	test('"Refresh Video Data" link opens in a new tab', async ({ page }) => {
		const refreshLink = page.getByRole('link', { name: 'Refresh Video Data' });
		await expect(refreshLink).toHaveAttribute('target', '_blank');
	});
});

// ---------------------------------------------------------------------------
// Admin page — video table
// ---------------------------------------------------------------------------

test.describe('Admin page — video table', () => {
	test.beforeEach(async ({ page }) => {
		await mockVideos(page);
		await page.goto('/admin');
	});

	test('renders a table with rows for each video', async ({ page }) => {
		const rows = page.locator('tbody tr');
		await expect(rows).toHaveCount(sampleVideos.length);
	});

	test('table has the expected column headers', async ({ page }) => {
		// Use locator('th') since <th> implicit ARIA role varies by browser context
		for (const header of ['Thumbnail', 'Title', 'Date', 'Status', 'Actions']) {
			await expect(page.locator('thead th', { hasText: header })).toBeVisible();
		}
	});

	test('shows video titles in the table', async ({ page }) => {
		for (const video of sampleVideos) {
			await expect(page.getByText(video.title)).toBeVisible();
		}
	});

	test('shows privacy status badges for each video', async ({ page }) => {
		// The two statuses in our fixture are "public" and "unlisted"
		const publicBadges = page.getByText('public');
		const unlistedBadges = page.getByText('unlisted');

		await expect(publicBadges.first()).toBeVisible();
		await expect(unlistedBadges.first()).toBeVisible();
	});

	test('shows "Edit in Studio" links for each video', async ({ page }) => {
		const studioLinks = page.getByRole('link', { name: 'Edit in Studio' });
		await expect(studioLinks).toHaveCount(sampleVideos.length);
	});

	test('"Edit in Studio" links point to YouTube Studio with correct video ID', async ({
		page,
	}) => {
		const studioLinks = page.getByRole('link', { name: 'Edit in Studio' });
		const count = await studioLinks.count();

		for (let i = 0; i < count; i++) {
			const href = await studioLinks.nth(i).getAttribute('href');
			expect(href).toContain('studio.youtube.com/video/');
			// Verify the URL contains one of our known video IDs
			const hasKnownId = sampleVideos.some((v) => href?.includes(v.id));
			expect(hasKnownId).toBe(true);
		}
	});

	test('"Edit in Studio" links open in a new tab', async ({ page }) => {
		const firstStudioLink = page.getByRole('link', { name: 'Edit in Studio' }).first();
		await expect(firstStudioLink).toHaveAttribute('target', '_blank');
	});

	test('shows thumbnail images in the table', async ({ page }) => {
		// At least one thumbnail image should be present
		const thumbnails = page.locator('tbody img');
		await expect(thumbnails.first()).toBeVisible();
	});

	test('upload date is displayed for each video', async ({ page }) => {
		// Dates are rendered with toLocaleDateString() — just check the column cells exist
		const dateCells = page.locator('tbody tr td:nth-child(3)');
		await expect(dateCells).toHaveCount(sampleVideos.length);
		for (let i = 0; i < sampleVideos.length; i++) {
			const text = await dateCells.nth(i).textContent();
			expect(text?.trim().length).toBeGreaterThan(0);
		}
	});
});

// ---------------------------------------------------------------------------
// Admin page — error and empty states
// ---------------------------------------------------------------------------

test.describe('Admin page — error state', () => {
	test('shows error message when videos.json fails', async ({ page }) => {
		await mockVideosError(page);
		await page.goto('/admin');

		await expect(page.getByText(/Failed to fetch videos/)).toBeVisible();
	});

	test('does not show the table when loading fails', async ({ page }) => {
		await mockVideosError(page);
		await page.goto('/admin');

		await expect(page.locator('table')).not.toBeVisible();
	});
});

test.describe('Admin page — empty video list', () => {
	test('shows an empty table body when there are no videos', async ({ page }) => {
		await mockVideos(page, []);
		await page.goto('/admin');

		// Table should be present but have no rows
		const rows = page.locator('tbody tr');
		await expect(rows).toHaveCount(0);
	});
});
