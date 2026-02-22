import { test, expect, type Page } from '@playwright/test';
import { sampleVideos } from './fixtures/sample-videos.js';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Intercept the /videos.json request and respond with the provided data.
 * Must be called before page.goto().
 */
async function mockVideos(page: Page, videos: ReadonlyArray<object> = sampleVideos) {
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
		await expect(page).toHaveTitle('Hirt Family Gallery');
	});

	test('shows the site name in the sidebar', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');
		await expect(page.getByText('Hirt Family Gallery')).toBeVisible();
	});

	test('displays a video card for each video', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');

		// Cards are div[role="button"] elements inside the grid
		const cards = page.locator('.grid [role="button"]');
		await expect(cards).toHaveCount(sampleVideos.length);
	});

	test('shows video titles in the cards', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');

		for (const video of sampleVideos) {
			await expect(page.getByText(video.title).first()).toBeVisible();
		}
	});

	test('clicking a video card navigates to the detail page', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');

		const firstCard = page.locator('.grid [role="button"]').first();
		await firstCard.click();

		// Should navigate to /video/[id]
		await expect(page).toHaveURL(/\/video\//);
	});

	test('shows tag chips on video cards that have tags', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');

		// "Family Vacation 2023" has tags: vacation, beach, summer
		const vacationCard = page.locator('.grid [role="button"]', { hasText: 'Family Vacation 2023' });
		await expect(vacationCard.getByText('#vacation')).toBeVisible();
	});

	test('shows view count on video cards', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');

		// vacationVid1 has viewCount: "42"
		const vacationCard = page.locator('.grid [role="button"]', { hasText: 'Family Vacation 2023' });
		await expect(vacationCard.getByText('👁 42')).toBeVisible();
	});

	test('does not show tag chips on cards with no tags', async ({ page }) => {
		// Mock a video with no tags
		const videosNoTags = sampleVideos.map((v) =>
			v.id === 'christmasVid3' ? { ...v, tags: [] } : v
		) as object[];
		await mockVideos(page, videosNoTags);
		await page.goto('/');

		const christmasCard = page.locator('.grid [role="button"]', { hasText: 'Christmas Morning' });
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
		await expect(page.locator('.grid [role="button"]')).toHaveCount(2); // "vacation" matches 2 videos

		await searchBox.fill('');
		await expect(page.locator('.grid [role="button"]')).toHaveCount(sampleVideos.length);
	});
});

// ---------------------------------------------------------------------------
// Sidebar collection filter
// ---------------------------------------------------------------------------

test.describe('Gallery page — collection filter', () => {
	test.beforeEach(async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');
	});

	test('shows collection buttons in sidebar for each unique playlist', async ({ page }) => {
		// Sample data has 2 unique playlists: Birthdays, Vacations (sorted)
		await expect(page.getByRole('button', { name: 'Birthdays' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Vacations' })).toBeVisible();
	});

	test('shows "All Videos" button in sidebar', async ({ page }) => {
		await expect(page.getByRole('button', { name: 'All Videos' })).toBeVisible();
	});

	test('clicking a collection button filters to only that collection\'s videos', async ({
		page,
	}) => {
		await page.getByRole('button', { name: 'Birthdays' }).click();

		// Only "Grandma's Birthday Party" is in Birthdays
		const cards = page.locator('.grid [role="button"]');
		await expect(cards).toHaveCount(1);
		await expect(cards.first()).toContainText("Grandma's Birthday Party");
	});

	test('Vacations collection contains both vacation and birthday videos', async ({ page }) => {
		await page.getByRole('button', { name: 'Vacations' }).click();

		// Both "Family Vacation 2023" and "Grandma's Birthday Party" are in Vacations
		const cards = page.locator('.grid [role="button"]');
		await expect(cards).toHaveCount(2);
	});

	test('clicking "All Videos" clears the collection filter', async ({ page }) => {
		// First select a filter
		await page.getByRole('button', { name: 'Birthdays' }).click();
		await expect(page.locator('.grid [role="button"]')).toHaveCount(1);

		// Then click All Videos to reset
		await page.getByRole('button', { name: 'All Videos' }).click();
		await expect(page.locator('.grid [role="button"]')).toHaveCount(sampleVideos.length);
	});

	test('collection filter and search can be combined', async ({ page }) => {
		// Filter to Vacations (2 videos), then search for "beach"
		await page.getByRole('button', { name: 'Vacations' }).click();
		await page.getByPlaceholder('Search videos...').fill('beach');

		// Only "Family Vacation 2023" has "beach" in its description/tags
		const cards = page.locator('.grid [role="button"]');
		await expect(cards).toHaveCount(1);
		await expect(cards.first()).toContainText('Family Vacation 2023');
	});
});

// ---------------------------------------------------------------------------
// Sidebar collection visibility
// ---------------------------------------------------------------------------

test.describe('Gallery page — collection filter visibility', () => {
	test('collection buttons are not shown when no videos have playlists', async ({ page }) => {
		const videosWithoutPlaylists: object[] = sampleVideos.map((v) => ({ ...v, playlists: [] }));
		await mockVideos(page, videosWithoutPlaylists);
		await page.goto('/');

		// Individual collection buttons should not appear (Birthdays, Vacations)
		await expect(page.getByRole('button', { name: 'Birthdays' })).not.toBeVisible();
		await expect(page.getByRole('button', { name: 'Vacations' })).not.toBeVisible();
		// "All Videos" is always visible
		await expect(page.getByRole('button', { name: 'All Videos' })).toBeVisible();
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

		await expect(page.locator('.grid [role="button"]')).toHaveCount(0);
	});
});

// ---------------------------------------------------------------------------
// Grid density toggle
// ---------------------------------------------------------------------------

test.describe('Gallery page — grid density toggle', () => {
	test('density toggle buttons are visible', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');

		await expect(page.getByTitle('Large grid')).toBeVisible();
		await expect(page.getByTitle('Medium grid')).toBeVisible();
		await expect(page.getByTitle('List view')).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Video detail page
// ---------------------------------------------------------------------------

test.describe('Video detail page', () => {
	test('navigating to /video/[id] shows the video title', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/');
		await page.goto('/video/vacationVid1');

		await expect(page.getByText('Family Vacation 2023')).toBeVisible();
	});

	test('shows a "Back to Gallery" link on the detail page', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/video/vacationVid1');

		await expect(page.getByRole('link', { name: /Back to Gallery/ })).toBeVisible();
	});

	test('shows a play button to load the YouTube embed', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/video/vacationVid1');

		// The thumbnail area has an aria-label for the play button
		await expect(page.getByRole('button', { name: /Play/ })).toBeVisible();
	});

	test('shows "Watch on YouTube" link on detail page', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/video/vacationVid1');

		const ytLink = page.getByRole('link', { name: /Watch on YouTube/ });
		await expect(ytLink).toBeVisible();
		const href = await ytLink.getAttribute('href');
		expect(href).toContain('youtube.com/watch?v=vacationVid1');
	});

	test('shows "Video not found" for unknown video ID', async ({ page }) => {
		await mockVideos(page);
		await page.goto('/video/nonexistent-id');

		await expect(page.getByText('Video not found.')).toBeVisible();
	});
});
