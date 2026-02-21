/**
 * Sample video data used in Playwright E2E tests.
 * Mirrors the shape of videos.json produced by make_simple_video_list.py.
 */
export const sampleVideos = [
	{
		id: 'vacationVid1',
		url: 'https://www.youtube.com/watch?v=vacationVid1',
		title: 'Family Vacation 2023',
		description: 'Our summer trip to the beach. Fun in the sun!',
		uploadDate: '2023-07-15T12:00:00Z',
		tags: ['vacation', 'beach', 'summer'],
		privacyStatus: 'public',
		thumbnails: {
			high: {
				url: 'https://i.ytimg.com/vi/vacationVid1/hqdefault.jpg',
				width: 480,
				height: 360,
			},
			standard: {
				url: 'https://i.ytimg.com/vi/vacationVid1/sddefault.jpg',
				width: 640,
				height: 480,
			},
		},
		channelId: 'UCchannel123',
		categoryId: '22',
		viewCount: '42',
		playlists: [{ id: 'PLvacations', title: 'Vacations' }],
	},
	{
		id: 'birthdayVid2',
		url: 'https://www.youtube.com/watch?v=birthdayVid2',
		title: "Grandma's Birthday Party",
		description: "Celebrating grandma turning 80. A wonderful day with family.",
		uploadDate: '2023-09-20T15:30:00Z',
		tags: ['birthday', 'party', 'grandma'],
		privacyStatus: 'unlisted',
		thumbnails: {
			high: {
				url: 'https://i.ytimg.com/vi/birthdayVid2/hqdefault.jpg',
				width: 480,
				height: 360,
			},
			standard: null,
		},
		channelId: 'UCchannel123',
		categoryId: '22',
		viewCount: '18',
		playlists: [
			{ id: 'PLbirthdays', title: 'Birthdays' },
			{ id: 'PLvacations', title: 'Vacations' },
		],
	},
	{
		id: 'christmasVid3',
		url: 'https://www.youtube.com/watch?v=christmasVid3',
		title: 'Christmas Morning',
		description: 'Opening presents on Christmas morning.',
		uploadDate: '2023-12-25T08:00:00Z',
		tags: ['christmas', 'holidays', 'presents'],
		privacyStatus: 'public',
		thumbnails: {
			high: {
				url: 'https://i.ytimg.com/vi/christmasVid3/hqdefault.jpg',
				width: 480,
				height: 360,
			},
			standard: {
				url: 'https://i.ytimg.com/vi/christmasVid3/sddefault.jpg',
				width: 640,
				height: 480,
			},
		},
		channelId: 'UCchannel123',
		categoryId: '22',
		viewCount: '156',
		playlists: [],
	},
] as const;

export type SampleVideo = (typeof sampleVideos)[number];
