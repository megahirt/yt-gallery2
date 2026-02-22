import type { Video } from '$lib/types';
import { base } from '$app/paths';

function createVideoStore() {
	let videos = $state<Video[]>([]);
	let loading = $state(true);
	let error = $state('');

	async function load() {
		if (!loading && videos.length > 0) return;
		try {
			const res = await fetch(`${base}/videos.json`, { cache: 'no-store' });
			if (!res.ok) throw new Error(`Failed to fetch videos: ${res.status}`);
			videos = await res.json();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load videos';
		} finally {
			loading = false;
		}
	}

	return {
		get videos() {
			return videos;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		load
	};
}

export const videoStore = createVideoStore();
