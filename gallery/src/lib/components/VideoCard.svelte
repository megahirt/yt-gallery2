<script lang="ts">
	import type { Video } from '$lib/types';
	import { goto } from '$app/navigation';

	let {
		video,
		density = 'medium',
		onTagClick
	}: {
		video: Video;
		density?: 'large' | 'medium' | 'list';
		onTagClick?: (tag: string) => void;
	} = $props();

	const thumbnail = $derived(video.thumbnails.standard ?? video.thumbnails.high);

	const date = $derived(
		new Date(video.uploadDate).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		})
	);

	const viewCount = $derived(Number(video.viewCount).toLocaleString());
	const visibleTags = $derived(video.tags.slice(0, 3));
	const extraTagCount = $derived(Math.max(0, video.tags.length - 3));

	function navigate() {
		goto(`/video/${video.id}`);
	}

	function handleTagClick(e: MouseEvent, tag: string) {
		e.stopPropagation();
		onTagClick?.(tag);
	}
</script>

{#if density === 'list'}
	<!-- Horizontal list card -->
	<div
		role="button"
		tabindex="0"
		class="flex cursor-pointer gap-4 rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
		onclick={navigate}
		onkeydown={(e) => e.key === 'Enter' && navigate()}
	>
		{#if thumbnail}
			<div class="relative shrink-0">
				<img
					src={thumbnail.url}
					alt={video.title}
					class="h-24 w-40 rounded object-cover"
					loading="lazy"
				/>
				{#if video.duration}
					<span
						class="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-0.5 text-xs text-white"
					>{video.duration}</span>
				{/if}
			</div>
		{/if}
		<div class="min-w-0 flex-1 py-1">
			<h3 class="line-clamp-2 font-semibold text-gray-900">{video.title}</h3>
			<div class="mt-1 flex items-center gap-3 text-sm text-gray-500">
				<span>📅 {date}</span>
				<span>👁 {viewCount}</span>
			</div>
			{#if video.tags.length > 0}
				<div class="mt-2 flex flex-wrap gap-1">
					{#each visibleTags as tag (tag)}
						<button
							onclick={(e) => handleTagClick(e, tag)}
							class="rounded bg-sky-50 px-1.5 py-0.5 text-xs text-sky-700 hover:bg-sky-100"
						>
							#{tag}
						</button>
					{/each}
					{#if extraTagCount > 0}
						<span class="text-xs text-gray-400">+{extraTagCount}</span>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{:else}
	<!-- Grid card (large or medium) -->
	<div
		role="button"
		tabindex="0"
		class="cursor-pointer overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md"
		onclick={navigate}
		onkeydown={(e) => e.key === 'Enter' && navigate()}
	>
		{#if thumbnail}
			<div class="relative">
				<img
					src={thumbnail.url}
					alt={video.title}
					class="aspect-video w-full object-cover"
					loading="lazy"
				/>
				{#if video.duration}
					<span
						class="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-xs text-white"
					>{video.duration}</span>
				{/if}
			</div>
		{/if}
		<div class="space-y-1.5 p-3">
			<h3 class="line-clamp-2 text-sm font-semibold text-gray-900">{video.title}</h3>
			<div class="flex items-center gap-3 text-xs text-gray-500">
				<span>📅 {date}</span>
				<span>👁 {viewCount}</span>
			</div>
			{#if video.tags.length > 0}
				<div class="flex flex-wrap gap-1">
					{#each visibleTags as tag (tag)}
						<button
							onclick={(e) => handleTagClick(e, tag)}
							class="rounded bg-sky-50 px-1.5 py-0.5 text-xs text-sky-700 hover:bg-sky-100"
						>
							#{tag}
						</button>
					{/each}
					{#if extraTagCount > 0}
						<span class="text-xs text-gray-400">+{extraTagCount}</span>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
