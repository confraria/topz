import { init, destroy, db } from "./db";

self.onmessage = ({
	data: {
		id,
		call: [method, ...args],
	},
}) => {
	switch (method) {
		case "init":
			return init(args[0]);
		case "destroy":
			return destroy();
		default:
			if (typeof db[method] === "function") {
				db[method](...args).then(
					res => {
						self.postMessage({ id, res });
					},
					err => {
						self.postMessage({ id, err });
					},
				);
			}
	}
};
