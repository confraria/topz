import got from "got";
import jwt from "jsonwebtoken";
import { DB_HOST, DB_PORT, DB_PROTOCOL, JWT_EXPIRES, JWT_SECRET } from "./config";

export async function authenticate(username, password) {
	return await got
		.get({
			url: `${DB_PROTOCOL}://${DB_HOST}:${DB_PORT}/_session`,
			responseType: "json",
			username,
			password,
		})
		.json();
}

export function sign(payload: object, expiresIn: string = JWT_EXPIRES) {
	return jwt.sign(payload, JWT_SECRET, {
		expiresIn,
	});
}

export function verify(token: string) {
	if (jwt.verify(token, JWT_SECRET)) {
		return jwt.decode(token);
	}
	throw new Error("Invalid token");
}

export function createNewUserToken(roles) {
	return sign(
		{
			createUser: true,
			roles,
		},
		"5m",
	);
}
