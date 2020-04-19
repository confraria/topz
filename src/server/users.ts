import { dbTenant } from "./tenants";
import { couch } from "./db";

async function create(user, tenantName) {
	var db = dbTenant(tenantName);
	const users = couch.use("_users");
	user.type = "user";
	user.roles = user.roles || [];
	user.type = "user";
	user.tenant = tenantName;
	const systemUser = { ...user };
	systemUser.name = getRawUserName(user.name, tenantName);
	user.roles.push(`tenant:${tenantName}`);
	await db.insert(user, `user:${user.name}`);
	return users.insert(systemUser, `org.couchdb.user:${systemUser.name}`);
}

function getRawUserName(user, tenant) {
	return `${tenant}.${user}`;
}

function get(userName, tenantName) {
	var db = dbTenant(tenantName);
	return db.get(`user:${userName}`);
}

export { create, get, getRawUserName };
