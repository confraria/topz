import { dbTenant } from "./tenants";
import { couch } from "./db";

export async function create(user, tenantName?) {
	const users = couch.use("_users");
	user.type = "user";
	user.roles = user.roles || [];
	if (tenantName) {
		user.roles.push(`tenant:${tenantName}`);
	}
	user.roles = [...new Set(user.roles)];
	const systemUser = { ...user };
	systemUser.name = getRawUserName(user.name, tenantName);
	users.insert(systemUser, `org.couchdb.user:${systemUser.name}`);
	if (tenantName) {
		var db = dbTenant(tenantName);
		delete user.password;
		await db.insert(user, `user:${user.name}`);
	}
}

export function getRawUserName(user, tenant) {
	return tenant ? `${tenant}.${user}` : user;
}

export function get(userName, tenantName?) {
	console.log(userName, tenantName);
	if (tenantName) {
		return dbTenant(tenantName).get(`user:${userName}`);
	} else {
		return couch.use("_users").get(`org.couchdb.user:${userName}`);
	}
}
