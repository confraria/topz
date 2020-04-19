const worker = new Worker("./worker.js");
const calls: { [key: number]: any } = {};
let callId = 0;

let resolveApi;
const api = new Promise(resolve => (resolveApi = resolve));

worker.onerror = onError as any;
worker.onmessage = onMessage as any;

function createFunction(name) {
	return async (...args) => {
		const id = callId++;
		worker.postMessage({ id, call: [name, ...args] });
		return new Promise((resolve, reject) => {
			calls[id] = { promise: [resolve, reject] };
		});
	};
}

function onMessage({ data: { id, res, err } }) {
	const { promise, observable } = calls[id] || {};

	if (promise) {
		const [resolve, reject] = promise;
		if (err) {
			reject(err);
		} else {
			resolve(res);
		}
		delete calls[id];
	}
	if (observable) {
		observable.next(res);
	}
}

function onError(e) {
	console.error(e);
}

export const init = token => worker.postMessage({ call: ["init", token] });
export const destroy = () => worker.postMessage({ call: ["destroy"] });
export const get = createFunction("get");
export const put = createFunction("put");
export const remove = createFunction("remove");
export const allDocs = createFunction("allDocs");
export const find = createFunction("find");
