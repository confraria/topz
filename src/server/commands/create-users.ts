import { create } from "../users";

async function main() {
	const tenantName = process.argv[2];
	for (let i = 1; i <= 30; i++) {
		await create(
			{
				name: `team${i}`,
				password: Math.random()
					.toString(36)
					.slice(-4),
			},
			tenantName,
		);
	}
}

main();
