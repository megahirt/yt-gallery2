<script lang="ts">
	import type { Video, PlaylistRef } from '$lib/types';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import PlaylistFilter from '$lib/components/PlaylistFilter.svelte';
	import VideoCard from '$lib/components/VideoCard.svelte';
	import { base } from '$app/paths';

	let videos: Video[] = $state([]);
	let loading = $state(true);
	let error = $state('');
	let searchQuery = $state('');
	let selectedPlaylist: string | null = $state(null);

	const playlists = $derived(() => {
		const map = new Map<string, PlaylistRef>();
		for (const video of videos) {
			for (const p of video.playlists) {
				if (!map.has(p.id)) map.set(p.id, p);
			}
		}
		return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
	});

	const filteredVideos = $derived(() => {
		let result = videos;

		if (selectedPlaylist) {
			result = result.filter((v) => v.playlists.some((p) => p.id === selectedPlaylist));
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(v) =>
					v.title.toLowerCase().includes(q) ||
					v.description.toLowerCase().includes(q) ||
					v.tags.some((t) => t.toLowerCase().includes(q)) ||
					v.playlists.some((p) => p.title.toLowerCase().includes(q))
			);
		}

		return result;
	});

	async function loadVideos() {
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

	$effect(() => {
		loadVideos();
	});
</script>

<svelte:head>
	<title>Family Videos</title>
</svelte:head>

<div class="space-y-4">
	<SearchBar bind:value={searchQuery} />

	{#if playlists().length > 0}
		<PlaylistFilter playlists={playlists()} bind:selected={selectedPlaylist} />
	{/if}

	{#if loading}
		<p class="text-center text-surface-600-400">Loading videos...</p>
	{:else if error}
		<p class="text-center text-error-500">{error}</p>
	{:else if filteredVideos().length === 0}
		<p class="text-center text-surface-600-400">No videos found.</p>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			{#each filteredVideos() as video (video.id)}
				<VideoCard {video} />
			{/each}
		</div>
	{/if}
</div>
