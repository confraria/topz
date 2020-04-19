<script>
	import Login from "./login.svelte";
	import Game from "./game.svelte";
	import { token } from "./login";
</script>

{#if $token}
	<Game />
{:else}
	<Login />
{/if}
