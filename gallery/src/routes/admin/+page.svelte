<script lang="ts">
	import type { Video } from '$lib/types';
	import { base } from '$app/paths';

	let videos: Video[] = $state([]);
	let loading = $state(true);
	let error = $state('');

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
	<title>Admin - Family Videos</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Admin</h1>
		<a
			href="https://github.com/megahirt/yt-gallery2/actions/workflows/fetch-videos.yml"
			target="_blank"
			rel="noopener noreferrer"
			class="btn preset-filled-primary-500"
		>
			Refresh Video Data
		</a>
	</div>

	{#if loading}
		<p class="text-surface-600-400">Loading...</p>
	{:else if error}
		<p class="text-error-500">{error}</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead class="border-b border-surface-300-700 text-surface-600-400">
					<tr>
						<th class="px-3 py-2">Thumbnail</th>
						<th class="px-3 py-2">Title</th>
						<th class="px-3 py-2">Date</th>
						<th class="px-3 py-2">Status</th>
						<th class="px-3 py-2">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each videos as video (video.id)}
						<tr class="border-b border-surface-200-800">
							<td class="px-3 py-2">
								{#if video.thumbnails.high}
									<img
										src={video.thumbnails.high.url}
										alt={video.title}
										class="h-12 w-20 rounded object-cover"
										loading="lazy"
									/>
								{/if}
							</td>
							<td class="px-3 py-2 font-medium">{video.title}</td>
							<td class="whitespace-nowrap px-3 py-2 text-surface-600-400">
								{new Date(video.uploadDate).toLocaleDateString()}
							</td>
							<td class="px-3 py-2">
								<span
									class="rounded px-2 py-0.5 text-xs {video.privacyStatus === 'unlisted'
										? 'preset-tonal-warning'
										: 'preset-tonal-success'}"
								>
									{video.privacyStatus}
								</span>
							</td>
							<td class="px-3 py-2">
								<a
									href="https://studio.youtube.com/video/{video.id}/edit"
									target="_blank"
									rel="noopener noreferrer"
									class="btn btn-sm preset-tonal-primary"
								>
									Edit in Studio
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
