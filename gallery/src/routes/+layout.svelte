<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="min-h-screen bg-surface-50-950">
	<nav class="bg-surface-200-800 border-b border-surface-300-700 px-4 py-3">
		<div class="mx-auto flex max-w-7xl items-center justify-between">
			<a href="/" class="text-xl font-bold text-surface-900-50">Family Videos</a>
			<a href="/admin" class="btn btn-sm preset-tonal-surface">Admin</a>
		</div>
	</nav>

	<main class="mx-auto max-w-7xl p-4">
		{@render children()}
	</main>
</div>
