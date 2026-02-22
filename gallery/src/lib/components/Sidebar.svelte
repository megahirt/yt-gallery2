<script lang="ts">
	import type { PlaylistRef } from '$lib/types';
	import { SITE_NAME } from '$lib/config';

	let {
		collections,
		selectedCollection = $bindable<string | null>(null),
		sortBy = $bindable<'videoDate' | 'uploadDate' | 'title'>('videoDate'),
		videoCounts,
		totalCount
	}: {
		collections: PlaylistRef[];
		selectedCollection: string | null;
		sortBy: 'videoDate' | 'uploadDate' | 'title';
		videoCounts: Map<string, number>;
		totalCount: number;
	} = $props();
</script>

<aside class="flex h-full w-60 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white">
	<!-- Logo row -->
	<div class="flex items-center gap-2 border-b border-gray-200 px-4 py-4">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5 text-sky-600"
			viewBox="0 0 20 20"
			fill="currentColor"
		>
			<path
				d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
			/>
		</svg>
		<span class="text-sm font-semibold text-gray-900">{SITE_NAME}</span>
	</div>

	<!-- Sort By -->
	<div class="px-4 py-3">
		<p class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Sort By</p>
		<select
			bind:value={sortBy}
			class="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
		>
			<option value="videoDate">Video Date</option>
			<option value="uploadDate">Upload Date</option>
			<option value="title">Title</option>
		</select>
	</div>

	<!-- Collections -->
	<div class="px-4 py-3">
		<p class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Collections</p>
		<nav class="space-y-0.5">
			<!-- All Videos -->
			<button
				onclick={() => (selectedCollection = null)}
				class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm {selectedCollection ===
				null
					? 'bg-sky-50 font-medium text-sky-700'
					: 'text-gray-700 hover:bg-gray-50'}"
			>
				<span class="flex items-center gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
						/>
					</svg>
					All Videos
				</span>
				<span class="text-xs text-gray-400">{totalCount}</span>
			</button>

			{#each collections as collection (collection.id)}
				<button
					onclick={() => (selectedCollection = collection.title)}
					class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm {selectedCollection ===
					collection.title
						? 'bg-sky-50 font-medium text-sky-700'
						: 'text-gray-700 hover:bg-gray-50'}"
				>
					<span class="truncate">{collection.title}</span>
					<span class="ml-2 shrink-0 text-xs text-gray-400"
						>{videoCounts.get(collection.title) ?? 0}</span
					>
				</button>
			{/each}
		</nav>
	</div>

	<!-- People -->
	<div class="border-t border-gray-100 px-4 py-3">
		<p class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">People</p>
		<p class="text-xs text-gray-400">Coming soon</p>
	</div>

	<!-- Places -->
	<div class="border-t border-gray-100 px-4 py-3">
		<p class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Places</p>
		<p class="text-xs text-gray-400">Coming soon</p>
	</div>
</aside>
