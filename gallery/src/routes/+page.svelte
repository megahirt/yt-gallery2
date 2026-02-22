<script lang="ts">
	import { getContext } from 'svelte';
	import type { Video, PlaylistRef } from '$lib/types';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import HeroBanner from '$lib/components/HeroBanner.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import VideoCard from '$lib/components/VideoCard.svelte';

	type VideoStore = {
		videos: Video[];
		loading: boolean;
		error: string;
		load: () => Promise<void>;
	};

	const store = getContext<VideoStore>('videoStore');

	let searchQuery = $state('');
	let selectedCollection = $state<string | null>(null);
	let sortBy = $state<'videoDate' | 'uploadDate' | 'title'>('videoDate');
	let density = $state<'large' | 'medium' | 'list'>('medium');
	let sidebarOpen = $state(false);

	// Derived: unique collections from all videos
	const collections = $derived.by<PlaylistRef[]>(() => {
		const map = new Map<string, PlaylistRef>();
		for (const video of store.videos) {
			for (const p of video.playlists) {
				if (!map.has(p.id)) map.set(p.id, p);
			}
		}
		return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
	});

	// Derived: count per collection title
	const videoCounts = $derived.by<Map<string, number>>(() => {
		const counts = new Map<string, number>();
		for (const video of store.videos) {
			for (const p of video.playlists) {
				counts.set(p.title, (counts.get(p.title) ?? 0) + 1);
			}
		}
		return counts;
	});

	// Derived: filtered and sorted videos
	const filteredVideos = $derived.by<Video[]>(() => {
		let result = store.videos;

		if (selectedCollection) {
			result = result.filter((v) => v.playlists.some((p) => p.title === selectedCollection));
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

		if (sortBy === 'title') {
			result = [...result].sort((a, b) => a.title.localeCompare(b.title));
		} else if (sortBy === 'uploadDate') {
			result = [...result].sort(
				(a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
			);
		} else {
			result = [...result].sort((a, b) => {
				const da = a.videoDate ?? a.uploadDate;
				const db = b.videoDate ?? b.uploadDate;
				return new Date(db).getTime() - new Date(da).getTime();
			});
		}

		return result;
	});

	type YearGroup = { year: number; videos: Video[] };

	// Derived: videos grouped by year (null when sorting by title)
	const videoGroups = $derived.by<YearGroup[] | null>(() => {
		if (sortBy === 'title') return null;

		const map = new Map<number, Video[]>();
		for (const video of filteredVideos) {
			const dateStr =
				sortBy === 'uploadDate' ? video.uploadDate : (video.videoDate ?? video.uploadDate);
			const year = new Date(dateStr).getFullYear();
			if (!map.has(year)) map.set(year, []);
			map.get(year)!.push(video);
		}
		return Array.from(map.entries())
			.sort(([a], [b]) => b - a)
			.map(([year, videos]) => ({ year, videos }));
	});

	const gridClass = $derived.by<string>(() => {
		if (density === 'large') return 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';
		if (density === 'list') return 'grid grid-cols-1 gap-3';
		return 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
	});

	const showHero = $derived(!selectedCollection && !searchQuery.trim());
	const pageTitle = $derived(selectedCollection ?? 'All Videos');
</script>

<svelte:head>
	<title>Hirt Family Gallery</title>
</svelte:head>

<div class="flex h-screen bg-gray-100">
	<!-- Mobile sidebar backdrop -->
	{#if sidebarOpen}
		<div
			class="fixed inset-0 z-20 bg-black/30 lg:hidden"
			role="presentation"
			onclick={() => (sidebarOpen = false)}
		></div>
	{/if}

	<!-- Sidebar -->
	<div
		class="fixed inset-y-0 left-0 z-30 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 {sidebarOpen
			? 'translate-x-0'
			: '-translate-x-full'}"
	>
		<Sidebar
			{collections}
			bind:selectedCollection
			bind:sortBy
			{videoCounts}
			totalCount={store.videos.length}
		/>
	</div>

	<!-- Main content -->
	<div class="flex min-w-0 flex-1 flex-col overflow-hidden">
		<!-- Top bar -->
		<div class="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
			<!-- Hamburger (mobile) -->
			<button
				class="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 lg:hidden"
				onclick={() => (sidebarOpen = !sidebarOpen)}
				aria-label="Toggle sidebar"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			</button>

			<h1 class="shrink-0 text-base font-semibold text-gray-900">{pageTitle}</h1>

			<!-- Search -->
			<div class="min-w-0 flex-1">
				<SearchBar bind:value={searchQuery} />
			</div>

			<!-- Density toggle -->
			<div class="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
				<button
					onclick={() => (density = 'large')}
					class="rounded p-1.5 {density === 'large'
						? 'bg-white text-sky-600 shadow-sm'
						: 'text-gray-400 hover:text-gray-600'}"
					title="Large grid"
				>
					<svg class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
						<rect x="1" y="1" width="6" height="6" rx="1" />
						<rect x="9" y="1" width="6" height="6" rx="1" />
						<rect x="1" y="9" width="6" height="6" rx="1" />
						<rect x="9" y="9" width="6" height="6" rx="1" />
					</svg>
				</button>
				<button
					onclick={() => (density = 'medium')}
					class="rounded p-1.5 {density === 'medium'
						? 'bg-white text-sky-600 shadow-sm'
						: 'text-gray-400 hover:text-gray-600'}"
					title="Medium grid"
				>
					<svg class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
						<rect x="1" y="1" width="4" height="4" rx="0.5" />
						<rect x="6" y="1" width="4" height="4" rx="0.5" />
						<rect x="11" y="1" width="4" height="4" rx="0.5" />
						<rect x="1" y="6" width="4" height="4" rx="0.5" />
						<rect x="6" y="6" width="4" height="4" rx="0.5" />
						<rect x="11" y="6" width="4" height="4" rx="0.5" />
						<rect x="1" y="11" width="4" height="4" rx="0.5" />
						<rect x="6" y="11" width="4" height="4" rx="0.5" />
						<rect x="11" y="11" width="4" height="4" rx="0.5" />
					</svg>
				</button>
				<button
					onclick={() => (density = 'list')}
					class="rounded p-1.5 {density === 'list'
						? 'bg-white text-sky-600 shadow-sm'
						: 'text-gray-400 hover:text-gray-600'}"
					title="List view"
				>
					<svg class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
						<rect x="1" y="1" width="14" height="3" rx="1" />
						<rect x="1" y="6" width="14" height="3" rx="1" />
						<rect x="1" y="11" width="14" height="3" rx="1" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Scrollable content -->
		<div class="flex-1 overflow-y-auto">
			{#if showHero}
				<HeroBanner />
			{/if}

			<div class="p-4">
				{#if store.loading}
					<p class="mt-8 text-center text-gray-500">Loading videos...</p>
				{:else if store.error}
					<p class="mt-8 text-center text-red-500">{store.error}</p>
				{:else if filteredVideos.length === 0}
					<p class="mt-8 text-center text-gray-500">No videos found.</p>
				{:else if sortBy === 'title'}
					<div class={gridClass}>
						{#each filteredVideos as video (video.id)}
							<VideoCard {video} {density} onTagClick={(tag) => (searchQuery = tag)} />
						{/each}
					</div>
				{:else}
					{#each videoGroups ?? [] as group (group.year)}
						<div class="mb-8">
							<div class="mb-3 flex items-center gap-3">
								<h2 class="text-sm font-semibold text-gray-500">{group.year}</h2>
								<div class="h-px flex-1 bg-gray-200"></div>
							</div>
							<div class={gridClass}>
								{#each group.videos as video (video.id)}
									<VideoCard {video} {density} onTagClick={(tag) => (searchQuery = tag)} />
								{/each}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>
