(function() {
  var _ = Package['underscore']._;
  var config = this.__meteor_runtime_config__ || {};

  try {
    var meteorRuntimeConfig = require('../../../meteor-runtime-config').__meteor_runtime_config__ || {};
    config = _.defaults({}, config, meteorRuntimeConfig);
  } catch (e) {
    console.warn('Make a meteor-runtime-config.js file at the root of your package to make this message disapear :');
    console.warn('have to contain ==> export const __meteor_runtime_config__ = {}');
  }

  __meteor_runtime_config__ = _.defaults({}, config, {
    meteorEnv: {},
    DDP_DEFAULT_CONNECTION_URL: 'http://localhost:3000',
    PUBLIC_SETTINGS: { __global_scope__: false }
  });

  (function(window) {
    if (window !== undefined && window.globals === undefined) {
      window.globals = window;
    }
  }( (1, eval)('this') ));
}).call(this);
