import got from "got";
import jwt from "jsonwebtoken";
import { DB_HOST, DB_PORT, DB_PROTOCOL } from "./config";

async function authenticate(username, password) {
	return await got
		.get({
			url: `${DB_PROTOCOL}://${DB_HOST}:${DB_PORT}/_session`,
			responseType: "json",
			username,
			password,
		})
		.json();
}

function sign(payload: object) {
	return jwt.sign(payload, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES,
	});
}

function verify(token: string) {
	if (jwt.verify(token, process.env.JWT_SECRET)) {
		return jwt.decode(token);
	}
	throw new Error("Invalid token");
}

export { authenticate, sign, verify };
