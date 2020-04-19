import { put, get } from "../data";

const listeners = [];
const { geolocation } = navigator;
let watchId;
let user;

function start(_user) {
	if (watchId) return;
	user = _user;
	watchId = geolocation.watchPosition(onPosition, onError, {
		enableHighAccuracy: true,
		maximumAge: 30000,
	});
}

function onPosition(pos) {
	updatePosition(pos);
	listeners.forEach(fn => fn(pos));
}

function onError(err) {}

function subscribe(cb) {
	listeners.push(cb);
	return () => {
		const ix = listeners.indexOf(cb);
		if (ix > -1) listeners.splice(ix, 1);
	};
}

function stop() {
	geolocation.clearWatch(watchId);
	watchId = null;
}

async function updatePosition(pos) {
	let _id = `geo:${user}`;
	let data;
	try {
		data = await get(_id);
	} catch (e) {
		data = {
			_id,
			type: "geo",
		};
	}
	const { latitude, longitude } = pos.coords;
	data = { ...data, latitude, longitude, time: Date.now() };
	return put(data);
}

export { start, subscribe, stop };
