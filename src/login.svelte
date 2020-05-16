<script>
	import { addNotification, login, token, createUser } from "./global";
	let user;
	let password;
	const newUserToken = getNewUserToken();

	function getNewUserToken() {
		const {
			location: { search, pathname },
		} = window;
		const token = new URLSearchParams(search).get("t");
		if (token) {
			window.history.replaceState({}, "", pathname);
			return token;
		}
		return;
	}

	async function submit() {
		try {
			if (newUserToken) {
				token.set(await createUser(user, password, newUserToken));
			} else {
				token.set(await login(user, password));
			}
		} catch (e) {
			addNotification({
				text: e.message,
				type: "error",
			});
		}
	}
</script>

<form on:submit|preventDefault={submit}>

	<label for="username">Username</label>
	<input id="username" bind:value={user} />

	<label for="password">Password</label>
	<input id="password" type="password" bind:value={password} />

	<button>{newUserToken ? 'Create user' : 'Sign in'}</button>

</form>
