import { decode } from "jsonwebtoken";
import { writable } from "svelte/store";
import { init, destroy } from "./data";
import { start, stop } from "./location";

export const token = writable(localStorage.getItem("token"));

token.subscribe(token => {
	if (token) {
		localStorage.setItem("token", token);
		const tokenData = decode(token);
		init(token);
		setTimeout(() => start(tokenData.user));
	} else {
		localStorage.removeItem("token");
		destroy();
	}
});

export async function login(user, password) {
	const body = new URLSearchParams();
	body.append("name", user);
	body.append("password", password);
	const res = await fetch("/api/auth", {
		method: "POST",
		body,
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
