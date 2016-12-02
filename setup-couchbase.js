const execa = require('execa');

checkDockerIsInstalled();
killAllContainers();

launchContainer('couchbase', 'mastilver/couchbase', [
    8091,
    8092,
    11207,
    11210,
    11211,
    18091,
    18092,
    4369
], {});

/*  -----  */

function killAllContainers() {
    execa.sync('docker', ['ps', '-a', '-q']).output[1]
        .split('\n')
        .filter(x => x !== '')
        .forEach(hash => execute('docker', ['rm', '-f', hash]));
}

function launchContainer(name, image, ports, volumes) {
    execute('docker', ['pull', image]);

    const args = ['run', '-d'];

    Object.keys(volumes).forEach(localPath => {
        const containerPath = volumes[localPath];
        args.push('-v', `${localPath}:${containerPath}`);
    });

    ports.forEach(port => {
        args.push('-p', `${port}:${port}`);
    });

    args.push('--name', name);

    args.push(image);

    execute('docker', args);
}

function checkDockerIsInstalled() {
    execute('docker', ['version']);
}

function execute() {
    const args = Array.from(arguments);
    const result = execa.sync.apply(this, args);

    if (result.stderr !== '') {
        throw new Error(result.stderr);
    }

    return result;
}
