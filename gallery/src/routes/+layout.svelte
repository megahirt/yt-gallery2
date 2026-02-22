<script lang="ts">
	import '../app.css';
	import { setContext } from 'svelte';
	import { videoStore } from '$lib/stores/videos.svelte';

	let { children } = $props();

	setContext('videoStore', videoStore);

	$effect(() => {
		videoStore.load();
	});
</script>

{@render children()}
