export interface Thumbnail {
	url: string;
	width: number;
	height: number;
}

export interface PlaylistRef {
	id: string;
	title: string;
}

export interface Video {
	id: string;
	url: string;
	title: string;
	description: string;
	uploadDate: string;
	tags: string[];
	privacyStatus: string;
	thumbnails: {
		high: Thumbnail | null;
		standard: Thumbnail | null;
	};
	channelId: string;
	categoryId: string | null;
	viewCount: string;
	playlists: PlaylistRef[];
}
