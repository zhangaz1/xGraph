console.log(process.env.NODE_PATH, typeof process.env.NODE_PATH);
if (!(process.env.NODE_PATH == './node_modules')) {
	const { spawn } = require('child_process');

	console.log("try again with node path set");

	let sp = spawn(process.argv[0], process.argv.slice(1), { env: { NODE_PATH: `${cwd}/node_modules` } });

	sp.stdout.on('data', (data) => {
		console.log(`stdout: ${data}`);
	});

	sp.stderr.on('data', (data) => {
		console.log(`stderr: ${data}`);
	});

	sp.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
	});
}


const { execSync } = require('child_process');
const tar = require('targz');
const fs = require('fs');
const mergedirs = require('merge-dirs').default;



// #ifdef LINUX
let system = 'linux';
let linux = true;
let windows = false;
let mac = false;
let unix = true;
// #endif
// #ifdef MAC
let system = 'macOS';
let linux = false;
let windows = false;
let mac = true;
let unix = true;
// #endif
// #ifdef WINDOWS
let system = 'windows';
let linux = false;
let windows = true;
let mac = false;
let unix = false;
// #endif

let pathOverrides = {};

// $genesis $load('./Nexus/Nexus/Genesis2.js')

let cwd = (process.cwd());
let bindir = process.argv[0].substr(0, process.argv[0].lastIndexOf('/'));

if (process.argv.length == 1) process.argv[1] = 'help';

processSwitches();


switch (process.argv[1]) {
	case 'r':
	case 'run': {
		run();
		break;
	}

	case 'rr':
	case 'reset': {
		reset();
		break;
	}

	case 'c':
	case 'compile': {
		compile();
		break;
	}

	case 'd':
	case 'deploy': {
		deploy();
		break;
	}

	case 'help':
	case '--help': {
		help();
		break;
	}
	case 'g':
	case 'init': {
		init(process.argv.slice(2));
		break;
	}
	default: {
		console.log(`unknown command <${process.argv[1]}>`);
		help();
		break;
	}
}

async function init(args) {
	console.log('init System');
	console.log('[', ...args, ']');

}

function help() {
	console.log(`
  xGraph
  Introspective Systems LLC

    Commands:
      help: displays this help screen.
      run: Starts a system from config or cache
        Example: xgraph run --config config.json
                 xgraph run --cache cache/
        
  `);
}

async function reset() {
	try {
		await ensureNode();
		await genesis();
		startNexusProcess();
	} catch (e) {
		console.log(`ERR: ${e}`);
	}
}

async function deploy() {
	try {
		await ensureNode();
		startNexusProcess();


	} catch (e) {
		console.log(`ERR: ${e}`);
	}
}

async function run() {
	try {
		await ensureNode();
		if (fs.lstatSync(pathOverrides['cache'] || 'cache').isDirectory()) {
			startNexusProcess();
		} else {
			await genesis();
			startNexusProcess();
		}
	} catch (e) {
		console.log(`ERR: ${e}`);
	}
}

async function compile() {
	try {
		await ensureNode();
		await genesis();
	} catch (e) {
		console.log(`ERR: ${e}`);
	}
}


function startNexusProcess() {

	process.env.NODE_PATH = "node_modules/";
	const { spawn } = require('child_process');
	console.log(`\nNexus Path: ${bindir.substr(0, bindir.lastIndexOf('/'))}/lib/Nexus/Nexus.js`);
	const ls = spawn("node", [`${bindir.substr(0, bindir.lastIndexOf('/'))}/lib/Nexus/Nexus.js`, ...process.argv], { env: process.env });
	ls.stdout.on('data', _=> process.stdout.write(_));
	ls.stderr.on('data', _=> process.stderr.write(_));

	ls.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
	});
}


async function ensureNode() {
	// #ifdef LINUX
	let node = (execSync('which node').toString());

	if (node != '') {
		console.log();
		// fun(true);
		return;
	} else {
		await install();
	}
	// #else
	console.error(`System ${system} is not yet supported`);
	// #endif
}

function install() {
	return new Promise((resolve) => {
		// #ifdef LINUX
		require('https').get({
			host: 'nodejs.org',
			path: '/dist/v8.4.0/node-v8.4.0-linux-x64.tar.gz'
		}, (response) => {
			let body = '';
			response.pipe(fs.createWriteStream(bindir + '/node.tar.gz'));
			response.on('end', function () {
				// console.log('extraction time!');
				tar.decompress({
					src: bindir + '/node.tar.gz',
					dest: bindir
				}, function () {
					// console.log(mergedirs);
					try {
						mergedirs('node-v8.4.0-linux-x64/bin', '/usr/bin', 'overwrite');
						mergedirs('node-v8.4.0-linux-x64/include', '/usr/include', 'overwrite');
						mergedirs('node-v8.4.0-linux-x64/lib', '/usr/lib', 'overwrite');
						mergedirs('node-v8.4.0-linux-x64/share', '/usr/share', 'overwrite');
						//TODO RIMRAF THE ZIP AND EXTRACTED FILES
						// console.log('dun');
						resolve();
					} catch (e) {
						console.log('Could not install node, try running the command again with sudo\n');
						console.log("If the problem persists, email support@introspectivesystems.com");
						console.log('with this ' + e.toString());
						process.exit(1);
						resolve();
					}
				});
			});
		});
		// #else
		console.error(`System ${system} is not yet supported`);
		//node-msi.fetch.start

		// #endif
	});
}

function processSwitches() {
	for (let i = 0; i < process.argv.length; i++) {
		let str = process.argv[i];
		if (str.startsWith('--')) {
			let key = process.argv[i].slice(2);
			applySwitch(key, i);
		}
	}
}

function applySwitch(str, i) {
	let val = null;
	if ((i + 1) in process.argv) { // switch has a value
		val = process.argv[i + 1];
	}
	pathOverrides[str] = val;
}











// -------------------------------------------------------------
//                       templating stuff
// -------------------------------------------------------------

let launchConfigBase = {
	version: "0.2.0",
	configurations: []
};
let config = (repo, system) => {
	return {
		name: system,
		type: "node",
		request: "launch",
		cwd: `\${workspaceRoot}/Systems/${system}`,
		program: '${workspaceRoot}/../xGraph/Nexus/Nexus/Nexus.js',
		args: [
			"xGraph=${workspaceRoot}/../xGraph",
			`${repo}=\${workspaceRoot}`,
			"development=true"
		],
		env: {
			NODE_PATH: "node_modules"
		}
	}
};

function initSystem() {

}

function initModule() {

}

function initView() {

}