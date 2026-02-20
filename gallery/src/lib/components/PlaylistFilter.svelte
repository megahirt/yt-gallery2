<script lang="ts">
	import type { PlaylistRef } from '$lib/types';

	let {
		playlists,
		selected = $bindable(null)
	}: {
		playlists: PlaylistRef[];
		selected: string | null;
	} = $props();
</script>

<div class="flex flex-wrap gap-2">
	<button
		class="btn btn-sm {selected === null ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
		onclick={() => (selected = null)}
	>
		All
	</button>
	{#each playlists as playlist}
		<button
			class="btn btn-sm {selected === playlist.id ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
			onclick={() => (selected = selected === playlist.id ? null : playlist.id)}
		>
			{playlist.title}
		</button>
	{/each}
</div>
