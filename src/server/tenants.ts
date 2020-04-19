import { DOMAIN } from "./config.js";
import { couch, system, updateDoc } from "./db";
import { DocumentScope } from "nano";

const defaultSecurity = tenantName => ({
	_id: "_security",
	admins: { names: [], roles: ["admin"] },
	members: { names: [], roles: [`tenant:${tenantName}`] },
});
const defaultTenantConfig = (tenantName, config) => ({
	domain: `${tenantName}.${DOMAIN}`,
	tenant: tenantName,
	...config,
});
const dbName = tenant => `tenant/${tenant}`;
const dbTenant = tenant => couch.use(dbName(tenant));

async function list() {
	return await couch.db.list();
}

async function create(tenantName, config = {}) {
	try {
		const name = dbName(tenantName);
		await couch.db.create(name);
		const _security = defaultSecurity(tenantName);
		await couch.use(name).insert(_security, _security._id);
	} catch (e) {
		if (e.error !== "file_exists") {
			throw e;
		}
	}
	return update(tenantName, defaultTenantConfig(tenantName, config));
}

async function update(tenantName, config) {
	const res = await Promise.all([
		updateDoc(dbTenant(tenantName), config, "tenantConfig"),
		updateDoc(system, config, `tenant:${tenantName}`),
	]);
	return res[1];
}

async function destroy(tenantName) {
	const systemId = `tenant:${tenantName}`;
	const { _rev } = await system.get(systemId);
	return await Promise.all([
		couch.db.destroy(`tenant/${tenantName}`),
		system.destroy(systemId, _rev),
		destroyUsers(tenantName),
	]);
}

async function destroyUsers(tenant) {
	const db = couch.use("_users");
	const { docs: users } = await db.find({
		selector: { tenant },
		fields: ["_id", "_rev"],
		limit: 500,
	});
	const docs = users.map(u => ({ ...u, _deleted: true }));
	return await db.bulk({ docs });
}

async function findByDomain(domain) {
	const _system = system as DocumentScope<{
		tenant: string;
		_id: string;
		_rev: string;
	}>;

	const {
		docs: [doc],
	} = await _system.find({
		selector: {
			_id: { $regex: "^tenant:" },
			domain: domain,
		},
		limit: 1,
	});
	if (doc) {
		return { ...doc, db: encodeURIComponent(dbName(doc.tenant)) };
	}
	return null;
}

export { findByDomain, destroy, create, list, dbTenant };
