import { app } from 'electron';
import { writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import moment from 'moment';
import * as url from 'url';
import * as path from 'path';
import { LocalStore } from './desktop-store';
import Form from 'form-data';
import { BrowserWindow, screen } from 'electron';
import screenshot from 'screenshot-desktop';
import * as remoteMain from '@electron/remote/main';

// Import logging for electron and override default console logging
import log from 'electron-log';
console.log = log.log;
Object.assign(console, log.functions);

const captureOnlyActiveWindow = async (
	displays,
	timeSlotId,
	activeScreen,
	quitApp,
	notificationWindow,
	timeTrackerWindow,
	isTemp,
	windowPath,
	soundPath
) => {
	/* Checking if the user is allowed to take a screenshot. */
	if (!allowScreenshotCapture()) {
		return;
	}
	const display = displays.find((x) => x.id === activeScreen.id.toString());
	if (!isTemp) {
		const result = await uploadScreenShot(
			display.img,
			display.name,
			timeSlotId,
			false,
			quitApp,
			notificationWindow,
			timeTrackerWindow,
			windowPath,
			soundPath
		);
		return [result];
	} else {
		saveTempImage(display.img, display.name, timeSlotId, timeTrackerWindow);
		return [];
	}
};

const captureAllWindow = async (
	displays,
	timeSlotId,
	activeScreen,
	quitApp,
	notificationWindow,
	timeTrackerWindow,
	isTemp,
	windowPath,
	soundPath
) => {
	/* Checking if the user is allowed to take a screenshot. */
	if (!allowScreenshotCapture()) {
		return;
	}
	const result = [];
	await Promise.all(
		displays.map(async (display, i) => {
			if (!isTemp) {
				const res = await uploadScreenShot(
					display.img,
					display.name,
					timeSlotId,
					i === 0,
					quitApp,
					notificationWindow,
					timeTrackerWindow,
					windowPath,
					soundPath
				);
				if (display.id === activeScreen.id.toString()) {
					result.push({
						...res,
						name: display.name,
					});
				}
			} else {
				saveTempImage(
					display.img,
					display.name,
					timeSlotId,
					timeTrackerWindow
				);
			}
		})
	);
	return result;
};

const uploadScreenShot = async (
	img,
	name,
	timeSlotId,
	show = false,
	quitApp,
	notificationWindow,
	timeTrackerWindow,
	windowPath,
	soundPath
) => {
	/* Checking if the user is allowed to take a screenshot. */
	if (!allowScreenshotCapture()) {
		return;
	}
	/* start upload */
	let fileName = `screenshot-${moment().format(
		'YYYYMMDDHHmmss'
	)}-${name}.png`;

	fileName = convertToSlug(fileName);

	writeScreenshotLocally(img, fileName);

	const appSetting = LocalStore.getStore('appSetting');

	try {
		const appInfo = LocalStore.beforeRequestParams();
		const form = new Form();
		const bufferImg = Buffer.isBuffer(img) ? img : Buffer.from(img);
		form.append('file', bufferImg, {
			contentType: 'image/png',
			filename: fileName,
		});
		form.append('timeSlotId', timeSlotId);
		form.append('tenantId', appInfo.tenantId);
		form.append('organizationId', appInfo.organizationId);

		console.log('Screenshot Form Request:', {
			tenantId: appInfo.tenantId,
			organizationId: appInfo.organizationId,
			timeSlotId: timeSlotId,
		});

		// const response = await fetch(
		// 	`${appInfo.apiHost}/api/timesheet/screenshot`,
		// 	{
		// 		method: 'POST',
		// 		body: form,
		// 		headers: {
		// 			Authorization: `Bearer ${appInfo.token}`,
		// 			'Tenant-Id': appInfo.tenantId
		// 		}
		// 	}
		// );

		console.log(`Send Screenshot to API: ${moment().format()}`);

		const screenshot: any = {};

		console.log(
			`Get Screenshot Response From API: ${moment().format()}`,
			screenshot
		);

		// remove file on local directory after successful upload
		setTimeout(() => {
			removeScreenshotLocally(fileName);
		}, 4000);

		console.log('Screenshot Thumb Url:', screenshot.thumbUrl);

		console.log(
			'Screenshot Location Path:',
			path.join(app.getPath('userData'), `/public/temp/${fileName}`)
		);

		showCapture(timeTrackerWindow, screenshot.thumbUrl);

		if (show && appSetting && appSetting.screenshotNotification) {
			showCapturedToRenderer(
				notificationWindow,
				screenshot.thumbUrl,
				quitApp,
				windowPath,
				soundPath,
				timeTrackerWindow
			);
		}

		return screenshot;
	} catch (e) {
		console.log('Upload Screenshot Error:', e.message);
		// remove file on local directory if any error
		// setTimeout(() => {
		// 	removeScreenshotLocally(fileName);
		// }, 4000);
		const imgLocation = path.join(
			app.getPath('userData'),
			`/public/temp/${fileName}`
		);
		timeTrackerWindow.webContents.send('save_temp_img', {
			type: 'screenshot',
			params: JSON.stringify({
				path: imgLocation,
				timeSlotTempId: timeSlotId,
				message: e.message,
			}),
		});
	}
};

const writeScreenshotLocally = (img, fileName) => {
	/* Checking if the user is allowed to take a screenshot. */
	if (!allowScreenshotCapture()) {
		return;
	}
	const imgLocation = path.join(app.getPath('userData'), '/public/temp');
	readOrCreateTempDir(imgLocation);

	const filePath = path.join(imgLocation, `/${fileName}`);
	writeFileSync(filePath, img);

	return filePath;
};

const removeScreenshotLocally = (fileName) => {
	const imgLocation = path.join(
		app.getPath('userData'),
		`/public/temp/${fileName}`
	);
	console.log('Local Image Temp Path', imgLocation);
	try {
		unlinkSync(imgLocation);
	} catch (error) {
		console.log('Error remove temp', error.message);
	}
};

const readOrCreateTempDir = (tempPath) => {
	try {
		const isDirExist = existsSync(tempPath);
		if (!isDirExist) {
			mkdirSync(path.join(app.getPath('userData'), '/public'));
			mkdirSync(tempPath);
		}
	} catch (error) {
		mkdirSync(tempPath);
		console.log('error create dir', error);
	}
};

export const detectActiveWindow = () => {
	/* Checking if the user is allowed to take a screenshot. */
	if (!allowScreenshotCapture()) {
		return;
	}
	const allScreen = screen.getAllDisplays();
	const cursorPosition = screen.getCursorScreenPoint();
	let idx = null;
	const currentPosition = allScreen.find((item, i) => {
		if (
			cursorPosition.x >= item.bounds.x &&
			cursorPosition.x <= item.bounds.width + item.bounds.x
		) {
			idx = i;
			return item;
		}
	});
	return { ...currentPosition, index: idx };
};

const updateLastCapture = (timeTrackerWindow, timeSlotId) => {
	/* Checking if the user is allowed to take a screenshot. */
	if (!allowScreenshotCapture()) {
		return;
	}
	timeTrackerWindow.webContents.send('show_last_capture', {
		...LocalStore.beforeRequestParams(),
		timeSlotId: timeSlotId,
	});
};

const showCapture = (timeTrackerWindow, url) => {
	/* Checking if the user is allowed to take a screenshot. */
	if (!allowScreenshotCapture()) {
		return;
	}
	timeTrackerWindow.webContents.send('last_capture_local', { fullUrl: url });
};

const showCapturedToRenderer = (
	notificationWindow,
	thumbUrl,
	quitApp,
	windowPath,
	soundPath,
	timeTrackerWindow
) => {
	/* Checking if the user is allowed to take a screenshot. */
	if (!allowScreenshotCapture()) {
		return;
	}
	const soundCamera = soundPath;
	const sizes = screen.getPrimaryDisplay().size;
	// preparing window screenshot
	const screenCaptureWindow = {
		width: 310,
		height: 170,
		frame: false,
		webPreferences: {
			nodeIntegration: true,
			webSecurity: false,
			contextIsolation: false,
		},
	};

	notificationWindow = new BrowserWindow({
		...screenCaptureWindow,
		x: sizes.width - (screenCaptureWindow.width + 15),
		y: 0 + 15,
	});

	console.log('App Name:', app.getName());

	const urlpath = url.format({
		pathname:
			app.getName() !== 'gauzy-desktop-timer'
				? windowPath.screenshotWindow
				: windowPath.timeTrackerUi,
		protocol: 'file:',
		slashes: true,
		hash: '/screen-capture',
	});
	notificationWindow.loadURL(urlpath);
	notificationWindow.setMenu(null);
	notificationWindow.hide();

	setTimeout(() => {
		notificationWindow.show();
		notificationWindow.webContents.send('show_popup_screen_capture', {
			imgUrl: thumbUrl,
			note: LocalStore.beforeRequestParams().note,
		});
		try {
			if (existsSync(soundCamera)) {
				timeTrackerWindow.webContents.send('play_sound', {
					soundFile: soundCamera,
				});
			}
		} catch (err) {
			console.error('sound camera not found');
		}
	}, 1000);
	setTimeout(() => {
		notificationWindow.close();
		if (quitApp) app.quit();
	}, 4000);
};

export async function takeshot(
	timeTrackerWindow,
	arg,
	notificationWindow,
	isTemp,
	windowPath,
	soundPath
) {
	try {
		/* Checking if the user is allowed to take a screenshot. */
		if (!allowScreenshotCapture()) {
			return;
		}
		const displays = arg.screens;
		const appSetting = LocalStore.getStore('appSetting');
		const activeWindow = detectActiveWindow();
		switch (appSetting.monitor.captured) {
			case 'all':
				await captureAllWindow(
					displays,
					arg.timeSlotId,
					activeWindow,
					arg.quitApp,
					notificationWindow,
					timeTrackerWindow,
					isTemp,
					windowPath,
					soundPath
				);
				break;
			case 'active-only':
				await captureOnlyActiveWindow(
					displays,
					arg.timeSlotId,
					activeWindow,
					arg.quitApp,
					notificationWindow,
					timeTrackerWindow,
					isTemp,
					windowPath,
					soundPath
				);
				break;
			default:
				break;
		}

		// show to render
		if (!isTemp) {
			updateLastCapture(timeTrackerWindow, arg.timeSlotId);
		}
	} catch (error) {
		console.log('error upload', error);
	}
}

// method using screenshot-desktop lib
export async function captureScreen(
	timeTrackerWindow,
	notificationWindow,
	timeSlotId,
	quitApp,
	windowPath,
	soundPath
) {
	try {
		/* Checking if the user is allowed to take a screenshot. */
		if (!allowScreenshotCapture()) {
			return;
		}
		const displays = await screenshot.listDisplays();
		const activeWindow = detectActiveWindow();
		const allDisplays = [];
		await Promise.all(
			displays.map(async (display, i) => {
				const img = await screenshot({ screen: display.id });
				allDisplays.push({
					img: img,
					name: `Screen ${i}`,
					id:
						i === activeWindow.index
							? activeWindow.id.toString()
							: display.id,
				});
			})
		);
		takeshot(
			timeTrackerWindow,
			{
				timeSlotId: timeSlotId,
				screens: allDisplays,
				quitApp,
			},
			notificationWindow,
			false,
			windowPath,
			soundPath
		);
	} catch (error) {
		console.log('error', error);
	}
}

export function convertToSlug(text: string) {
	return text
		.toString()
		.toLowerCase()
		.replace(/\s+/g, '-') // Replace spaces with -
		.replace(/\-\-+/g, '-') // Replace multiple - with single -
		.replace(/^-+/, '') // Trim - from start of text
		.replace(/-+$/, ''); // Trim - from end of text
}

export function saveTempImage(img, name, timeSlotId, timeTrackerWindow) {
	let fileName = `screenshot-${moment().format(
		'YYYYMMDDHHmmss'
	)}-${name}.png`;

	fileName = convertToSlug(fileName);

	writeScreenshotLocally(img, fileName);
	const imgLocation = path.join(
		app.getPath('userData'),
		`/public/temp/${fileName}`
	);
	timeTrackerWindow.webContents.send('save_temp_img', {
		type: 'screenshot',
		params: JSON.stringify({
			path: imgLocation,
			timeSlotTempId: timeSlotId,
		}),
	});
}

export async function getScreenshot() {
	const allDisplays = [];
	const displays = await screenshot.listDisplays();
	const activeWindow = detectActiveWindow();
	await Promise.all(
		displays.map(async (display, i) => {
			const img = await screenshot({ screen: display.id });
			allDisplays.push({
				img: img,
				name: `Screen ${i}`,
				id:
					i === activeWindow.index
						? activeWindow.id.toString()
						: display.id,
			});
		})
	);

	const appSetting = LocalStore.getStore('appSetting');
	switch (appSetting.monitor.captured) {
		case 'all':
			return allDisplays;
		case 'active-only':
			return [
				allDisplays.find((x) => x.id === activeWindow.id.toString()),
			];
		default:
			break;
	}
}

export function notifyScreenshot(
	notificationWindow: BrowserWindow,
	thumb,
	windowPath,
	soundPath,
	timeTrackerWindow
) {
	const soundCamera = soundPath;
	const sizes = screen.getPrimaryDisplay().size;
	const appSetting = LocalStore.getStore('appSetting');
	// preparing show screenshot
	const screenCaptureWindow = {
		width: 310,
		height: 170,
		frame: false,
		webPreferences: {
			nodeIntegration: true,
			webSecurity: false,
			contextIsolation: false,
			//nativeWindowOpen: false,
		},
	};

	notificationWindow = new BrowserWindow({
		...screenCaptureWindow,
		x: sizes.width - (screenCaptureWindow.width + 15),
		y: 0 + 15,
	});

	console.log('App Name:', app.getName());
	global.variableGlobal.screenshotSrc = `data:image/png;base64, ${thumb.img}`;
	const urlpath = url.format({
		pathname:
			app.getName() !== 'gauzy-desktop-timer'
				? windowPath.screenshotWindow
				: windowPath.timeTrackerUi,
		protocol: 'file:',
		slashes: true,
		hash: '/screen-capture',
	});
	notificationWindow.loadURL(urlpath);
	remoteMain.enable(notificationWindow.webContents);
	// notificationWindow.webContents.toggleDevTools();
	notificationWindow.setMenu(null);
	notificationWindow.hide();
	notificationWindow.setVisibleOnAllWorkspaces(true, {
		visibleOnFullScreen: true,
		skipTransformProcessType: true,
	});
	notificationWindow.on('show', () => {
		setTimeout(() => {
			notificationWindow.focus();
		}, 200);
	});

	setTimeout(() => {
		notificationWindow.show();
		notificationWindow.webContents.send('show_popup_screen_capture', {
			note: LocalStore.beforeRequestParams().note,
		});
	}, 1000);
	setTimeout(() => {
		timeTrackerWindow.webContents.send('last_capture_local', {
			fullUrl: `data:image/png;base64, ${thumb.img}`,
		});
		try {
			if (
				existsSync(soundCamera) &&
				appSetting &&
				!appSetting.mutedNotification
			) {
				timeTrackerWindow.webContents.send('play_sound', {
					soundFile: soundCamera,
				});
			}
		} catch (err) {
			console.error('sound camera not found');
		}
	}, 1000);
	setTimeout(() => {
		notificationWindow.close();
	}, 4000);
}

function allowScreenshotCapture(): boolean {
	const auth = LocalStore.getStore('auth');
	return auth && auth.allowScreenshotCapture;
}
