import { destroy } from "../tenants";

async function main() {
	const tenantName = process.argv[2];
	const res = await destroy(tenantName);
	console.log(res);
}

main();
