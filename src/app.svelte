<script>
	import Login from "./login.svelte";
	import Game from "./game.svelte";
	import { notifications, removeNotification, user } from "./global";
</script>

<style>

</style>

{#if $user}
	<Game />
{:else}
	<Login />
{/if}

{#each $notifications as notification}
	<div class={notification.type} on:click={() => removeNotification(notification)}>
		{notification.text}
	</div>
{/each}
