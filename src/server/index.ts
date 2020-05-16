import bodyparser from "body-parser";
import restana from "restana";
import { SERVER_PORT } from "./config";
import { ready } from "./db";
import {
	authenticate,
	verifyAuthentication,
	proxyCouch,
	checkTenant,
	uploadHandler,
	role,
	handleNewUserToken,
	handleNewUser,
	getCurrentUser,
	createTwilioToken,
} from "./handlers.js";

const server = restana();
server.use(checkTenant);
server.all("/api/db/*", verifyAuthentication, proxyCouch);
server.post("/api/auth", bodyparser.urlencoded({ extended: true }), authenticate);
server.post("/api/upload", verifyAuthentication, uploadHandler);

server.post(
	"/api/user/create-token",
	verifyAuthentication,
	role("admin"),
	bodyparser.json(),
	handleNewUserToken,
);

server.post("/api/user", bodyparser.json(), verifyAuthentication, handleNewUser);
server.get("/api/user", verifyAuthentication, getCurrentUser);
server.post("/api/video-access", verifyAuthentication, createTwilioToken);

async function main() {
	await ready;
	await server.start(SERVER_PORT);
	console.log(`Server running on port ${SERVER_PORT}`);
}

main();

export { server };
