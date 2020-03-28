const fs = require('fs');
const configPath = './.runtimeconfig.json';

if (!(configPath && fs.existsSync(configPath))) {
  throw new Error('Please create a .runtimeconfig.json file');
}

const collectConfigLines = (o, propPath, configLines) => {
  propPath = propPath || '';
  configLines = configLines || [];
  for (const key of Object.keys(o)) {
    const newPropPath = propPath + key;
    if (typeof o[key] === 'object') {
      collectConfigLines(o[key], newPropPath + '.', configLines);
    } else if (o[key] != null && o[key] !== '') {
      configLines.push(`${newPropPath}=${JSON.stringify(o[key])}`);
    }
  }
};

const config = require(configPath);
const configLines = [];
collectConfigLines(config, '', configLines);

const cp = require('child_process');
cp.execSync(`firebase functions:config:set ${configLines.join(' ')}`);
