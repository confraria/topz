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
} from "./handlers.js";

const server = restana();
server.use(checkTenant);
server.all("/api/db/*", verifyAuthentication, proxyCouch);
server.post(
	"/api/auth",
	bodyparser.urlencoded({ extended: true }),
	authenticate,
);
server.post("/api/upload", verifyAuthentication, uploadHandler);

async function main() {
	await ready;
	await server.start(SERVER_PORT);
	console.log(`Server running on port ${SERVER_PORT}`);
}

main();

export { server };
