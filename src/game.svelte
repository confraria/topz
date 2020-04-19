<script>
	import Button from "@smui/button";
	import TopAppBar, { Row, Section, Title } from "@smui/top-app-bar";
	import IconButton from "@smui/icon-button";
	import Checkbox from "@smui/checkbox";
	import { token, logout } from "./login";
</script>

<TopAppBar variant="static" dense color="primary">
	<Row>
		<Section>
			<IconButton class="material-icons">menu</IconButton>
		</Section>
		<Section align="end" toolbar>
			<IconButton class="material-icons" aria-label="logout" on:click={logout}>logout</IconButton>
		</Section>
	</Row>
</TopAppBar>
