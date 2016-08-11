'use strict';
const fs = require('fs');
const path = require('path');

function jsonFile(relativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(__dirname, relativePath)));
}

module.exports = function meteorClientModules(options) {
  options = options || {};
  options.absoluteNodeModulesPath = options.absoluteNodeModulesPath || false;
  options.rootDir = options.rootDir || path.resolve();

  return function meteorClientModules() {

    function makeAliases() {
      const alias = {};

      for (let npmPackageName of fs.readdirSync(path.resolve(__dirname, '../..'))) {
        if(npmPackageName.startsWith('meteor-client-packages-')) {
          const meteorVersion = jsonFile(`../../${npmPackageName}/__src__/meteor-version.json`).version;
          const meteorPackages = jsonFile(`../../${npmPackageName}/__src__/meteor-packages-${meteorVersion}.json`).modules;
          for (let meteorPackageName in meteorPackages) {
            alias[`meteor/${meteorPackageName}`] = `${npmPackageName}/${meteorPackageName}`;
          }
        }
      }
      return alias;
    }

    function makeModules(config) {
      const modules = [];

      for(let module of config.resolve.modules) {
        if(module === 'node_modules') {
          modules.push('node_modules');
          modules.push(path.resolve(options.rootDir, module));
        } else {
          modules.push(module);
        }
      }
      return modules;
    }

    return {
      resolve: {
        alias: makeAliases(),
        modules: makeModules(this),
      },
    };
  };
};
