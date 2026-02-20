<script lang="ts">
	import type { Video } from '$lib/types';

	let { video }: { video: Video } = $props();

	const date = $derived(
		new Date(video.uploadDate).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	);

	const thumbnail = $derived(video.thumbnails.standard ?? video.thumbnails.high);
</script>

<a
	href={video.url}
	target="_blank"
	rel="noopener noreferrer"
	class="card card-hover preset-outlined-surface-100-900 block overflow-hidden"
>
	{#if thumbnail}
		<img
			src={thumbnail.url}
			alt={video.title}
			width={thumbnail.width}
			height={thumbnail.height}
			class="aspect-video w-full object-cover"
			loading="lazy"
		/>
	{/if}
	<div class="space-y-2 p-3">
		<h3 class="line-clamp-2 font-semibold">{video.title}</h3>
		<p class="text-sm text-surface-600-400">{date}</p>
		{#if video.playlists.length > 0}
			<div class="flex flex-wrap gap-1">
				{#each video.playlists as playlist}
					<span class="preset-tonal-primary rounded px-2 py-0.5 text-xs">
						{playlist.title}
					</span>
				{/each}
			</div>
		{/if}
	</div>
</a>
