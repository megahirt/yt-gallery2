<script lang="ts">
	import { getContext } from 'svelte';
	import { page } from '$app/state';
	import type { Video } from '$lib/types';

	type VideoStore = {
		videos: Video[];
		loading: boolean;
		error: string;
		load: () => Promise<void>;
	};

	const store = getContext<VideoStore>('videoStore');

	const videoId = $derived(page.params.id);

	const video = $derived(store.videos.find((v) => v.id === videoId) ?? null);

	const thumbnail = $derived(video ? (video.thumbnails.standard ?? video.thumbnails.high) : null);

	const uploadDate = $derived(
		video
			? new Date(video.uploadDate).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})
			: ''
	);

	const videoDateFormatted = $derived(
		video?.videoDate
			? new Date(video.videoDate).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})
			: null
	);

	const viewCount = $derived(video ? Number(video.viewCount).toLocaleString() : '');

	let playing = $state(false);
</script>

<svelte:head>
	<title>{video?.title ?? 'Video'} — Hirt Family Gallery</title>
</svelte:head>

<div class="min-h-screen bg-gray-100">
	<!-- Top bar -->
	<div class="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3">
		<div class="mx-auto flex max-w-4xl items-center justify-between">
			<a
				href="/"
				class="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-sky-600"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				Back to Gallery
			</a>
			{#if video}
				<a
					href="https://www.youtube.com/watch?v={video.id}"
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
				>
					<svg class="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
						/>
					</svg>
					Watch on YouTube
				</a>
			{/if}
		</div>
	</div>

	<!-- Content -->
	<div class="mx-auto max-w-4xl px-4 py-6">
		{#if store.loading}
			<p class="text-center text-gray-500">Loading...</p>
		{:else if !video}
			<p class="text-center text-gray-500">Video not found.</p>
		{:else}
			<!-- Video player -->
			<div class="overflow-hidden rounded-xl bg-black shadow-lg">
				{#if playing}
					<iframe
						src="https://www.youtube.com/embed/{video.id}?autoplay=1"
						title={video.title}
						class="aspect-video w-full"
						allow="autoplay; fullscreen; picture-in-picture"
						allowfullscreen
					></iframe>
				{:else}
					<button
						onclick={() => (playing = true)}
						class="group relative block w-full"
						aria-label="Play {video.title}"
					>
						{#if thumbnail}
							<img
								src={thumbnail.url}
								alt={video.title}
								class="aspect-video w-full object-cover"
							/>
						{:else}
							<div class="aspect-video w-full bg-gray-800"></div>
						{/if}
						<!-- Play overlay -->
						<div
							class="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30"
						>
							<div
								class="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-105"
							>
								<svg
									class="ml-1 h-7 w-7 text-gray-800"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path d="M8 5v14l11-7z" />
								</svg>
							</div>
						</div>
					</button>
				{/if}
			</div>

			<!-- Metadata -->
			<div class="mt-4 rounded-xl bg-white p-6 shadow-sm">
				<h1 class="text-2xl font-bold text-gray-900">{video.title}</h1>

				<div class="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-500">
					<span>📅 Uploaded: {uploadDate}</span>
					{#if videoDateFormatted}
						<span>🕐 Filmed: {videoDateFormatted}</span>
					{/if}
					<span>👁 {viewCount} views</span>
				</div>

				<!-- Collections + tags -->
				{#if video.playlists.length > 0 || video.tags.length > 0}
					<div class="mt-4 flex flex-wrap gap-2">
						{#each video.playlists as playlist (playlist.id)}
							<span
								class="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700"
							>
								{playlist.title}
							</span>
						{/each}
						{#each video.tags as tag (tag)}
							<span class="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
								#{tag}
							</span>
						{/each}
					</div>
				{/if}

				<!-- Description -->
				{#if video.description}
					<div class="mt-5 border-t border-gray-100 pt-4">
						<h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
							Description
						</h2>
						<p class="whitespace-pre-wrap text-sm text-gray-700">{video.description}</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
