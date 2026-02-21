import { test, expect, type Page } from '@playwright/test';
import { sampleVideos } from './fixtures/sample-videos.js';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Intercept the /videos.json request and respond with the provided data.
 * Must be called before page.goto().
 */
async function mockVideos(page: Page, videos: typeof sampleVideos = sampleVideos) {
	await page.route('**/videos.json', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(videos),
		});
	});
}

/**
 * Intercept /videos.json and respond with a server error.
 */
async function mockVideosError(page: Page, status = 500) {
	await page.route('**/videos.json', async (route) => {
		await route.fulfill({ status, body: 'Internal Server Error' });
	});
}

// ---------------------------------------------------------------------------
// Page load & video display
// ---------------------------------------------------------------------------

test.describe('Gallery page — video display', () => {
	test('renders the page title in the browser tab', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');
		await expect(page).toHaveTitle('Family Videos');
	});

	test('shows the site name in the navigation bar', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');
		await expect(page.getByRole('link', { name: 'Family Videos' })).toBeVisible();
	});

	test('shows an Admin link in the navigation bar', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');
		await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
	});

	test('displays a video card for each video', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');

		// Wait for the grid to appear
		const cards = page.locator('.grid a');
		await expect(cards).toHaveCount(sampleVideos.length);
	});

	test('shows video titles in the cards', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');

		for (const video of sampleVideos) {
			await expect(page.getByText(video.title).first()).toBeVisible();
		}
	});

	test('video cards link to youtube.com', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');

		const firstCard = page.locator('.grid a').first();
		const href = await firstCard.getAttribute('href');
		expect(href).toContain('youtube.com/watch?v=');
	});

	test('video card opens in a new tab (target=_blank)', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');

		const firstCard = page.locator('.grid a').first();
		await expect(firstCard).toHaveAttribute('target', '_blank');
	});

	test('video card has rel=noopener noreferrer for security', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');

		const firstCard = page.locator('.grid a').first();
		const rel = await firstCard.getAttribute('rel');
		expect(rel).toContain('noopener');
		expect(rel).toContain('noreferrer');
	});

	test('shows playlist tags on video cards when video is in a playlist', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');

		// "Family Vacation 2023" is in the "Vacations" playlist
		const vacationCard = page.locator('.grid a', { hasText: 'Family Vacation 2023' });
		await expect(vacationCard.getByText('Vacations')).toBeVisible();
	});

	test('shows multiple playlist tags when video is in multiple playlists', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');

		// "Grandma's Birthday Party" is in both "Birthdays" and "Vacations"
		const birthdayCard = page.locator('.grid a', { hasText: "Grandma's Birthday Party" });
		await expect(birthdayCard.getByText('Birthdays')).toBeVisible();
		await expect(birthdayCard.getByText('Vacations')).toBeVisible();
	});

	test('does not show playlist section on cards with no playlists', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');

		// "Christmas Morning" has no playlists — its card should have no tag spans
		const christmasCard = page.locator('.grid a', { hasText: 'Christmas Morning' });
		// The playlist tags container uses specific classes — check it's absent
		await expect(christmasCard.locator('.flex.flex-wrap.gap-1')).not.toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Search filtering
// ---------------------------------------------------------------------------

test.describe('Gallery page — search', () => {
	test.beforeEach(async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');
	});

	test('search box is visible with placeholder text', async ({ page }) => {
		await expect(page.getByPlaceholder('Search videos...')).toBeVisible();
	});

	test('filters videos by title', async ({ page }) => {
		await page.getByPlaceholder('Search videos...').fill('vacation');
		await expect(page.getByText('Family Vacation 2023')).toBeVisible();
		await expect(page.getByText('Christmas Morning')).not.toBeVisible();
	});

	test('filters videos by description', async ({ page }) => {
		await page.getByPlaceholder('Search videos...').fill('Opening presents');
		await expect(page.getByText('Christmas Morning')).toBeVisible();
		await expect(page.getByText('Family Vacation 2023')).not.toBeVisible();
	});

	test('filters videos by tag', async ({ page }) => {
		await page.getByPlaceholder('Search videos...').fill('holidays');
		await expect(page.getByText('Christmas Morning')).toBeVisible();
		await expect(page.getByText('Family Vacation 2023')).not.toBeVisible();
	});

	test('filters videos by playlist name', async ({ page }) => {
		// "Birthdays" playlist only contains "Grandma's Birthday Party"
		await page.getByPlaceholder('Search videos...').fill('Birthdays');
		await expect(page.getByText("Grandma's Birthday Party")).toBeVisible();
		await expect(page.getByText('Family Vacation 2023')).not.toBeVisible();
	});

	test('search is case-insensitive', async ({ page }) => {
		await page.getByPlaceholder('Search videos...').fill('CHRISTMAS');
		await expect(page.getByText('Christmas Morning')).toBeVisible();
	});

	test('shows "No videos found" message when no results match', async ({ page }) => {
		await page.getByPlaceholder('Search videos...').fill('xyzzy_nonexistent_query');
		await expect(page.getByText('No videos found.')).toBeVisible();
	});

	test('clears filter when search box is emptied', async ({ page }) => {
		const searchBox = page.getByPlaceholder('Search videos...');
		await searchBox.fill('vacation');
		await expect(page.locator('.grid a')).toHaveCount(2); // vacation appears in 2 videos

		await searchBox.fill('');
		await expect(page.locator('.grid a')).toHaveCount(sampleVideos.length);
	});
});

// ---------------------------------------------------------------------------
// Playlist filter buttons
// ---------------------------------------------------------------------------

test.describe('Gallery page — playlist filter', () => {
	test.beforeEach(async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');
	});

	test('shows playlist filter buttons for each unique playlist', async ({ page }) => {
		// Sample data has 2 unique playlists: Birthdays, Vacations (sorted)
		await expect(page.getByRole('button', { name: 'Birthdays' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Vacations' })).toBeVisible();
	});

	test('shows "All" button in playlist filter', async ({ page }) => {
		await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
	});

	test('clicking a playlist button filters to only that playlist\'s videos', async ({
		page,
	}) => {
		await page.getByRole('button', { name: 'Birthdays' }).click();

		// Only "Grandma's Birthday Party" is in Birthdays
		const cards = page.locator('.grid a');
		await expect(cards).toHaveCount(1);
		await expect(cards.first()).toContainText("Grandma's Birthday Party");
	});

	test('Vacations playlist contains both vacation and birthday videos', async ({ page }) => {
		await page.getByRole('button', { name: 'Vacations' }).click();

		// Both "Family Vacation 2023" and "Grandma's Birthday Party" are in Vacations
		const cards = page.locator('.grid a');
		await expect(cards).toHaveCount(2);
	});

	test('clicking the "All" button clears the playlist filter', async ({ page }) => {
		// First select a filter
		await page.getByRole('button', { name: 'Birthdays' }).click();
		await expect(page.locator('.grid a')).toHaveCount(1);

		// Then click All to reset
		await page.getByRole('button', { name: 'All' }).click();
		await expect(page.locator('.grid a')).toHaveCount(sampleVideos.length);
	});

	test('clicking an active playlist filter again deselects it', async ({ page }) => {
		// Select Birthdays
		await page.getByRole('button', { name: 'Birthdays' }).click();
		await expect(page.locator('.grid a')).toHaveCount(1);

		// Click it again to deselect (toggle behavior)
		await page.getByRole('button', { name: 'Birthdays' }).click();
		await expect(page.locator('.grid a')).toHaveCount(sampleVideos.length);
	});

	test('playlist filter and search can be combined', async ({ page }) => {
		// Filter to Vacations (2 videos), then search for "Christmas"
		await page.getByRole('button', { name: 'Vacations' }).click();
		await page.getByPlaceholder('Search videos...').fill('beach');

		// Only "Family Vacation 2023" has "beach" in its description/tags
		const cards = page.locator('.grid a');
		await expect(cards).toHaveCount(1);
		await expect(cards.first()).toContainText('Family Vacation 2023');
	});
});

// ---------------------------------------------------------------------------
// Playlist filter visibility
// ---------------------------------------------------------------------------

test.describe('Gallery page — playlist filter visibility', () => {
	test('playlist filter is not shown when no videos have playlists', async ({ page }) => {
		const videosWithoutPlaylists = sampleVideos.map((v) => ({ ...v, playlists: [] }));
		await mockVideos(page, videosWithoutPlaylists as typeof sampleVideos);
		await page.goto('/');

		// No playlist buttons should appear (not even "All")
		await expect(page.getByRole('button', { name: 'All' })).not.toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Empty and error states
// ---------------------------------------------------------------------------

test.describe('Gallery page — empty and error states', () => {
	test('shows error message when videos.json returns a server error', async ({ page }) => {
		await mockVideosError(page, 500);
		await page.goto('/');

		// The app renders the error text
		await expect(page.getByText(/Failed to fetch videos/)).toBeVisible();
	});

	test('shows "No videos found" when videos.json returns an empty array', async ({ page }) => {
		await mockVideos(page, []);
		await page.goto('/');

		await expect(page.getByText('No videos found.')).toBeVisible();
	});

	test('does not show the video grid when there are no videos', async ({ page }) => {
		await mockVideos(page, []);
		await page.goto('/');

		await expect(page.locator('.grid')).not.toBeVisible();
	});
});
