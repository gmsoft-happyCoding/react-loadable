(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('react')) :
typeof define === 'function' && define.amd ? define(['react'], factory) :
(global.ReactLoadable = factory(global.React));
}(this, (function (react) { 'use strict';

react = react && react.hasOwnProperty('default') ? react['default'] : react;

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

var assertThisInitialized = _assertThisInitialized;

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

var inheritsLoose = _inheritsLoose;

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x.default : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var src = createCommonjsModule(function (module) {

  var ALL_INITIALIZERS = [];
  var READY_INITIALIZERS = [];

  function isWebpackReady(getModuleIds) {
    if (typeof __webpack_modules__ !== "object") {
      return false;
    }

    return getModuleIds().every(function (moduleId) {
      return typeof moduleId !== "undefined" && typeof __webpack_modules__[moduleId] !== "undefined";
    });
  }

  function load(loader) {
    var promise = loader();
    var state = {
      loading: true,
      loaded: null,
      error: null
    };
    state.promise = promise.then(function (loaded) {
      state.loading = false;
      state.loaded = loaded;
      return loaded;
    }).catch(function (err) {
      state.loading = false;
      state.error = err;
      throw err;
    });
    return state;
  }

  function loadMap(obj) {
    var state = {
      loading: false,
      loaded: {},
      error: null
    };
    var promises = [];

    try {
      Object.keys(obj).forEach(function (key) {
        var result = load(obj[key]);

        if (!result.loading) {
          state.loaded[key] = result.loaded;
          state.error = result.error;
        } else {
          state.loading = true;
        }

        promises.push(result.promise);
        result.promise.then(function (res) {
          state.loaded[key] = res;
        }).catch(function (err) {
          state.error = err;
        });
      });
    } catch (err) {
      state.error = err;
    }

    state.promise = Promise.all(promises).then(function (res) {
      state.loading = false;
      return res;
    }).catch(function (err) {
      state.loading = false;
      throw err;
    });
    return state;
  }

  function resolve(obj) {
    return obj && obj.__esModule ? obj.default : obj;
  }

  function render(loaded, props) {
    return react.createElement(resolve(loaded), props);
  }

  function createLoadableComponent(loadFn, options) {
    if (!options.loading) {
      throw new Error("react-loadable requires a `loading` component");
    }

    var opts = Object.assign({
      loader: null,
      loading: null,
      delay: 200,
      timeout: null,
      render: render,
      webpack: null,
      modules: null
    }, options);
    var res = null;

    function init() {
      if (!res) {
        res = loadFn(opts.loader);
      }

      return res.promise;
    }

    ALL_INITIALIZERS.push(init);

    if (typeof opts.webpack === "function") {
      READY_INITIALIZERS.push(function () {
        if (isWebpackReady(opts.webpack)) {
          return init();
        }
      });
    }

    return (
      /*#__PURE__*/
      function (_React$Component) {
        inheritsLoose(LoadableComponent, _React$Component);

        function LoadableComponent(props) {
          var _this;

          _this = _React$Component.call(this, props) || this;
          _this.retry = _this.retry.bind(assertThisInitialized(_this));
          init();
          _this.state = {
            error: res.error,
            pastDelay: false,
            timedOut: false,
            loading: res.loading,
            loaded: res.loaded
          };
          return _this;
        }

        LoadableComponent.preload = function preload() {
          return init();
        };

        var _proto = LoadableComponent.prototype;

        _proto.componentWillMount = function componentWillMount() {
          this._mounted = true;

          this._loadModule();
        };

        _proto._loadModule = function _loadModule() {
          var _this2 = this;

          if (this.context.loadable && Array.isArray(opts.modules)) {
            opts.modules.forEach(function (moduleName) {
              _this2.context.loadable.report(moduleName);
            });
          }

          if (!res.loading) {
            return;
          }

          if (typeof opts.delay === "number") {
            if (opts.delay === 0) {
              this.setState({
                pastDelay: true
              });
            } else {
              this._delay = setTimeout(function () {
                _this2.setState({
                  pastDelay: true
                });
              }, opts.delay);
            }
          }

          if (typeof opts.timeout === "number") {
            this._timeout = setTimeout(function () {
              _this2.setState({
                timedOut: true
              });
            }, opts.timeout);
          }

          var update = function update() {
            if (!_this2._mounted) {
              return;
            }

            _this2.setState({
              error: res.error,
              loaded: res.loaded,
              loading: res.loading
            });

            _this2._clearTimeouts();
          };

          res.promise.then(function () {
            update();
          }).catch(function (err) {
            update();
          });
        };

        _proto.componentWillUnmount = function componentWillUnmount() {
          this._mounted = false;

          this._clearTimeouts();
        };

        _proto._clearTimeouts = function _clearTimeouts() {
          clearTimeout(this._delay);
          clearTimeout(this._timeout);
        };

        _proto.retry = function retry() {
          this.setState({
            error: null,
            loading: true,
            timedOut: false
          });
          res = loadFn(opts.loader);

          this._loadModule();
        };

        _proto.render = function render() {
          if (this.state.loading || this.state.error) {
            return react.createElement(opts.loading, {
              isLoading: this.state.loading,
              pastDelay: this.state.pastDelay,
              timedOut: this.state.timedOut,
              error: this.state.error,
              retry: this.retry
            });
          } else if (this.state.loaded) {
            return opts.render(this.state.loaded, this.props);
          } else {
            return null;
          }
        };

        return LoadableComponent;
      }(react.Component)
    );
  }

  function Loadable(opts) {
    return createLoadableComponent(load, opts);
  }

  function LoadableMap(opts) {
    if (typeof opts.render !== "function") {
      throw new Error("LoadableMap requires a `render(loaded, props)` function");
    }

    return createLoadableComponent(loadMap, opts);
  }

  Loadable.Map = LoadableMap;

  var Capture =
  /*#__PURE__*/
  function (_React$Component2) {
    inheritsLoose(Capture, _React$Component2);

    function Capture() {
      return _React$Component2.apply(this, arguments) || this;
    }

    var _proto2 = Capture.prototype;

    _proto2.getChildContext = function getChildContext() {
      return {
        loadable: {
          report: this.props.report
        }
      };
    };

    _proto2.render = function render() {
      return react.Children.only(this.props.children);
    };

    return Capture;
  }(react.Component);

  Loadable.Capture = Capture;

  function flushInitializers(initializers) {
    var promises = [];

    while (initializers.length) {
      var init = initializers.pop();
      promises.push(init());
    }

    return Promise.all(promises).then(function () {
      if (initializers.length) {
        return flushInitializers(initializers);
      }
    });
  }

  Loadable.preloadAll = function () {
    return new Promise(function (resolve, reject) {
      flushInitializers(ALL_INITIALIZERS).then(resolve, reject);
    });
  };

  Loadable.preloadReady = function () {
    return new Promise(function (resolve, reject) {
      // We always will resolve, errors should be handled within loading UIs.
      flushInitializers(READY_INITIALIZERS).then(resolve, resolve);
    });
  };

  module.exports = Loadable;
});
var index = unwrapExports(src);

return index;

})));
//# sourceMappingURL=react-loadable.js.map
