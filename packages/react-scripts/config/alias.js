'use strict';

const path = require('path');
const fs = require('fs');
const paths = require('./paths');
const appPackageJson = require(paths.appPackageJson);
const definedAliases = appPackageJson.alias || {};
const appDirectory = fs.realpathSync(process.cwd());

Object.keys(definedAliases).forEach(key=> {
    definedAliases[key] = path.resolve(path.join(appDirectory, definedAliases[key]));
})

module.exports = definedAliases;