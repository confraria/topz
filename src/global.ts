import PouchDB from "pouchdb";
import Find from "pouchdb-find";
import { readable, get, writable, derived } from "svelte/store";

PouchDB.plugin(Find);
interface Notification {
	text: string;
	type: "sucess" | "error" | "warning" | "info";
}

export const db = new PouchDB("local");
db.createIndex({
  index: {
    fields: ['type']
  }
});

export const notifications = writable([]);

export function addNotification(notification: Notification) {
	notifications.update(n => [...n, notification]);
}

export function removeNotification(notification: Notification) {
	notifications.update(n => n.filter(n => notification !== n));
}

export async function login(user: string, password?: any) {
	const res = await fetch("/api/auth", {
		method: "POST",
		body: new URLSearchParams({ name: encodeURIComponent(user), password }),
	});
	if (res.ok) {
		return res.text();
	}
	throw new Error(await res.text());
}

export async function createUser(name: string, password: string, token: string) {
	const res = await fetch("/api/user", {
		method: "POST",
		headers: {
			"content-type": "application/json",
			authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ name: encodeURIComponent(name), password }),
	});
	if (res.ok) {
		return res.text();
	}
	throw new Error(await res.text());
}

export function logout() {
	token.set(null);
	stop();
}

export const token = writable(localStorage.getItem("token"));
token.subscribe(t => {
	t ? localStorage.setItem("token", t) : localStorage.removeItem("token");
});

export const twilioToken = derived(token, ($token, set) => {
	if ($token) {
		fetch("/api/video-access", {
			method: "POST",
			headers: {
				authorization: `Bearer ${$token}`,
			},
		})
			.then(res => res.text())
			.then(set);
	}
});

export const user = derived(token, ($token, set) => {
	if ($token) {
		fetch("/api/user", {
			method: "GET",
			headers: {
				authorization: `Bearer ${$token}`,
			},
		})
			.then(res => res.json())
			.then(set);
	} else {
		set(null);
	}
	return () => 0;
});

user.subscribe(u => {
	if (u) {
		const headers = { authorization: `Bearer ${get(token)}` };
		const remote = new PouchDB(`${location.origin}/api/db/db`, {
			headers,
		});
		const sync = db.sync(remote, { retry: true });
		sync
			.on("complete", () => {
				console.log("sync complete");
				db.sync(remote, { retry: true, live: true });
			})
			.on("error", e => console.error(e));
	}
});
