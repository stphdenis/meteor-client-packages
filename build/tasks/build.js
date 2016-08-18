'use strict';

const fs = require('fs-extra');
const gulp = require('gulp');
const insert = require('gulp-insert');
const execSync = require('child_process').execSync;
const runSequence = require('run-sequence');
const paths = require('../paths');

function fsExistsSync(filePath) {
  try {
    fs.accessSync(filePath, fs.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

function execToConsole(command, option) {
  console.info(execSync(command, option).toString()); // eslint-disable-line no-console
}

gulp.task('create-meteor-output', function() {
  let starJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
  if (fsExistsSync('./__output__') && (!starJson || starJson.meteorRelease !== `METEOR@${paths.meteorVersion}`)) {
    fs.removeSync('./__output__');
  }
  if (fsExistsSync('./__output__') === false) {
    if (fsExistsSync('./__meteor__') === false) {
      execToConsole(`meteor --release METEOR@${paths.meteorVersion} create __meteor__`);
    }
    fs.copySync('./__src__/packages', './__meteor__/.meteor/packages');
    execToConsole(`meteor --release METEOR@${paths.meteorVersion} build --debug ../__output__ --directory`, {
      cwd: './__meteor__',
    });
  }
});

gulp.task('create-packages', ['clean-packages'], function() {
  const modules = paths.modules;
  for (let moduleName in modules) {
    const module = modules[moduleName];

    const moduleDeps = module.dependencies || [];
    const moduleGlobalScope = module['global-scope'] || [];

    let indexJsString = '\'use strict\';\n';
    for (let moduleDep in moduleDeps) {
      indexJsString += `require( 'meteor/${moduleDeps[moduleDep]}');\n`;
    }
    if (moduleName === 'meteor') {
      indexJsString += `require( 'meteor-client-packages/meteor-runtime-config');\n`;
    }
    indexJsString += `require( '../__lib__/${moduleName}');
var pkg = Package['${moduleName}'];
for(var key in pkg) {
  exports[key] = pkg[key];
}
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = pkg[0];
`;
    if (moduleGlobalScope.length) {
      indexJsString += `if(__meteor_runtime_config__.PUBLIC_SETTINGS.__global_scope__) {\n`;
      moduleGlobalScope.forEach(globalName => {indexJsString += `  globals.${globalName} = pkg.${globalName};\n`;});
      indexJsString += `}\n`;
    }

    fs.mkdirSync(`${moduleName}`);
    fs.writeFileSync(`${moduleName}/index.js`, indexJsString);
  }
  fs.mkdirSync('./__lib__');
  return gulp.src(['__src__/meteor-version.json',
    '__output__/bundle/programs/web.browser/packages/**/*.*',
  ])
    .pipe(gulp.dest('__lib__'));
});

gulp.task('create-easy-webpack', function() {
/*  let easyWebpack = `'use strict';
module.exports = function meteorClientModules() {
  return function meteorClientModules() {
    return {
      resolve: {
        alias: {
`;
  for (let moduleName in paths.modules) {
    easyWebpack += `          'meteor/${moduleName}': 'meteor-client-packages-meteor/${moduleName}',\n`;
  }
  easyWebpack += `        },
      },
    };
  };
};
`;
  fs.writeFileSync('./easy-webpack.js', easyWebpack);*/
});

// Replace meteorVersion 'X.Y' by 'X.Y.0'
// Replace meteorVersion 'X.Y.Z' by 'X.Y.Z'
// Replace meteorVersion 'X.Y.Z-W' by 'X.Y.Z-W'
// Replace package.version 'X.Y.Z' by 'meteorVersion'
// Replace package.version 'X.Y.Z-0-rc.A.B.C' by 'meteorVersion-rc.A.B.C'
// Replace package.version 'X.Y.Z-W-rc.A.B.C' by 'meteorVersion-rc.A.B.C'
gulp.task('modify-package', function() {
  return gulp.src('package.json')
    .pipe(insert.transform(function(contents) {
      const packageJson = JSON.parse(contents);
      packageJson.version = paths.packageVersion;
      return JSON.stringify(packageJson, undefined, 2);
    }))
    .pipe(gulp.dest('.'));
});

gulp.task('create-all', function(callback) {
  return runSequence(
    'create-meteor-output',
    'create-packages',
    'create-easy-webpack',
    'modify-package',
    callback
  );
});
