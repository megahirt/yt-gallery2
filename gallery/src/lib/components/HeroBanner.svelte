<script lang="ts">
	import { SITE_NAME, SITE_SUBTITLE } from '$lib/config';
	import { base } from '$app/paths';

	let imgError = $state(false);
</script>

<div class="relative w-full overflow-hidden bg-gradient-to-br from-sky-500 to-sky-700" style="height: 280px;">
	{#if !imgError}
		<img
			src="{base}/hero.jpg"
			alt="Gallery hero"
			class="absolute inset-0 h-full w-full object-cover"
			onerror={() => (imgError = true)}
		/>
	{/if}
	<!-- Dark overlay -->
	<div class="absolute inset-0 bg-black/40"></div>
	<!-- Title -->
	<div class="relative z-10 flex h-full items-end px-8 pb-8">
		<div class="text-white">
			<h1 class="text-4xl font-bold drop-shadow-lg">{SITE_NAME}</h1>
			<p class="mt-1 text-lg text-white/80">{SITE_SUBTITLE}</p>
		</div>
	</div>
</div>
