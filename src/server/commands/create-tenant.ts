import { create } from "../tenants";

async function main() {
	const tenantName = process.argv[2];
	const res = await create(tenantName);
	console.log(res);
}

main();
