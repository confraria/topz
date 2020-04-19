import fastproxy from "fast-proxy";
import { authenticate as dbAuthenticate, sign, verify } from "./auth";
import {
	DB_PROTOCOL,
	DB_HOST,
	DB_PORT,
	S3_URL,
	S3_BUCKET,
	S3_ACCESS_KEY_ID,
	S3_SECRET_ACCESS_KEY,
} from "./config";
import { findByDomain } from "./tenants.js";
import S3 from "aws-sdk/clients/s3.js";
import { getRawUserName } from "./users";

console.log(S3_URL);

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

async function authenticate(req, res) {
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

function verifyAuthentication(req, res, next) {
	const token = (req.headers.authorization || "").split(/\s+/).pop();
	try {
		req.user = verify(token);
		next();
	} catch (e) {
		res.send("Unauthorized", 401);
	}
}

async function proxyCouch(req, res) {
	const { tenant, user } = req;
	if (user.roles.includes("admin") || user.roles.includes(`tenant:${tenant.tenant}`)) {
		const url = req.url.replace(/^\/api.db/, tenant.db);
		const { rawName, name } = req.user;
		req.headers["X-Auth-CouchDB-Username"] = rawName || name;
		req.headers["X-Auth-CouchDB-Roles"] = req.user.roles.join(",");
		proxy.proxy(req, res, url, {});
	} else {
		res.send("Unauthorized", 401);
	}
}

async function checkTenant(req, res, next) {
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

async function uploadHandler(req, res) {
	let { file = "unknow.file" } = req.headers;

	console.log(`${req.tenant.tenant}/${file}`, req);
	s3.upload(
		{
			Bucket: S3_BUCKET,
			ACL: "public-read",
			Key: `${req.tenant.tenant}/${req.user.user}/${file}`,
			Body: req,
			ContentType: req.headers["content-type"],
		},
		(err, data) => {
			console.log(err);
			if (err) res.send(err, 500);
			else res.send(data, 200);
		},
	);
}

export { authenticate, verifyAuthentication, proxyCouch, checkTenant, uploadHandler };
