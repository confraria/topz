import fastproxy from "fast-proxy";
import { authenticate as dbAuthenticate, sign, verify, createNewUserToken } from "./auth";
import {
	DB_PROTOCOL,
	DB_HOST,
	DB_PORT,
	S3_URL,
	S3_BUCKET,
	S3_ACCESS_KEY_ID,
	S3_SECRET_ACCESS_KEY,
	TWILIO_ACCOUNT_SID,
	TWILIO_API_KEY_SID,
	TWILIO_API_KEY_SECRET,
} from "./config";
import { findByDomain } from "./tenants.js";
import S3 from "aws-sdk/clients/s3.js";
import { get as getUser, create, getRawUserName } from "./users";
import twilio from "twilio";

const proxy = fastproxy({ base: `${DB_PROTOCOL}://${DB_HOST}:${DB_PORT}` });
const s3 = new S3({
	credentials: {
		accessKeyId: S3_ACCESS_KEY_ID,
		secretAccessKey: S3_SECRET_ACCESS_KEY,
	},
	sslEnabled: false,
	s3ForcePathStyle: true,
	endpoint: S3_URL,
});
const tenants = {};

export async function authenticate(req, res) {
	const {
		tenant: { tenant },
		body: { name, password },
	} = req;

	if (!name || !password) {
		res.send("Invalid credentials", 401);
		return;
	}
	let session;
	try {
		session = await dbAuthenticate(getRawUserName(name, tenant), password);
		session.userCtx.user = name;
	} catch (e) {
		try {
			session = await dbAuthenticate(name, password);
		} catch (e) {
			res.send("Invalid credentials", 401);
			return;
		}
	}
	if (!session.userCtx.name) {
		res.send("Invalid credentials", 401);
		return;
	}
	const token = sign(session.userCtx);
	res.send(token, 200);
}

export function verifyAuthentication(req, res, next) {
	const token = (req.headers.authorization || "")
		.split(/\s+/)
		.pop()
		.trim();
	try {
		req.user = verify(token);
		next();
	} catch (e) {
		res.send("Unauthorized", 401);
	}
}

export async function proxyCouch(req, res) {
	const { tenant, user } = req;
	if (
		user.roles.includes("admin") ||
		user.roles.includes("staff") ||
		user.roles.includes(`tenant:${tenant.tenant}`)
	) {
		const url = req.url.replace(/^\/api.db(.db)?/, tenant.db);
		const { rawName, name } = req.user;
		req.headers["X-Auth-CouchDB-Username"] = rawName || name;
		req.headers["X-Auth-CouchDB-Roles"] = req.user.roles.join(",");
		proxy.proxy(req, res, url, {});
	} else {
		res.send("Unauthorized", 401);
	}
}

export async function checkTenant(req, res, next) {
	const domain = req.headers.host.replace(/:.*/, "");
	const tenant = tenants[domain] || (await findByDomain(domain));
	tenants[domain] = tenant;
	if (tenant) {
		req.tenant = tenant;
		next();
	} else {
		res.send("Tenant not found", 404);
	}
}

export async function uploadHandler(req, res) {
	let { file = "unknow.file" } = req.headers;
	s3.upload(
		{
			Bucket: S3_BUCKET,
			ACL: "public-read",
			Key: `${req.tenant.tenant}/${req.user.user}/${file}`,
			Body: req,
			ContentType: req.headers["content-type"],
		},
		(err, data) => {
			if (err) res.send(err, 500);
			else res.send(data, 200);
		},
	);
}

export const allRoles = (...roles) => {
	return (req, res, next) => {
		const { user } = req;
		const userRoles = new Set(user && user.roles);
		const allowed = !!user && roles.every(r => userRoles.has(r));
		if (allowed) {
			next();
		} else {
			res.send("Not allowed", 403);
		}
	};
};

export const role = (...roles) => {
	return (req, res, next) => {
		const { user } = req;
		const userRoles = new Set(user && user.roles);
		const allowed = !!user && roles.some(r => userRoles.has(r));
		if (allowed) {
			next();
		} else {
			res.send("Not allowed", 403);
		}
	};
};

export function handleNewUserToken(req, res) {
	const roles = req.body.roles || [];
	if (roles.indexOf("admin") === -1) {
		roles.push(`tenant:${req.tenant.tenant}`);
	}
	res.send(createNewUserToken(roles));
}

export async function handleNewUser(req, res) {
	const { user, tenant } = req;
	const newUser = req.body;
	if (user.createUser) {
		newUser.roles = user.roles;
	}
	let tenantName = tenant.tenant;
	const roles = [...new Set(newUser.roles)];
	if (roles.indexOf("admin") > -1) {
		tenantName = undefined;
	}
	try {
		await create(
			{
				name: newUser.name,
				password: newUser.password || Math.random().toString(36),
				roles,
			},
			tenantName,
		);
	} catch (e) {
		if (e.error === "conflict") {
			res.send("User already exists", 400);
			return;
		}
	}
	req.body = newUser;
	authenticate(req, res);
}

export async function getCurrentUser(req, res) {
	const { tenant, user } = req;
	const userName = user.user || user.name;
	const dbUser = await (user.roles.includes("admin")
		? getUser(userName)
		: getUser(userName, tenant.tenant));
	res.send(dbUser);
}

export async function createTwilioToken(req, res) {
	const { AccessToken } = twilio.jwt;
	const { VideoGrant } = AccessToken;
	console.log(TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET);
	const { user } = req;
	const token = new AccessToken(TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, {
		identity: user.user || user.name,
	});
	const videoGrant = new VideoGrant();
	token.addGrant(videoGrant);
	res.send(token.toJwt());
}
