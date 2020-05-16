<script>
	import { onMount } from "svelte";
	import { logout, db, token, twilioToken, user } from "./global";
	import twilio from "twilio-video";
	let videoEl;

	db.changes({ since: "now", live: true, include_docs: true }).on("change", change => {
		console.log(change);
	});

	async function connect(twilioToken) {
		const tracks = await twilio.createLocalTracks({
			audio: true,
			video: { width: 640 },
		});

		videoEl.appendChild(tracks[1].attach());
		const room = await twilio.connect(twilioToken, { name: "main", tracks });
		console.log(`Successfully joined a Room: ${room}`);
		room.participants.forEach(participant => {
			participant.tracks.forEach(publication => {
				if (publication.track) {
					videoEl.appendChild(publication.track.attach());
				}
			});

			participant.on("trackSubscribed", track => {
				videoEl.appendChild(track.attach());
			});
		});
		room.on("participantConnected", participant => {
			console.log(`Participant "${participant.identity}" connected`);

			participant.tracks.forEach(publication => {
				if (publication.isSubscribed) {
					const track = publication.track;
					videoEl.appendChild(track.attach());
				}
			});

			participant.on("trackSubscribed", track => {
				videoEl.appendChild(track.attach());
			});
		});
	}

	function click() {
		db.put({
			_id: `test:${Math.random()}`,
			text: "hello",
		});
	}

	$: $twilioToken && connect($twilioToken);
</script>

<div>
	<h1>GAME</h1>
	<div bind:this={videoEl} />
	<button on:click={click}>create</button>
	<button on:click={logout}>Logout</button>
</div>
