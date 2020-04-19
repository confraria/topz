import PouchDB from "pouchdb";
import Find from "pouchdb-find";

PouchDB.plugin(Find);

let local;
let remote;
let sync;

async function init(token) {
	if (!local) local = new PouchDB("local");
	if (sync) {
		sync.cancel();
	}
	const headers = { authorization: `Bearer ${token}` };
	remote = new PouchDB(`${location.origin}/api/db`, { headers });
	sync = local.sync(remote, { retry: true });
	return new Promise((resolve, reject) => {
		sync
			.on("complete", info => {
				sync = local.sync(remote, { retry: true, live: true });
				resolve(info);
			})
			.on("error", err => {
				reject(err);
			});
	});
}

function destroy() {
	if (sync) {
		sync.cancel();
		sync = null;
	}
	if (local) {
		local.destroy();
		local = null;
	}
}

export { init, destroy, local as db };
