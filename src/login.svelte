<script>
	import Textfield from "@smui/textfield";
	import Button from "@smui/button";
	import { login, token } from "./login";
	import Snackbar from "@smui/snackbar";
	import { Label } from "@smui/common";
	import Card from "@smui/card";

	let user = "team1";
	let password = "bq1o";
	let errorMessage;
	let errorSnack;

	async function tryLogin(e) {
		e.preventDefault();
		try {
			token.set(await login(user, password));
		} catch (e) {
			errorMessage = e.message;
			errorSnack.open();
		}
	}
</script>

<Card>
	<form>

		<p>
			<Textfield
				style="width:100%"
				bind:value={user}
				label="User"
				input$aria-controls="username"
				input$aria-describedby="username" />
		</p>

		<p>
			<Textfield
				style="width:100%"
				bind:value={password}
				type="password"
				label="Password"
				input$aria-controls="Password"
				input$aria-describedby="password" />
		</p>

		<Snackbar bind:this={errorSnack} labelText={errorMessage}>
			<Label />
		</Snackbar>

		<Button on:click={tryLogin} style="width:100%" color="primary" variant="raised">Sign in</Button>

	</form>
</Card>
