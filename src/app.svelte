<script>
	import Login from "./login.svelte";
	import Game from "./game.svelte";
	import Users from './users.svelte';
	import { notifications, removeNotification, user } from "./global";
</script>

<style>

:root {
	--font-family: Frutiger, "Frutiger Linotype", Univers, Calibri, "Gill Sans", "Gill Sans MT", "Myriad Pro", Myriad, "DejaVu Sans Condensed", "Liberation Sans", "Nimbus Sans L", Tahoma, Geneva, "Helvetica Neue", Helvetica, Arial, sans-serif;
	--ratio: 0.8;
	--s-5: calc(var(--s-4) / var(--ratio));
  --s-4: calc(var(--s-3) / var(--ratio));
  --s-3: calc(var(--s-2) / var(--ratio));
  --s-2: calc(var(--s-1) / var(--ratio));
  --s-1: calc(var(--s0) / var(--ratio));
	-s0: 1rem;
	--s1: calc(var(--s0) * var(--ratio));
  --s2: calc(var(--s1) * var(--ratio));
  --s3: calc(var(--s2) * var(--ratio));
  --s4: calc(var(--s3) * var(--ratio));
  --s5: calc(var(--s4) * var(--ratio));
}

:global(*) {
	font-family: var(--font-family);
}

</style>

{#if $user}
	<Users />
	<Game />
{:else}
	<Login />
{/if}

{#each $notifications as notification}
	<div class={notification.type} on:click={() => removeNotification(notification)}>
		{notification.text}
	</div>
{/each}
