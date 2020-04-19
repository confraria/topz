import nano from "nano";
import { DB_USER, DB_PASS, DB_HOST, DB_PORT, DB_PROTOCOL } from "./config";

const couch = nano(`${DB_PROTOCOL}://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}`);
const systemDbName = "system";
const system = couch.use(systemDbName);
const ready = init();

async function init() {
	try {
		await couch.db.get(systemDbName);
	} catch (e) {
		if (e.error == "not_found") {
			await couch.db.create(systemDbName);
			await couch.use(systemDbName).createIndex({
				index: { fields: ["domain"] },
				name: "domainindex",
			});
		} else {
			throw e;
		}
	}
}

async function updateDoc(db, doc, id) {
	return (doc._rev
		? Promise.resolve(doc._rev)
		: db.get(id).then(
				d => d._rev,
				e => undefined,
		  )
	).then(_rev => db.insert({ _rev, ...doc }, id));
}

export { couch, system, ready, updateDoc };
