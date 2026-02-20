<script lang="ts">
	let { value = $bindable('') }: { value: string } = $props();
</script>

<input
	type="search"
	placeholder="Search videos..."
	class="input w-full"
	bind:value
/>
