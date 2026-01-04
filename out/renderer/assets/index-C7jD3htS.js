function getDefaultExportFromCjs(x2) {
  return x2 && x2.__esModule && Object.prototype.hasOwnProperty.call(x2, "default") ? x2["default"] : x2;
}
var jsxRuntime = { exports: {} };
var reactJsxRuntime_production_min = {};
var react = { exports: {} };
var react_production_min = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var l$1 = Symbol.for("react.element"), n$1 = Symbol.for("react.portal"), p$2 = Symbol.for("react.fragment"), q$1 = Symbol.for("react.strict_mode"), r = Symbol.for("react.profiler"), t = Symbol.for("react.provider"), u = Symbol.for("react.context"), v$1 = Symbol.for("react.forward_ref"), w = Symbol.for("react.suspense"), x = Symbol.for("react.memo"), y = Symbol.for("react.lazy"), z$1 = Symbol.iterator;
function A$1(a) {
  if (null === a || "object" !== typeof a) return null;
  a = z$1 && a[z$1] || a["@@iterator"];
  return "function" === typeof a ? a : null;
}
var B$1 = { isMounted: function() {
  return false;
}, enqueueForceUpdate: function() {
}, enqueueReplaceState: function() {
}, enqueueSetState: function() {
} }, C$1 = Object.assign, D$1 = {};
function E$1(a, b, e) {
  this.props = a;
  this.context = b;
  this.refs = D$1;
  this.updater = e || B$1;
}
E$1.prototype.isReactComponent = {};
E$1.prototype.setState = function(a, b) {
  if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
  this.updater.enqueueSetState(this, a, b, "setState");
};
E$1.prototype.forceUpdate = function(a) {
  this.updater.enqueueForceUpdate(this, a, "forceUpdate");
};
function F() {
}
F.prototype = E$1.prototype;
function G$1(a, b, e) {
  this.props = a;
  this.context = b;
  this.refs = D$1;
  this.updater = e || B$1;
}
var H$1 = G$1.prototype = new F();
H$1.constructor = G$1;
C$1(H$1, E$1.prototype);
H$1.isPureReactComponent = true;
var I$1 = Array.isArray, J = Object.prototype.hasOwnProperty, K$1 = { current: null }, L$1 = { key: true, ref: true, __self: true, __source: true };
function M$1(a, b, e) {
  var d, c = {}, k2 = null, h = null;
  if (null != b) for (d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k2 = "" + b.key), b) J.call(b, d) && !L$1.hasOwnProperty(d) && (c[d] = b[d]);
  var g = arguments.length - 2;
  if (1 === g) c.children = e;
  else if (1 < g) {
    for (var f2 = Array(g), m2 = 0; m2 < g; m2++) f2[m2] = arguments[m2 + 2];
    c.children = f2;
  }
  if (a && a.defaultProps) for (d in g = a.defaultProps, g) void 0 === c[d] && (c[d] = g[d]);
  return { $$typeof: l$1, type: a, key: k2, ref: h, props: c, _owner: K$1.current };
}
function N$1(a, b) {
  return { $$typeof: l$1, type: a.type, key: b, ref: a.ref, props: a.props, _owner: a._owner };
}
function O$1(a) {
  return "object" === typeof a && null !== a && a.$$typeof === l$1;
}
function escape(a) {
  var b = { "=": "=0", ":": "=2" };
  return "$" + a.replace(/[=:]/g, function(a2) {
    return b[a2];
  });
}
var P$1 = /\/+/g;
function Q$1(a, b) {
  return "object" === typeof a && null !== a && null != a.key ? escape("" + a.key) : b.toString(36);
}
function R$1(a, b, e, d, c) {
  var k2 = typeof a;
  if ("undefined" === k2 || "boolean" === k2) a = null;
  var h = false;
  if (null === a) h = true;
  else switch (k2) {
    case "string":
    case "number":
      h = true;
      break;
    case "object":
      switch (a.$$typeof) {
        case l$1:
        case n$1:
          h = true;
      }
  }
  if (h) return h = a, c = c(h), a = "" === d ? "." + Q$1(h, 0) : d, I$1(c) ? (e = "", null != a && (e = a.replace(P$1, "$&/") + "/"), R$1(c, b, e, "", function(a2) {
    return a2;
  })) : null != c && (O$1(c) && (c = N$1(c, e + (!c.key || h && h.key === c.key ? "" : ("" + c.key).replace(P$1, "$&/") + "/") + a)), b.push(c)), 1;
  h = 0;
  d = "" === d ? "." : d + ":";
  if (I$1(a)) for (var g = 0; g < a.length; g++) {
    k2 = a[g];
    var f2 = d + Q$1(k2, g);
    h += R$1(k2, b, e, f2, c);
  }
  else if (f2 = A$1(a), "function" === typeof f2) for (a = f2.call(a), g = 0; !(k2 = a.next()).done; ) k2 = k2.value, f2 = d + Q$1(k2, g++), h += R$1(k2, b, e, f2, c);
  else if ("object" === k2) throw b = String(a), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
  return h;
}
function S$1(a, b, e) {
  if (null == a) return a;
  var d = [], c = 0;
  R$1(a, d, "", "", function(a2) {
    return b.call(e, a2, c++);
  });
  return d;
}
function T$1(a) {
  if (-1 === a._status) {
    var b = a._result;
    b = b();
    b.then(function(b2) {
      if (0 === a._status || -1 === a._status) a._status = 1, a._result = b2;
    }, function(b2) {
      if (0 === a._status || -1 === a._status) a._status = 2, a._result = b2;
    });
    -1 === a._status && (a._status = 0, a._result = b);
  }
  if (1 === a._status) return a._result.default;
  throw a._result;
}
var U$1 = { current: null }, V$1 = { transition: null }, W$1 = { ReactCurrentDispatcher: U$1, ReactCurrentBatchConfig: V$1, ReactCurrentOwner: K$1 };
function X$1() {
  throw Error("act(...) is not supported in production builds of React.");
}
react_production_min.Children = { map: S$1, forEach: function(a, b, e) {
  S$1(a, function() {
    b.apply(this, arguments);
  }, e);
}, count: function(a) {
  var b = 0;
  S$1(a, function() {
    b++;
  });
  return b;
}, toArray: function(a) {
  return S$1(a, function(a2) {
    return a2;
  }) || [];
}, only: function(a) {
  if (!O$1(a)) throw Error("React.Children.only expected to receive a single React element child.");
  return a;
} };
react_production_min.Component = E$1;
react_production_min.Fragment = p$2;
react_production_min.Profiler = r;
react_production_min.PureComponent = G$1;
react_production_min.StrictMode = q$1;
react_production_min.Suspense = w;
react_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W$1;
react_production_min.act = X$1;
react_production_min.cloneElement = function(a, b, e) {
  if (null === a || void 0 === a) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
  var d = C$1({}, a.props), c = a.key, k2 = a.ref, h = a._owner;
  if (null != b) {
    void 0 !== b.ref && (k2 = b.ref, h = K$1.current);
    void 0 !== b.key && (c = "" + b.key);
    if (a.type && a.type.defaultProps) var g = a.type.defaultProps;
    for (f2 in b) J.call(b, f2) && !L$1.hasOwnProperty(f2) && (d[f2] = void 0 === b[f2] && void 0 !== g ? g[f2] : b[f2]);
  }
  var f2 = arguments.length - 2;
  if (1 === f2) d.children = e;
  else if (1 < f2) {
    g = Array(f2);
    for (var m2 = 0; m2 < f2; m2++) g[m2] = arguments[m2 + 2];
    d.children = g;
  }
  return { $$typeof: l$1, type: a.type, key: c, ref: k2, props: d, _owner: h };
};
react_production_min.createContext = function(a) {
  a = { $$typeof: u, _currentValue: a, _currentValue2: a, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null };
  a.Provider = { $$typeof: t, _context: a };
  return a.Consumer = a;
};
react_production_min.createElement = M$1;
react_production_min.createFactory = function(a) {
  var b = M$1.bind(null, a);
  b.type = a;
  return b;
};
react_production_min.createRef = function() {
  return { current: null };
};
react_production_min.forwardRef = function(a) {
  return { $$typeof: v$1, render: a };
};
react_production_min.isValidElement = O$1;
react_production_min.lazy = function(a) {
  return { $$typeof: y, _payload: { _status: -1, _result: a }, _init: T$1 };
};
react_production_min.memo = function(a, b) {
  return { $$typeof: x, type: a, compare: void 0 === b ? null : b };
};
react_production_min.startTransition = function(a) {
  var b = V$1.transition;
  V$1.transition = {};
  try {
    a();
  } finally {
    V$1.transition = b;
  }
};
react_production_min.unstable_act = X$1;
react_production_min.useCallback = function(a, b) {
  return U$1.current.useCallback(a, b);
};
react_production_min.useContext = function(a) {
  return U$1.current.useContext(a);
};
react_production_min.useDebugValue = function() {
};
react_production_min.useDeferredValue = function(a) {
  return U$1.current.useDeferredValue(a);
};
react_production_min.useEffect = function(a, b) {
  return U$1.current.useEffect(a, b);
};
react_production_min.useId = function() {
  return U$1.current.useId();
};
react_production_min.useImperativeHandle = function(a, b, e) {
  return U$1.current.useImperativeHandle(a, b, e);
};
react_production_min.useInsertionEffect = function(a, b) {
  return U$1.current.useInsertionEffect(a, b);
};
react_production_min.useLayoutEffect = function(a, b) {
  return U$1.current.useLayoutEffect(a, b);
};
react_production_min.useMemo = function(a, b) {
  return U$1.current.useMemo(a, b);
};
react_production_min.useReducer = function(a, b, e) {
  return U$1.current.useReducer(a, b, e);
};
react_production_min.useRef = function(a) {
  return U$1.current.useRef(a);
};
react_production_min.useState = function(a) {
  return U$1.current.useState(a);
};
react_production_min.useSyncExternalStore = function(a, b, e) {
  return U$1.current.useSyncExternalStore(a, b, e);
};
react_production_min.useTransition = function() {
  return U$1.current.useTransition();
};
react_production_min.version = "18.3.1";
{
  react.exports = react_production_min;
}
var reactExports = react.exports;
const React$2 = /* @__PURE__ */ getDefaultExportFromCjs(reactExports);
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var f = reactExports, k = Symbol.for("react.element"), l = Symbol.for("react.fragment"), m$1 = Object.prototype.hasOwnProperty, n = f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, p$1 = { key: true, ref: true, __self: true, __source: true };
function q(c, a, g) {
  var b, d = {}, e = null, h = null;
  void 0 !== g && (e = "" + g);
  void 0 !== a.key && (e = "" + a.key);
  void 0 !== a.ref && (h = a.ref);
  for (b in a) m$1.call(a, b) && !p$1.hasOwnProperty(b) && (d[b] = a[b]);
  if (c && c.defaultProps) for (b in a = c.defaultProps, a) void 0 === d[b] && (d[b] = a[b]);
  return { $$typeof: k, type: c, key: e, ref: h, props: d, _owner: n.current };
}
reactJsxRuntime_production_min.Fragment = l;
reactJsxRuntime_production_min.jsx = q;
reactJsxRuntime_production_min.jsxs = q;
{
  jsxRuntime.exports = reactJsxRuntime_production_min;
}
var jsxRuntimeExports = jsxRuntime.exports;
var client = {};
var reactDom = { exports: {} };
var reactDom_production_min = {};
var scheduler = { exports: {} };
var scheduler_production_min = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function(exports$1) {
  function f2(a, b) {
    var c = a.length;
    a.push(b);
    a: for (; 0 < c; ) {
      var d = c - 1 >>> 1, e = a[d];
      if (0 < g(e, b)) a[d] = b, a[c] = e, c = d;
      else break a;
    }
  }
  function h(a) {
    return 0 === a.length ? null : a[0];
  }
  function k2(a) {
    if (0 === a.length) return null;
    var b = a[0], c = a.pop();
    if (c !== b) {
      a[0] = c;
      a: for (var d = 0, e = a.length, w2 = e >>> 1; d < w2; ) {
        var m2 = 2 * (d + 1) - 1, C2 = a[m2], n2 = m2 + 1, x2 = a[n2];
        if (0 > g(C2, c)) n2 < e && 0 > g(x2, C2) ? (a[d] = x2, a[n2] = c, d = n2) : (a[d] = C2, a[m2] = c, d = m2);
        else if (n2 < e && 0 > g(x2, c)) a[d] = x2, a[n2] = c, d = n2;
        else break a;
      }
    }
    return b;
  }
  function g(a, b) {
    var c = a.sortIndex - b.sortIndex;
    return 0 !== c ? c : a.id - b.id;
  }
  if ("object" === typeof performance && "function" === typeof performance.now) {
    var l2 = performance;
    exports$1.unstable_now = function() {
      return l2.now();
    };
  } else {
    var p2 = Date, q2 = p2.now();
    exports$1.unstable_now = function() {
      return p2.now() - q2;
    };
  }
  var r2 = [], t2 = [], u2 = 1, v2 = null, y2 = 3, z2 = false, A2 = false, B2 = false, D2 = "function" === typeof setTimeout ? setTimeout : null, E2 = "function" === typeof clearTimeout ? clearTimeout : null, F2 = "undefined" !== typeof setImmediate ? setImmediate : null;
  "undefined" !== typeof navigator && void 0 !== navigator.scheduling && void 0 !== navigator.scheduling.isInputPending && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function G2(a) {
    for (var b = h(t2); null !== b; ) {
      if (null === b.callback) k2(t2);
      else if (b.startTime <= a) k2(t2), b.sortIndex = b.expirationTime, f2(r2, b);
      else break;
      b = h(t2);
    }
  }
  function H2(a) {
    B2 = false;
    G2(a);
    if (!A2) if (null !== h(r2)) A2 = true, I2(J2);
    else {
      var b = h(t2);
      null !== b && K2(H2, b.startTime - a);
    }
  }
  function J2(a, b) {
    A2 = false;
    B2 && (B2 = false, E2(L2), L2 = -1);
    z2 = true;
    var c = y2;
    try {
      G2(b);
      for (v2 = h(r2); null !== v2 && (!(v2.expirationTime > b) || a && !M2()); ) {
        var d = v2.callback;
        if ("function" === typeof d) {
          v2.callback = null;
          y2 = v2.priorityLevel;
          var e = d(v2.expirationTime <= b);
          b = exports$1.unstable_now();
          "function" === typeof e ? v2.callback = e : v2 === h(r2) && k2(r2);
          G2(b);
        } else k2(r2);
        v2 = h(r2);
      }
      if (null !== v2) var w2 = true;
      else {
        var m2 = h(t2);
        null !== m2 && K2(H2, m2.startTime - b);
        w2 = false;
      }
      return w2;
    } finally {
      v2 = null, y2 = c, z2 = false;
    }
  }
  var N2 = false, O2 = null, L2 = -1, P2 = 5, Q2 = -1;
  function M2() {
    return exports$1.unstable_now() - Q2 < P2 ? false : true;
  }
  function R2() {
    if (null !== O2) {
      var a = exports$1.unstable_now();
      Q2 = a;
      var b = true;
      try {
        b = O2(true, a);
      } finally {
        b ? S2() : (N2 = false, O2 = null);
      }
    } else N2 = false;
  }
  var S2;
  if ("function" === typeof F2) S2 = function() {
    F2(R2);
  };
  else if ("undefined" !== typeof MessageChannel) {
    var T2 = new MessageChannel(), U2 = T2.port2;
    T2.port1.onmessage = R2;
    S2 = function() {
      U2.postMessage(null);
    };
  } else S2 = function() {
    D2(R2, 0);
  };
  function I2(a) {
    O2 = a;
    N2 || (N2 = true, S2());
  }
  function K2(a, b) {
    L2 = D2(function() {
      a(exports$1.unstable_now());
    }, b);
  }
  exports$1.unstable_IdlePriority = 5;
  exports$1.unstable_ImmediatePriority = 1;
  exports$1.unstable_LowPriority = 4;
  exports$1.unstable_NormalPriority = 3;
  exports$1.unstable_Profiling = null;
  exports$1.unstable_UserBlockingPriority = 2;
  exports$1.unstable_cancelCallback = function(a) {
    a.callback = null;
  };
  exports$1.unstable_continueExecution = function() {
    A2 || z2 || (A2 = true, I2(J2));
  };
  exports$1.unstable_forceFrameRate = function(a) {
    0 > a || 125 < a ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : P2 = 0 < a ? Math.floor(1e3 / a) : 5;
  };
  exports$1.unstable_getCurrentPriorityLevel = function() {
    return y2;
  };
  exports$1.unstable_getFirstCallbackNode = function() {
    return h(r2);
  };
  exports$1.unstable_next = function(a) {
    switch (y2) {
      case 1:
      case 2:
      case 3:
        var b = 3;
        break;
      default:
        b = y2;
    }
    var c = y2;
    y2 = b;
    try {
      return a();
    } finally {
      y2 = c;
    }
  };
  exports$1.unstable_pauseExecution = function() {
  };
  exports$1.unstable_requestPaint = function() {
  };
  exports$1.unstable_runWithPriority = function(a, b) {
    switch (a) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        a = 3;
    }
    var c = y2;
    y2 = a;
    try {
      return b();
    } finally {
      y2 = c;
    }
  };
  exports$1.unstable_scheduleCallback = function(a, b, c) {
    var d = exports$1.unstable_now();
    "object" === typeof c && null !== c ? (c = c.delay, c = "number" === typeof c && 0 < c ? d + c : d) : c = d;
    switch (a) {
      case 1:
        var e = -1;
        break;
      case 2:
        e = 250;
        break;
      case 5:
        e = 1073741823;
        break;
      case 4:
        e = 1e4;
        break;
      default:
        e = 5e3;
    }
    e = c + e;
    a = { id: u2++, callback: b, priorityLevel: a, startTime: c, expirationTime: e, sortIndex: -1 };
    c > d ? (a.sortIndex = c, f2(t2, a), null === h(r2) && a === h(t2) && (B2 ? (E2(L2), L2 = -1) : B2 = true, K2(H2, c - d))) : (a.sortIndex = e, f2(r2, a), A2 || z2 || (A2 = true, I2(J2)));
    return a;
  };
  exports$1.unstable_shouldYield = M2;
  exports$1.unstable_wrapCallback = function(a) {
    var b = y2;
    return function() {
      var c = y2;
      y2 = b;
      try {
        return a.apply(this, arguments);
      } finally {
        y2 = c;
      }
    };
  };
})(scheduler_production_min);
{
  scheduler.exports = scheduler_production_min;
}
var schedulerExports = scheduler.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var aa = reactExports, ca = schedulerExports;
function p(a) {
  for (var b = "https://reactjs.org/docs/error-decoder.html?invariant=" + a, c = 1; c < arguments.length; c++) b += "&args[]=" + encodeURIComponent(arguments[c]);
  return "Minified React error #" + a + "; visit " + b + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
var da = /* @__PURE__ */ new Set(), ea = {};
function fa(a, b) {
  ha(a, b);
  ha(a + "Capture", b);
}
function ha(a, b) {
  ea[a] = b;
  for (a = 0; a < b.length; a++) da.add(b[a]);
}
var ia = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement), ja = Object.prototype.hasOwnProperty, ka = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, la = {}, ma = {};
function oa(a) {
  if (ja.call(ma, a)) return true;
  if (ja.call(la, a)) return false;
  if (ka.test(a)) return ma[a] = true;
  la[a] = true;
  return false;
}
function pa(a, b, c, d) {
  if (null !== c && 0 === c.type) return false;
  switch (typeof b) {
    case "function":
    case "symbol":
      return true;
    case "boolean":
      if (d) return false;
      if (null !== c) return !c.acceptsBooleans;
      a = a.toLowerCase().slice(0, 5);
      return "data-" !== a && "aria-" !== a;
    default:
      return false;
  }
}
function qa(a, b, c, d) {
  if (null === b || "undefined" === typeof b || pa(a, b, c, d)) return true;
  if (d) return false;
  if (null !== c) switch (c.type) {
    case 3:
      return !b;
    case 4:
      return false === b;
    case 5:
      return isNaN(b);
    case 6:
      return isNaN(b) || 1 > b;
  }
  return false;
}
function v(a, b, c, d, e, f2, g) {
  this.acceptsBooleans = 2 === b || 3 === b || 4 === b;
  this.attributeName = d;
  this.attributeNamespace = e;
  this.mustUseProperty = c;
  this.propertyName = a;
  this.type = b;
  this.sanitizeURL = f2;
  this.removeEmptyString = g;
}
var z = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a) {
  z[a] = new v(a, 0, false, a, null, false, false);
});
[["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(a) {
  var b = a[0];
  z[b] = new v(b, 1, false, a[1], null, false, false);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function(a) {
  z[a] = new v(a, 2, false, a.toLowerCase(), null, false, false);
});
["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(a) {
  z[a] = new v(a, 2, false, a, null, false, false);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a) {
  z[a] = new v(a, 3, false, a.toLowerCase(), null, false, false);
});
["checked", "multiple", "muted", "selected"].forEach(function(a) {
  z[a] = new v(a, 3, true, a, null, false, false);
});
["capture", "download"].forEach(function(a) {
  z[a] = new v(a, 4, false, a, null, false, false);
});
["cols", "rows", "size", "span"].forEach(function(a) {
  z[a] = new v(a, 6, false, a, null, false, false);
});
["rowSpan", "start"].forEach(function(a) {
  z[a] = new v(a, 5, false, a.toLowerCase(), null, false, false);
});
var ra = /[\-:]([a-z])/g;
function sa(a) {
  return a[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a) {
  var b = a.replace(
    ra,
    sa
  );
  z[b] = new v(b, 1, false, a, null, false, false);
});
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a) {
  var b = a.replace(ra, sa);
  z[b] = new v(b, 1, false, a, "http://www.w3.org/1999/xlink", false, false);
});
["xml:base", "xml:lang", "xml:space"].forEach(function(a) {
  var b = a.replace(ra, sa);
  z[b] = new v(b, 1, false, a, "http://www.w3.org/XML/1998/namespace", false, false);
});
["tabIndex", "crossOrigin"].forEach(function(a) {
  z[a] = new v(a, 1, false, a.toLowerCase(), null, false, false);
});
z.xlinkHref = new v("xlinkHref", 1, false, "xlink:href", "http://www.w3.org/1999/xlink", true, false);
["src", "href", "action", "formAction"].forEach(function(a) {
  z[a] = new v(a, 1, false, a.toLowerCase(), null, true, true);
});
function ta(a, b, c, d) {
  var e = z.hasOwnProperty(b) ? z[b] : null;
  if (null !== e ? 0 !== e.type : d || !(2 < b.length) || "o" !== b[0] && "O" !== b[0] || "n" !== b[1] && "N" !== b[1]) qa(b, c, e, d) && (c = null), d || null === e ? oa(b) && (null === c ? a.removeAttribute(b) : a.setAttribute(b, "" + c)) : e.mustUseProperty ? a[e.propertyName] = null === c ? 3 === e.type ? false : "" : c : (b = e.attributeName, d = e.attributeNamespace, null === c ? a.removeAttribute(b) : (e = e.type, c = 3 === e || 4 === e && true === c ? "" : "" + c, d ? a.setAttributeNS(d, b, c) : a.setAttribute(b, c)));
}
var ua = aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, va = Symbol.for("react.element"), wa = Symbol.for("react.portal"), ya = Symbol.for("react.fragment"), za = Symbol.for("react.strict_mode"), Aa = Symbol.for("react.profiler"), Ba = Symbol.for("react.provider"), Ca = Symbol.for("react.context"), Da = Symbol.for("react.forward_ref"), Ea = Symbol.for("react.suspense"), Fa = Symbol.for("react.suspense_list"), Ga = Symbol.for("react.memo"), Ha = Symbol.for("react.lazy");
var Ia = Symbol.for("react.offscreen");
var Ja = Symbol.iterator;
function Ka(a) {
  if (null === a || "object" !== typeof a) return null;
  a = Ja && a[Ja] || a["@@iterator"];
  return "function" === typeof a ? a : null;
}
var A = Object.assign, La;
function Ma(a) {
  if (void 0 === La) try {
    throw Error();
  } catch (c) {
    var b = c.stack.trim().match(/\n( *(at )?)/);
    La = b && b[1] || "";
  }
  return "\n" + La + a;
}
var Na = false;
function Oa(a, b) {
  if (!a || Na) return "";
  Na = true;
  var c = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  try {
    if (b) if (b = function() {
      throw Error();
    }, Object.defineProperty(b.prototype, "props", { set: function() {
      throw Error();
    } }), "object" === typeof Reflect && Reflect.construct) {
      try {
        Reflect.construct(b, []);
      } catch (l2) {
        var d = l2;
      }
      Reflect.construct(a, [], b);
    } else {
      try {
        b.call();
      } catch (l2) {
        d = l2;
      }
      a.call(b.prototype);
    }
    else {
      try {
        throw Error();
      } catch (l2) {
        d = l2;
      }
      a();
    }
  } catch (l2) {
    if (l2 && d && "string" === typeof l2.stack) {
      for (var e = l2.stack.split("\n"), f2 = d.stack.split("\n"), g = e.length - 1, h = f2.length - 1; 1 <= g && 0 <= h && e[g] !== f2[h]; ) h--;
      for (; 1 <= g && 0 <= h; g--, h--) if (e[g] !== f2[h]) {
        if (1 !== g || 1 !== h) {
          do
            if (g--, h--, 0 > h || e[g] !== f2[h]) {
              var k2 = "\n" + e[g].replace(" at new ", " at ");
              a.displayName && k2.includes("<anonymous>") && (k2 = k2.replace("<anonymous>", a.displayName));
              return k2;
            }
          while (1 <= g && 0 <= h);
        }
        break;
      }
    }
  } finally {
    Na = false, Error.prepareStackTrace = c;
  }
  return (a = a ? a.displayName || a.name : "") ? Ma(a) : "";
}
function Pa(a) {
  switch (a.tag) {
    case 5:
      return Ma(a.type);
    case 16:
      return Ma("Lazy");
    case 13:
      return Ma("Suspense");
    case 19:
      return Ma("SuspenseList");
    case 0:
    case 2:
    case 15:
      return a = Oa(a.type, false), a;
    case 11:
      return a = Oa(a.type.render, false), a;
    case 1:
      return a = Oa(a.type, true), a;
    default:
      return "";
  }
}
function Qa(a) {
  if (null == a) return null;
  if ("function" === typeof a) return a.displayName || a.name || null;
  if ("string" === typeof a) return a;
  switch (a) {
    case ya:
      return "Fragment";
    case wa:
      return "Portal";
    case Aa:
      return "Profiler";
    case za:
      return "StrictMode";
    case Ea:
      return "Suspense";
    case Fa:
      return "SuspenseList";
  }
  if ("object" === typeof a) switch (a.$$typeof) {
    case Ca:
      return (a.displayName || "Context") + ".Consumer";
    case Ba:
      return (a._context.displayName || "Context") + ".Provider";
    case Da:
      var b = a.render;
      a = a.displayName;
      a || (a = b.displayName || b.name || "", a = "" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
      return a;
    case Ga:
      return b = a.displayName || null, null !== b ? b : Qa(a.type) || "Memo";
    case Ha:
      b = a._payload;
      a = a._init;
      try {
        return Qa(a(b));
      } catch (c) {
      }
  }
  return null;
}
function Ra(a) {
  var b = a.type;
  switch (a.tag) {
    case 24:
      return "Cache";
    case 9:
      return (b.displayName || "Context") + ".Consumer";
    case 10:
      return (b._context.displayName || "Context") + ".Provider";
    case 18:
      return "DehydratedFragment";
    case 11:
      return a = b.render, a = a.displayName || a.name || "", b.displayName || ("" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
    case 7:
      return "Fragment";
    case 5:
      return b;
    case 4:
      return "Portal";
    case 3:
      return "Root";
    case 6:
      return "Text";
    case 16:
      return Qa(b);
    case 8:
      return b === za ? "StrictMode" : "Mode";
    case 22:
      return "Offscreen";
    case 12:
      return "Profiler";
    case 21:
      return "Scope";
    case 13:
      return "Suspense";
    case 19:
      return "SuspenseList";
    case 25:
      return "TracingMarker";
    case 1:
    case 0:
    case 17:
    case 2:
    case 14:
    case 15:
      if ("function" === typeof b) return b.displayName || b.name || null;
      if ("string" === typeof b) return b;
  }
  return null;
}
function Sa(a) {
  switch (typeof a) {
    case "boolean":
    case "number":
    case "string":
    case "undefined":
      return a;
    case "object":
      return a;
    default:
      return "";
  }
}
function Ta(a) {
  var b = a.type;
  return (a = a.nodeName) && "input" === a.toLowerCase() && ("checkbox" === b || "radio" === b);
}
function Ua(a) {
  var b = Ta(a) ? "checked" : "value", c = Object.getOwnPropertyDescriptor(a.constructor.prototype, b), d = "" + a[b];
  if (!a.hasOwnProperty(b) && "undefined" !== typeof c && "function" === typeof c.get && "function" === typeof c.set) {
    var e = c.get, f2 = c.set;
    Object.defineProperty(a, b, { configurable: true, get: function() {
      return e.call(this);
    }, set: function(a2) {
      d = "" + a2;
      f2.call(this, a2);
    } });
    Object.defineProperty(a, b, { enumerable: c.enumerable });
    return { getValue: function() {
      return d;
    }, setValue: function(a2) {
      d = "" + a2;
    }, stopTracking: function() {
      a._valueTracker = null;
      delete a[b];
    } };
  }
}
function Va(a) {
  a._valueTracker || (a._valueTracker = Ua(a));
}
function Wa(a) {
  if (!a) return false;
  var b = a._valueTracker;
  if (!b) return true;
  var c = b.getValue();
  var d = "";
  a && (d = Ta(a) ? a.checked ? "true" : "false" : a.value);
  a = d;
  return a !== c ? (b.setValue(a), true) : false;
}
function Xa(a) {
  a = a || ("undefined" !== typeof document ? document : void 0);
  if ("undefined" === typeof a) return null;
  try {
    return a.activeElement || a.body;
  } catch (b) {
    return a.body;
  }
}
function Ya(a, b) {
  var c = b.checked;
  return A({}, b, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: null != c ? c : a._wrapperState.initialChecked });
}
function Za(a, b) {
  var c = null == b.defaultValue ? "" : b.defaultValue, d = null != b.checked ? b.checked : b.defaultChecked;
  c = Sa(null != b.value ? b.value : c);
  a._wrapperState = { initialChecked: d, initialValue: c, controlled: "checkbox" === b.type || "radio" === b.type ? null != b.checked : null != b.value };
}
function ab(a, b) {
  b = b.checked;
  null != b && ta(a, "checked", b, false);
}
function bb(a, b) {
  ab(a, b);
  var c = Sa(b.value), d = b.type;
  if (null != c) if ("number" === d) {
    if (0 === c && "" === a.value || a.value != c) a.value = "" + c;
  } else a.value !== "" + c && (a.value = "" + c);
  else if ("submit" === d || "reset" === d) {
    a.removeAttribute("value");
    return;
  }
  b.hasOwnProperty("value") ? cb(a, b.type, c) : b.hasOwnProperty("defaultValue") && cb(a, b.type, Sa(b.defaultValue));
  null == b.checked && null != b.defaultChecked && (a.defaultChecked = !!b.defaultChecked);
}
function db(a, b, c) {
  if (b.hasOwnProperty("value") || b.hasOwnProperty("defaultValue")) {
    var d = b.type;
    if (!("submit" !== d && "reset" !== d || void 0 !== b.value && null !== b.value)) return;
    b = "" + a._wrapperState.initialValue;
    c || b === a.value || (a.value = b);
    a.defaultValue = b;
  }
  c = a.name;
  "" !== c && (a.name = "");
  a.defaultChecked = !!a._wrapperState.initialChecked;
  "" !== c && (a.name = c);
}
function cb(a, b, c) {
  if ("number" !== b || Xa(a.ownerDocument) !== a) null == c ? a.defaultValue = "" + a._wrapperState.initialValue : a.defaultValue !== "" + c && (a.defaultValue = "" + c);
}
var eb = Array.isArray;
function fb(a, b, c, d) {
  a = a.options;
  if (b) {
    b = {};
    for (var e = 0; e < c.length; e++) b["$" + c[e]] = true;
    for (c = 0; c < a.length; c++) e = b.hasOwnProperty("$" + a[c].value), a[c].selected !== e && (a[c].selected = e), e && d && (a[c].defaultSelected = true);
  } else {
    c = "" + Sa(c);
    b = null;
    for (e = 0; e < a.length; e++) {
      if (a[e].value === c) {
        a[e].selected = true;
        d && (a[e].defaultSelected = true);
        return;
      }
      null !== b || a[e].disabled || (b = a[e]);
    }
    null !== b && (b.selected = true);
  }
}
function gb(a, b) {
  if (null != b.dangerouslySetInnerHTML) throw Error(p(91));
  return A({}, b, { value: void 0, defaultValue: void 0, children: "" + a._wrapperState.initialValue });
}
function hb(a, b) {
  var c = b.value;
  if (null == c) {
    c = b.children;
    b = b.defaultValue;
    if (null != c) {
      if (null != b) throw Error(p(92));
      if (eb(c)) {
        if (1 < c.length) throw Error(p(93));
        c = c[0];
      }
      b = c;
    }
    null == b && (b = "");
    c = b;
  }
  a._wrapperState = { initialValue: Sa(c) };
}
function ib(a, b) {
  var c = Sa(b.value), d = Sa(b.defaultValue);
  null != c && (c = "" + c, c !== a.value && (a.value = c), null == b.defaultValue && a.defaultValue !== c && (a.defaultValue = c));
  null != d && (a.defaultValue = "" + d);
}
function jb(a) {
  var b = a.textContent;
  b === a._wrapperState.initialValue && "" !== b && null !== b && (a.value = b);
}
function kb(a) {
  switch (a) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function lb(a, b) {
  return null == a || "http://www.w3.org/1999/xhtml" === a ? kb(b) : "http://www.w3.org/2000/svg" === a && "foreignObject" === b ? "http://www.w3.org/1999/xhtml" : a;
}
var mb, nb = function(a) {
  return "undefined" !== typeof MSApp && MSApp.execUnsafeLocalFunction ? function(b, c, d, e) {
    MSApp.execUnsafeLocalFunction(function() {
      return a(b, c, d, e);
    });
  } : a;
}(function(a, b) {
  if ("http://www.w3.org/2000/svg" !== a.namespaceURI || "innerHTML" in a) a.innerHTML = b;
  else {
    mb = mb || document.createElement("div");
    mb.innerHTML = "<svg>" + b.valueOf().toString() + "</svg>";
    for (b = mb.firstChild; a.firstChild; ) a.removeChild(a.firstChild);
    for (; b.firstChild; ) a.appendChild(b.firstChild);
  }
});
function ob(a, b) {
  if (b) {
    var c = a.firstChild;
    if (c && c === a.lastChild && 3 === c.nodeType) {
      c.nodeValue = b;
      return;
    }
  }
  a.textContent = b;
}
var pb = {
  animationIterationCount: true,
  aspectRatio: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  columns: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridArea: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowSpan: true,
  gridRowStart: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnSpan: true,
  gridColumnStart: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true
}, qb = ["Webkit", "ms", "Moz", "O"];
Object.keys(pb).forEach(function(a) {
  qb.forEach(function(b) {
    b = b + a.charAt(0).toUpperCase() + a.substring(1);
    pb[b] = pb[a];
  });
});
function rb(a, b, c) {
  return null == b || "boolean" === typeof b || "" === b ? "" : c || "number" !== typeof b || 0 === b || pb.hasOwnProperty(a) && pb[a] ? ("" + b).trim() : b + "px";
}
function sb(a, b) {
  a = a.style;
  for (var c in b) if (b.hasOwnProperty(c)) {
    var d = 0 === c.indexOf("--"), e = rb(c, b[c], d);
    "float" === c && (c = "cssFloat");
    d ? a.setProperty(c, e) : a[c] = e;
  }
}
var tb = A({ menuitem: true }, { area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true, keygen: true, link: true, meta: true, param: true, source: true, track: true, wbr: true });
function ub(a, b) {
  if (b) {
    if (tb[a] && (null != b.children || null != b.dangerouslySetInnerHTML)) throw Error(p(137, a));
    if (null != b.dangerouslySetInnerHTML) {
      if (null != b.children) throw Error(p(60));
      if ("object" !== typeof b.dangerouslySetInnerHTML || !("__html" in b.dangerouslySetInnerHTML)) throw Error(p(61));
    }
    if (null != b.style && "object" !== typeof b.style) throw Error(p(62));
  }
}
function vb(a, b) {
  if (-1 === a.indexOf("-")) return "string" === typeof b.is;
  switch (a) {
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return false;
    default:
      return true;
  }
}
var wb = null;
function xb(a) {
  a = a.target || a.srcElement || window;
  a.correspondingUseElement && (a = a.correspondingUseElement);
  return 3 === a.nodeType ? a.parentNode : a;
}
var yb = null, zb = null, Ab = null;
function Bb(a) {
  if (a = Cb(a)) {
    if ("function" !== typeof yb) throw Error(p(280));
    var b = a.stateNode;
    b && (b = Db(b), yb(a.stateNode, a.type, b));
  }
}
function Eb(a) {
  zb ? Ab ? Ab.push(a) : Ab = [a] : zb = a;
}
function Fb() {
  if (zb) {
    var a = zb, b = Ab;
    Ab = zb = null;
    Bb(a);
    if (b) for (a = 0; a < b.length; a++) Bb(b[a]);
  }
}
function Gb(a, b) {
  return a(b);
}
function Hb() {
}
var Ib = false;
function Jb(a, b, c) {
  if (Ib) return a(b, c);
  Ib = true;
  try {
    return Gb(a, b, c);
  } finally {
    if (Ib = false, null !== zb || null !== Ab) Hb(), Fb();
  }
}
function Kb(a, b) {
  var c = a.stateNode;
  if (null === c) return null;
  var d = Db(c);
  if (null === d) return null;
  c = d[b];
  a: switch (b) {
    case "onClick":
    case "onClickCapture":
    case "onDoubleClick":
    case "onDoubleClickCapture":
    case "onMouseDown":
    case "onMouseDownCapture":
    case "onMouseMove":
    case "onMouseMoveCapture":
    case "onMouseUp":
    case "onMouseUpCapture":
    case "onMouseEnter":
      (d = !d.disabled) || (a = a.type, d = !("button" === a || "input" === a || "select" === a || "textarea" === a));
      a = !d;
      break a;
    default:
      a = false;
  }
  if (a) return null;
  if (c && "function" !== typeof c) throw Error(p(231, b, typeof c));
  return c;
}
var Lb = false;
if (ia) try {
  var Mb = {};
  Object.defineProperty(Mb, "passive", { get: function() {
    Lb = true;
  } });
  window.addEventListener("test", Mb, Mb);
  window.removeEventListener("test", Mb, Mb);
} catch (a) {
  Lb = false;
}
function Nb(a, b, c, d, e, f2, g, h, k2) {
  var l2 = Array.prototype.slice.call(arguments, 3);
  try {
    b.apply(c, l2);
  } catch (m2) {
    this.onError(m2);
  }
}
var Ob = false, Pb = null, Qb = false, Rb = null, Sb = { onError: function(a) {
  Ob = true;
  Pb = a;
} };
function Tb(a, b, c, d, e, f2, g, h, k2) {
  Ob = false;
  Pb = null;
  Nb.apply(Sb, arguments);
}
function Ub(a, b, c, d, e, f2, g, h, k2) {
  Tb.apply(this, arguments);
  if (Ob) {
    if (Ob) {
      var l2 = Pb;
      Ob = false;
      Pb = null;
    } else throw Error(p(198));
    Qb || (Qb = true, Rb = l2);
  }
}
function Vb(a) {
  var b = a, c = a;
  if (a.alternate) for (; b.return; ) b = b.return;
  else {
    a = b;
    do
      b = a, 0 !== (b.flags & 4098) && (c = b.return), a = b.return;
    while (a);
  }
  return 3 === b.tag ? c : null;
}
function Wb(a) {
  if (13 === a.tag) {
    var b = a.memoizedState;
    null === b && (a = a.alternate, null !== a && (b = a.memoizedState));
    if (null !== b) return b.dehydrated;
  }
  return null;
}
function Xb(a) {
  if (Vb(a) !== a) throw Error(p(188));
}
function Yb(a) {
  var b = a.alternate;
  if (!b) {
    b = Vb(a);
    if (null === b) throw Error(p(188));
    return b !== a ? null : a;
  }
  for (var c = a, d = b; ; ) {
    var e = c.return;
    if (null === e) break;
    var f2 = e.alternate;
    if (null === f2) {
      d = e.return;
      if (null !== d) {
        c = d;
        continue;
      }
      break;
    }
    if (e.child === f2.child) {
      for (f2 = e.child; f2; ) {
        if (f2 === c) return Xb(e), a;
        if (f2 === d) return Xb(e), b;
        f2 = f2.sibling;
      }
      throw Error(p(188));
    }
    if (c.return !== d.return) c = e, d = f2;
    else {
      for (var g = false, h = e.child; h; ) {
        if (h === c) {
          g = true;
          c = e;
          d = f2;
          break;
        }
        if (h === d) {
          g = true;
          d = e;
          c = f2;
          break;
        }
        h = h.sibling;
      }
      if (!g) {
        for (h = f2.child; h; ) {
          if (h === c) {
            g = true;
            c = f2;
            d = e;
            break;
          }
          if (h === d) {
            g = true;
            d = f2;
            c = e;
            break;
          }
          h = h.sibling;
        }
        if (!g) throw Error(p(189));
      }
    }
    if (c.alternate !== d) throw Error(p(190));
  }
  if (3 !== c.tag) throw Error(p(188));
  return c.stateNode.current === c ? a : b;
}
function Zb(a) {
  a = Yb(a);
  return null !== a ? $b(a) : null;
}
function $b(a) {
  if (5 === a.tag || 6 === a.tag) return a;
  for (a = a.child; null !== a; ) {
    var b = $b(a);
    if (null !== b) return b;
    a = a.sibling;
  }
  return null;
}
var ac = ca.unstable_scheduleCallback, bc = ca.unstable_cancelCallback, cc = ca.unstable_shouldYield, dc = ca.unstable_requestPaint, B = ca.unstable_now, ec = ca.unstable_getCurrentPriorityLevel, fc = ca.unstable_ImmediatePriority, gc = ca.unstable_UserBlockingPriority, hc = ca.unstable_NormalPriority, ic = ca.unstable_LowPriority, jc = ca.unstable_IdlePriority, kc = null, lc = null;
function mc(a) {
  if (lc && "function" === typeof lc.onCommitFiberRoot) try {
    lc.onCommitFiberRoot(kc, a, void 0, 128 === (a.current.flags & 128));
  } catch (b) {
  }
}
var oc = Math.clz32 ? Math.clz32 : nc, pc = Math.log, qc = Math.LN2;
function nc(a) {
  a >>>= 0;
  return 0 === a ? 32 : 31 - (pc(a) / qc | 0) | 0;
}
var rc = 64, sc = 4194304;
function tc(a) {
  switch (a & -a) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 4:
      return 4;
    case 8:
      return 8;
    case 16:
      return 16;
    case 32:
      return 32;
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return a & 4194240;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return a & 130023424;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 1073741824;
    default:
      return a;
  }
}
function uc(a, b) {
  var c = a.pendingLanes;
  if (0 === c) return 0;
  var d = 0, e = a.suspendedLanes, f2 = a.pingedLanes, g = c & 268435455;
  if (0 !== g) {
    var h = g & ~e;
    0 !== h ? d = tc(h) : (f2 &= g, 0 !== f2 && (d = tc(f2)));
  } else g = c & ~e, 0 !== g ? d = tc(g) : 0 !== f2 && (d = tc(f2));
  if (0 === d) return 0;
  if (0 !== b && b !== d && 0 === (b & e) && (e = d & -d, f2 = b & -b, e >= f2 || 16 === e && 0 !== (f2 & 4194240))) return b;
  0 !== (d & 4) && (d |= c & 16);
  b = a.entangledLanes;
  if (0 !== b) for (a = a.entanglements, b &= d; 0 < b; ) c = 31 - oc(b), e = 1 << c, d |= a[c], b &= ~e;
  return d;
}
function vc(a, b) {
  switch (a) {
    case 1:
    case 2:
    case 4:
      return b + 250;
    case 8:
    case 16:
    case 32:
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return b + 5e3;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return -1;
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1;
    default:
      return -1;
  }
}
function wc(a, b) {
  for (var c = a.suspendedLanes, d = a.pingedLanes, e = a.expirationTimes, f2 = a.pendingLanes; 0 < f2; ) {
    var g = 31 - oc(f2), h = 1 << g, k2 = e[g];
    if (-1 === k2) {
      if (0 === (h & c) || 0 !== (h & d)) e[g] = vc(h, b);
    } else k2 <= b && (a.expiredLanes |= h);
    f2 &= ~h;
  }
}
function xc(a) {
  a = a.pendingLanes & -1073741825;
  return 0 !== a ? a : a & 1073741824 ? 1073741824 : 0;
}
function yc() {
  var a = rc;
  rc <<= 1;
  0 === (rc & 4194240) && (rc = 64);
  return a;
}
function zc(a) {
  for (var b = [], c = 0; 31 > c; c++) b.push(a);
  return b;
}
function Ac(a, b, c) {
  a.pendingLanes |= b;
  536870912 !== b && (a.suspendedLanes = 0, a.pingedLanes = 0);
  a = a.eventTimes;
  b = 31 - oc(b);
  a[b] = c;
}
function Bc(a, b) {
  var c = a.pendingLanes & ~b;
  a.pendingLanes = b;
  a.suspendedLanes = 0;
  a.pingedLanes = 0;
  a.expiredLanes &= b;
  a.mutableReadLanes &= b;
  a.entangledLanes &= b;
  b = a.entanglements;
  var d = a.eventTimes;
  for (a = a.expirationTimes; 0 < c; ) {
    var e = 31 - oc(c), f2 = 1 << e;
    b[e] = 0;
    d[e] = -1;
    a[e] = -1;
    c &= ~f2;
  }
}
function Cc(a, b) {
  var c = a.entangledLanes |= b;
  for (a = a.entanglements; c; ) {
    var d = 31 - oc(c), e = 1 << d;
    e & b | a[d] & b && (a[d] |= b);
    c &= ~e;
  }
}
var C = 0;
function Dc(a) {
  a &= -a;
  return 1 < a ? 4 < a ? 0 !== (a & 268435455) ? 16 : 536870912 : 4 : 1;
}
var Ec, Fc, Gc, Hc, Ic, Jc = false, Kc = [], Lc = null, Mc = null, Nc = null, Oc = /* @__PURE__ */ new Map(), Pc = /* @__PURE__ */ new Map(), Qc = [], Rc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function Sc(a, b) {
  switch (a) {
    case "focusin":
    case "focusout":
      Lc = null;
      break;
    case "dragenter":
    case "dragleave":
      Mc = null;
      break;
    case "mouseover":
    case "mouseout":
      Nc = null;
      break;
    case "pointerover":
    case "pointerout":
      Oc.delete(b.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      Pc.delete(b.pointerId);
  }
}
function Tc(a, b, c, d, e, f2) {
  if (null === a || a.nativeEvent !== f2) return a = { blockedOn: b, domEventName: c, eventSystemFlags: d, nativeEvent: f2, targetContainers: [e] }, null !== b && (b = Cb(b), null !== b && Fc(b)), a;
  a.eventSystemFlags |= d;
  b = a.targetContainers;
  null !== e && -1 === b.indexOf(e) && b.push(e);
  return a;
}
function Uc(a, b, c, d, e) {
  switch (b) {
    case "focusin":
      return Lc = Tc(Lc, a, b, c, d, e), true;
    case "dragenter":
      return Mc = Tc(Mc, a, b, c, d, e), true;
    case "mouseover":
      return Nc = Tc(Nc, a, b, c, d, e), true;
    case "pointerover":
      var f2 = e.pointerId;
      Oc.set(f2, Tc(Oc.get(f2) || null, a, b, c, d, e));
      return true;
    case "gotpointercapture":
      return f2 = e.pointerId, Pc.set(f2, Tc(Pc.get(f2) || null, a, b, c, d, e)), true;
  }
  return false;
}
function Vc(a) {
  var b = Wc(a.target);
  if (null !== b) {
    var c = Vb(b);
    if (null !== c) {
      if (b = c.tag, 13 === b) {
        if (b = Wb(c), null !== b) {
          a.blockedOn = b;
          Ic(a.priority, function() {
            Gc(c);
          });
          return;
        }
      } else if (3 === b && c.stateNode.current.memoizedState.isDehydrated) {
        a.blockedOn = 3 === c.tag ? c.stateNode.containerInfo : null;
        return;
      }
    }
  }
  a.blockedOn = null;
}
function Xc(a) {
  if (null !== a.blockedOn) return false;
  for (var b = a.targetContainers; 0 < b.length; ) {
    var c = Yc(a.domEventName, a.eventSystemFlags, b[0], a.nativeEvent);
    if (null === c) {
      c = a.nativeEvent;
      var d = new c.constructor(c.type, c);
      wb = d;
      c.target.dispatchEvent(d);
      wb = null;
    } else return b = Cb(c), null !== b && Fc(b), a.blockedOn = c, false;
    b.shift();
  }
  return true;
}
function Zc(a, b, c) {
  Xc(a) && c.delete(b);
}
function $c() {
  Jc = false;
  null !== Lc && Xc(Lc) && (Lc = null);
  null !== Mc && Xc(Mc) && (Mc = null);
  null !== Nc && Xc(Nc) && (Nc = null);
  Oc.forEach(Zc);
  Pc.forEach(Zc);
}
function ad(a, b) {
  a.blockedOn === b && (a.blockedOn = null, Jc || (Jc = true, ca.unstable_scheduleCallback(ca.unstable_NormalPriority, $c)));
}
function bd(a) {
  function b(b2) {
    return ad(b2, a);
  }
  if (0 < Kc.length) {
    ad(Kc[0], a);
    for (var c = 1; c < Kc.length; c++) {
      var d = Kc[c];
      d.blockedOn === a && (d.blockedOn = null);
    }
  }
  null !== Lc && ad(Lc, a);
  null !== Mc && ad(Mc, a);
  null !== Nc && ad(Nc, a);
  Oc.forEach(b);
  Pc.forEach(b);
  for (c = 0; c < Qc.length; c++) d = Qc[c], d.blockedOn === a && (d.blockedOn = null);
  for (; 0 < Qc.length && (c = Qc[0], null === c.blockedOn); ) Vc(c), null === c.blockedOn && Qc.shift();
}
var cd = ua.ReactCurrentBatchConfig, dd = true;
function ed(a, b, c, d) {
  var e = C, f2 = cd.transition;
  cd.transition = null;
  try {
    C = 1, fd(a, b, c, d);
  } finally {
    C = e, cd.transition = f2;
  }
}
function gd(a, b, c, d) {
  var e = C, f2 = cd.transition;
  cd.transition = null;
  try {
    C = 4, fd(a, b, c, d);
  } finally {
    C = e, cd.transition = f2;
  }
}
function fd(a, b, c, d) {
  if (dd) {
    var e = Yc(a, b, c, d);
    if (null === e) hd(a, b, d, id, c), Sc(a, d);
    else if (Uc(e, a, b, c, d)) d.stopPropagation();
    else if (Sc(a, d), b & 4 && -1 < Rc.indexOf(a)) {
      for (; null !== e; ) {
        var f2 = Cb(e);
        null !== f2 && Ec(f2);
        f2 = Yc(a, b, c, d);
        null === f2 && hd(a, b, d, id, c);
        if (f2 === e) break;
        e = f2;
      }
      null !== e && d.stopPropagation();
    } else hd(a, b, d, null, c);
  }
}
var id = null;
function Yc(a, b, c, d) {
  id = null;
  a = xb(d);
  a = Wc(a);
  if (null !== a) if (b = Vb(a), null === b) a = null;
  else if (c = b.tag, 13 === c) {
    a = Wb(b);
    if (null !== a) return a;
    a = null;
  } else if (3 === c) {
    if (b.stateNode.current.memoizedState.isDehydrated) return 3 === b.tag ? b.stateNode.containerInfo : null;
    a = null;
  } else b !== a && (a = null);
  id = a;
  return null;
}
function jd(a) {
  switch (a) {
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    case "beforeblur":
    case "afterblur":
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return 1;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "toggle":
    case "touchmove":
    case "wheel":
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return 4;
    case "message":
      switch (ec()) {
        case fc:
          return 1;
        case gc:
          return 4;
        case hc:
        case ic:
          return 16;
        case jc:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var kd = null, ld = null, md = null;
function nd() {
  if (md) return md;
  var a, b = ld, c = b.length, d, e = "value" in kd ? kd.value : kd.textContent, f2 = e.length;
  for (a = 0; a < c && b[a] === e[a]; a++) ;
  var g = c - a;
  for (d = 1; d <= g && b[c - d] === e[f2 - d]; d++) ;
  return md = e.slice(a, 1 < d ? 1 - d : void 0);
}
function od(a) {
  var b = a.keyCode;
  "charCode" in a ? (a = a.charCode, 0 === a && 13 === b && (a = 13)) : a = b;
  10 === a && (a = 13);
  return 32 <= a || 13 === a ? a : 0;
}
function pd() {
  return true;
}
function qd() {
  return false;
}
function rd(a) {
  function b(b2, d, e, f2, g) {
    this._reactName = b2;
    this._targetInst = e;
    this.type = d;
    this.nativeEvent = f2;
    this.target = g;
    this.currentTarget = null;
    for (var c in a) a.hasOwnProperty(c) && (b2 = a[c], this[c] = b2 ? b2(f2) : f2[c]);
    this.isDefaultPrevented = (null != f2.defaultPrevented ? f2.defaultPrevented : false === f2.returnValue) ? pd : qd;
    this.isPropagationStopped = qd;
    return this;
  }
  A(b.prototype, { preventDefault: function() {
    this.defaultPrevented = true;
    var a2 = this.nativeEvent;
    a2 && (a2.preventDefault ? a2.preventDefault() : "unknown" !== typeof a2.returnValue && (a2.returnValue = false), this.isDefaultPrevented = pd);
  }, stopPropagation: function() {
    var a2 = this.nativeEvent;
    a2 && (a2.stopPropagation ? a2.stopPropagation() : "unknown" !== typeof a2.cancelBubble && (a2.cancelBubble = true), this.isPropagationStopped = pd);
  }, persist: function() {
  }, isPersistent: pd });
  return b;
}
var sd = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(a) {
  return a.timeStamp || Date.now();
}, defaultPrevented: 0, isTrusted: 0 }, td = rd(sd), ud = A({}, sd, { view: 0, detail: 0 }), vd = rd(ud), wd, xd, yd, Ad = A({}, ud, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: zd, button: 0, buttons: 0, relatedTarget: function(a) {
  return void 0 === a.relatedTarget ? a.fromElement === a.srcElement ? a.toElement : a.fromElement : a.relatedTarget;
}, movementX: function(a) {
  if ("movementX" in a) return a.movementX;
  a !== yd && (yd && "mousemove" === a.type ? (wd = a.screenX - yd.screenX, xd = a.screenY - yd.screenY) : xd = wd = 0, yd = a);
  return wd;
}, movementY: function(a) {
  return "movementY" in a ? a.movementY : xd;
} }), Bd = rd(Ad), Cd = A({}, Ad, { dataTransfer: 0 }), Dd = rd(Cd), Ed = A({}, ud, { relatedTarget: 0 }), Fd = rd(Ed), Gd = A({}, sd, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), Hd = rd(Gd), Id = A({}, sd, { clipboardData: function(a) {
  return "clipboardData" in a ? a.clipboardData : window.clipboardData;
} }), Jd = rd(Id), Kd = A({}, sd, { data: 0 }), Ld = rd(Kd), Md = {
  Esc: "Escape",
  Spacebar: " ",
  Left: "ArrowLeft",
  Up: "ArrowUp",
  Right: "ArrowRight",
  Down: "ArrowDown",
  Del: "Delete",
  Win: "OS",
  Menu: "ContextMenu",
  Apps: "ContextMenu",
  Scroll: "ScrollLock",
  MozPrintableKey: "Unidentified"
}, Nd = {
  8: "Backspace",
  9: "Tab",
  12: "Clear",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  19: "Pause",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  45: "Insert",
  46: "Delete",
  112: "F1",
  113: "F2",
  114: "F3",
  115: "F4",
  116: "F5",
  117: "F6",
  118: "F7",
  119: "F8",
  120: "F9",
  121: "F10",
  122: "F11",
  123: "F12",
  144: "NumLock",
  145: "ScrollLock",
  224: "Meta"
}, Od = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
function Pd(a) {
  var b = this.nativeEvent;
  return b.getModifierState ? b.getModifierState(a) : (a = Od[a]) ? !!b[a] : false;
}
function zd() {
  return Pd;
}
var Qd = A({}, ud, { key: function(a) {
  if (a.key) {
    var b = Md[a.key] || a.key;
    if ("Unidentified" !== b) return b;
  }
  return "keypress" === a.type ? (a = od(a), 13 === a ? "Enter" : String.fromCharCode(a)) : "keydown" === a.type || "keyup" === a.type ? Nd[a.keyCode] || "Unidentified" : "";
}, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: zd, charCode: function(a) {
  return "keypress" === a.type ? od(a) : 0;
}, keyCode: function(a) {
  return "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
}, which: function(a) {
  return "keypress" === a.type ? od(a) : "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
} }), Rd = rd(Qd), Sd = A({}, Ad, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), Td = rd(Sd), Ud = A({}, ud, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: zd }), Vd = rd(Ud), Wd = A({}, sd, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), Xd = rd(Wd), Yd = A({}, Ad, {
  deltaX: function(a) {
    return "deltaX" in a ? a.deltaX : "wheelDeltaX" in a ? -a.wheelDeltaX : 0;
  },
  deltaY: function(a) {
    return "deltaY" in a ? a.deltaY : "wheelDeltaY" in a ? -a.wheelDeltaY : "wheelDelta" in a ? -a.wheelDelta : 0;
  },
  deltaZ: 0,
  deltaMode: 0
}), Zd = rd(Yd), $d = [9, 13, 27, 32], ae = ia && "CompositionEvent" in window, be = null;
ia && "documentMode" in document && (be = document.documentMode);
var ce = ia && "TextEvent" in window && !be, de = ia && (!ae || be && 8 < be && 11 >= be), ee = String.fromCharCode(32), fe = false;
function ge(a, b) {
  switch (a) {
    case "keyup":
      return -1 !== $d.indexOf(b.keyCode);
    case "keydown":
      return 229 !== b.keyCode;
    case "keypress":
    case "mousedown":
    case "focusout":
      return true;
    default:
      return false;
  }
}
function he(a) {
  a = a.detail;
  return "object" === typeof a && "data" in a ? a.data : null;
}
var ie = false;
function je(a, b) {
  switch (a) {
    case "compositionend":
      return he(b);
    case "keypress":
      if (32 !== b.which) return null;
      fe = true;
      return ee;
    case "textInput":
      return a = b.data, a === ee && fe ? null : a;
    default:
      return null;
  }
}
function ke(a, b) {
  if (ie) return "compositionend" === a || !ae && ge(a, b) ? (a = nd(), md = ld = kd = null, ie = false, a) : null;
  switch (a) {
    case "paste":
      return null;
    case "keypress":
      if (!(b.ctrlKey || b.altKey || b.metaKey) || b.ctrlKey && b.altKey) {
        if (b.char && 1 < b.char.length) return b.char;
        if (b.which) return String.fromCharCode(b.which);
      }
      return null;
    case "compositionend":
      return de && "ko" !== b.locale ? null : b.data;
    default:
      return null;
  }
}
var le = { color: true, date: true, datetime: true, "datetime-local": true, email: true, month: true, number: true, password: true, range: true, search: true, tel: true, text: true, time: true, url: true, week: true };
function me(a) {
  var b = a && a.nodeName && a.nodeName.toLowerCase();
  return "input" === b ? !!le[a.type] : "textarea" === b ? true : false;
}
function ne(a, b, c, d) {
  Eb(d);
  b = oe(b, "onChange");
  0 < b.length && (c = new td("onChange", "change", null, c, d), a.push({ event: c, listeners: b }));
}
var pe = null, qe = null;
function re(a) {
  se(a, 0);
}
function te(a) {
  var b = ue(a);
  if (Wa(b)) return a;
}
function ve(a, b) {
  if ("change" === a) return b;
}
var we = false;
if (ia) {
  var xe;
  if (ia) {
    var ye = "oninput" in document;
    if (!ye) {
      var ze = document.createElement("div");
      ze.setAttribute("oninput", "return;");
      ye = "function" === typeof ze.oninput;
    }
    xe = ye;
  } else xe = false;
  we = xe && (!document.documentMode || 9 < document.documentMode);
}
function Ae() {
  pe && (pe.detachEvent("onpropertychange", Be), qe = pe = null);
}
function Be(a) {
  if ("value" === a.propertyName && te(qe)) {
    var b = [];
    ne(b, qe, a, xb(a));
    Jb(re, b);
  }
}
function Ce(a, b, c) {
  "focusin" === a ? (Ae(), pe = b, qe = c, pe.attachEvent("onpropertychange", Be)) : "focusout" === a && Ae();
}
function De(a) {
  if ("selectionchange" === a || "keyup" === a || "keydown" === a) return te(qe);
}
function Ee(a, b) {
  if ("click" === a) return te(b);
}
function Fe(a, b) {
  if ("input" === a || "change" === a) return te(b);
}
function Ge(a, b) {
  return a === b && (0 !== a || 1 / a === 1 / b) || a !== a && b !== b;
}
var He = "function" === typeof Object.is ? Object.is : Ge;
function Ie(a, b) {
  if (He(a, b)) return true;
  if ("object" !== typeof a || null === a || "object" !== typeof b || null === b) return false;
  var c = Object.keys(a), d = Object.keys(b);
  if (c.length !== d.length) return false;
  for (d = 0; d < c.length; d++) {
    var e = c[d];
    if (!ja.call(b, e) || !He(a[e], b[e])) return false;
  }
  return true;
}
function Je(a) {
  for (; a && a.firstChild; ) a = a.firstChild;
  return a;
}
function Ke(a, b) {
  var c = Je(a);
  a = 0;
  for (var d; c; ) {
    if (3 === c.nodeType) {
      d = a + c.textContent.length;
      if (a <= b && d >= b) return { node: c, offset: b - a };
      a = d;
    }
    a: {
      for (; c; ) {
        if (c.nextSibling) {
          c = c.nextSibling;
          break a;
        }
        c = c.parentNode;
      }
      c = void 0;
    }
    c = Je(c);
  }
}
function Le(a, b) {
  return a && b ? a === b ? true : a && 3 === a.nodeType ? false : b && 3 === b.nodeType ? Le(a, b.parentNode) : "contains" in a ? a.contains(b) : a.compareDocumentPosition ? !!(a.compareDocumentPosition(b) & 16) : false : false;
}
function Me() {
  for (var a = window, b = Xa(); b instanceof a.HTMLIFrameElement; ) {
    try {
      var c = "string" === typeof b.contentWindow.location.href;
    } catch (d) {
      c = false;
    }
    if (c) a = b.contentWindow;
    else break;
    b = Xa(a.document);
  }
  return b;
}
function Ne(a) {
  var b = a && a.nodeName && a.nodeName.toLowerCase();
  return b && ("input" === b && ("text" === a.type || "search" === a.type || "tel" === a.type || "url" === a.type || "password" === a.type) || "textarea" === b || "true" === a.contentEditable);
}
function Oe(a) {
  var b = Me(), c = a.focusedElem, d = a.selectionRange;
  if (b !== c && c && c.ownerDocument && Le(c.ownerDocument.documentElement, c)) {
    if (null !== d && Ne(c)) {
      if (b = d.start, a = d.end, void 0 === a && (a = b), "selectionStart" in c) c.selectionStart = b, c.selectionEnd = Math.min(a, c.value.length);
      else if (a = (b = c.ownerDocument || document) && b.defaultView || window, a.getSelection) {
        a = a.getSelection();
        var e = c.textContent.length, f2 = Math.min(d.start, e);
        d = void 0 === d.end ? f2 : Math.min(d.end, e);
        !a.extend && f2 > d && (e = d, d = f2, f2 = e);
        e = Ke(c, f2);
        var g = Ke(
          c,
          d
        );
        e && g && (1 !== a.rangeCount || a.anchorNode !== e.node || a.anchorOffset !== e.offset || a.focusNode !== g.node || a.focusOffset !== g.offset) && (b = b.createRange(), b.setStart(e.node, e.offset), a.removeAllRanges(), f2 > d ? (a.addRange(b), a.extend(g.node, g.offset)) : (b.setEnd(g.node, g.offset), a.addRange(b)));
      }
    }
    b = [];
    for (a = c; a = a.parentNode; ) 1 === a.nodeType && b.push({ element: a, left: a.scrollLeft, top: a.scrollTop });
    "function" === typeof c.focus && c.focus();
    for (c = 0; c < b.length; c++) a = b[c], a.element.scrollLeft = a.left, a.element.scrollTop = a.top;
  }
}
var Pe = ia && "documentMode" in document && 11 >= document.documentMode, Qe = null, Re = null, Se = null, Te = false;
function Ue(a, b, c) {
  var d = c.window === c ? c.document : 9 === c.nodeType ? c : c.ownerDocument;
  Te || null == Qe || Qe !== Xa(d) || (d = Qe, "selectionStart" in d && Ne(d) ? d = { start: d.selectionStart, end: d.selectionEnd } : (d = (d.ownerDocument && d.ownerDocument.defaultView || window).getSelection(), d = { anchorNode: d.anchorNode, anchorOffset: d.anchorOffset, focusNode: d.focusNode, focusOffset: d.focusOffset }), Se && Ie(Se, d) || (Se = d, d = oe(Re, "onSelect"), 0 < d.length && (b = new td("onSelect", "select", null, b, c), a.push({ event: b, listeners: d }), b.target = Qe)));
}
function Ve(a, b) {
  var c = {};
  c[a.toLowerCase()] = b.toLowerCase();
  c["Webkit" + a] = "webkit" + b;
  c["Moz" + a] = "moz" + b;
  return c;
}
var We = { animationend: Ve("Animation", "AnimationEnd"), animationiteration: Ve("Animation", "AnimationIteration"), animationstart: Ve("Animation", "AnimationStart"), transitionend: Ve("Transition", "TransitionEnd") }, Xe = {}, Ye = {};
ia && (Ye = document.createElement("div").style, "AnimationEvent" in window || (delete We.animationend.animation, delete We.animationiteration.animation, delete We.animationstart.animation), "TransitionEvent" in window || delete We.transitionend.transition);
function Ze(a) {
  if (Xe[a]) return Xe[a];
  if (!We[a]) return a;
  var b = We[a], c;
  for (c in b) if (b.hasOwnProperty(c) && c in Ye) return Xe[a] = b[c];
  return a;
}
var $e = Ze("animationend"), af = Ze("animationiteration"), bf = Ze("animationstart"), cf = Ze("transitionend"), df = /* @__PURE__ */ new Map(), ef = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function ff(a, b) {
  df.set(a, b);
  fa(b, [a]);
}
for (var gf = 0; gf < ef.length; gf++) {
  var hf = ef[gf], jf = hf.toLowerCase(), kf = hf[0].toUpperCase() + hf.slice(1);
  ff(jf, "on" + kf);
}
ff($e, "onAnimationEnd");
ff(af, "onAnimationIteration");
ff(bf, "onAnimationStart");
ff("dblclick", "onDoubleClick");
ff("focusin", "onFocus");
ff("focusout", "onBlur");
ff(cf, "onTransitionEnd");
ha("onMouseEnter", ["mouseout", "mouseover"]);
ha("onMouseLeave", ["mouseout", "mouseover"]);
ha("onPointerEnter", ["pointerout", "pointerover"]);
ha("onPointerLeave", ["pointerout", "pointerover"]);
fa("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
fa("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
fa("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
fa("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
fa("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
fa("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var lf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), mf = new Set("cancel close invalid load scroll toggle".split(" ").concat(lf));
function nf(a, b, c) {
  var d = a.type || "unknown-event";
  a.currentTarget = c;
  Ub(d, b, void 0, a);
  a.currentTarget = null;
}
function se(a, b) {
  b = 0 !== (b & 4);
  for (var c = 0; c < a.length; c++) {
    var d = a[c], e = d.event;
    d = d.listeners;
    a: {
      var f2 = void 0;
      if (b) for (var g = d.length - 1; 0 <= g; g--) {
        var h = d[g], k2 = h.instance, l2 = h.currentTarget;
        h = h.listener;
        if (k2 !== f2 && e.isPropagationStopped()) break a;
        nf(e, h, l2);
        f2 = k2;
      }
      else for (g = 0; g < d.length; g++) {
        h = d[g];
        k2 = h.instance;
        l2 = h.currentTarget;
        h = h.listener;
        if (k2 !== f2 && e.isPropagationStopped()) break a;
        nf(e, h, l2);
        f2 = k2;
      }
    }
  }
  if (Qb) throw a = Rb, Qb = false, Rb = null, a;
}
function D(a, b) {
  var c = b[of];
  void 0 === c && (c = b[of] = /* @__PURE__ */ new Set());
  var d = a + "__bubble";
  c.has(d) || (pf(b, a, 2, false), c.add(d));
}
function qf(a, b, c) {
  var d = 0;
  b && (d |= 4);
  pf(c, a, d, b);
}
var rf = "_reactListening" + Math.random().toString(36).slice(2);
function sf(a) {
  if (!a[rf]) {
    a[rf] = true;
    da.forEach(function(b2) {
      "selectionchange" !== b2 && (mf.has(b2) || qf(b2, false, a), qf(b2, true, a));
    });
    var b = 9 === a.nodeType ? a : a.ownerDocument;
    null === b || b[rf] || (b[rf] = true, qf("selectionchange", false, b));
  }
}
function pf(a, b, c, d) {
  switch (jd(b)) {
    case 1:
      var e = ed;
      break;
    case 4:
      e = gd;
      break;
    default:
      e = fd;
  }
  c = e.bind(null, b, c, a);
  e = void 0;
  !Lb || "touchstart" !== b && "touchmove" !== b && "wheel" !== b || (e = true);
  d ? void 0 !== e ? a.addEventListener(b, c, { capture: true, passive: e }) : a.addEventListener(b, c, true) : void 0 !== e ? a.addEventListener(b, c, { passive: e }) : a.addEventListener(b, c, false);
}
function hd(a, b, c, d, e) {
  var f2 = d;
  if (0 === (b & 1) && 0 === (b & 2) && null !== d) a: for (; ; ) {
    if (null === d) return;
    var g = d.tag;
    if (3 === g || 4 === g) {
      var h = d.stateNode.containerInfo;
      if (h === e || 8 === h.nodeType && h.parentNode === e) break;
      if (4 === g) for (g = d.return; null !== g; ) {
        var k2 = g.tag;
        if (3 === k2 || 4 === k2) {
          if (k2 = g.stateNode.containerInfo, k2 === e || 8 === k2.nodeType && k2.parentNode === e) return;
        }
        g = g.return;
      }
      for (; null !== h; ) {
        g = Wc(h);
        if (null === g) return;
        k2 = g.tag;
        if (5 === k2 || 6 === k2) {
          d = f2 = g;
          continue a;
        }
        h = h.parentNode;
      }
    }
    d = d.return;
  }
  Jb(function() {
    var d2 = f2, e2 = xb(c), g2 = [];
    a: {
      var h2 = df.get(a);
      if (void 0 !== h2) {
        var k3 = td, n2 = a;
        switch (a) {
          case "keypress":
            if (0 === od(c)) break a;
          case "keydown":
          case "keyup":
            k3 = Rd;
            break;
          case "focusin":
            n2 = "focus";
            k3 = Fd;
            break;
          case "focusout":
            n2 = "blur";
            k3 = Fd;
            break;
          case "beforeblur":
          case "afterblur":
            k3 = Fd;
            break;
          case "click":
            if (2 === c.button) break a;
          case "auxclick":
          case "dblclick":
          case "mousedown":
          case "mousemove":
          case "mouseup":
          case "mouseout":
          case "mouseover":
          case "contextmenu":
            k3 = Bd;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            k3 = Dd;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            k3 = Vd;
            break;
          case $e:
          case af:
          case bf:
            k3 = Hd;
            break;
          case cf:
            k3 = Xd;
            break;
          case "scroll":
            k3 = vd;
            break;
          case "wheel":
            k3 = Zd;
            break;
          case "copy":
          case "cut":
          case "paste":
            k3 = Jd;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            k3 = Td;
        }
        var t2 = 0 !== (b & 4), J2 = !t2 && "scroll" === a, x2 = t2 ? null !== h2 ? h2 + "Capture" : null : h2;
        t2 = [];
        for (var w2 = d2, u2; null !== w2; ) {
          u2 = w2;
          var F2 = u2.stateNode;
          5 === u2.tag && null !== F2 && (u2 = F2, null !== x2 && (F2 = Kb(w2, x2), null != F2 && t2.push(tf(w2, F2, u2))));
          if (J2) break;
          w2 = w2.return;
        }
        0 < t2.length && (h2 = new k3(h2, n2, null, c, e2), g2.push({ event: h2, listeners: t2 }));
      }
    }
    if (0 === (b & 7)) {
      a: {
        h2 = "mouseover" === a || "pointerover" === a;
        k3 = "mouseout" === a || "pointerout" === a;
        if (h2 && c !== wb && (n2 = c.relatedTarget || c.fromElement) && (Wc(n2) || n2[uf])) break a;
        if (k3 || h2) {
          h2 = e2.window === e2 ? e2 : (h2 = e2.ownerDocument) ? h2.defaultView || h2.parentWindow : window;
          if (k3) {
            if (n2 = c.relatedTarget || c.toElement, k3 = d2, n2 = n2 ? Wc(n2) : null, null !== n2 && (J2 = Vb(n2), n2 !== J2 || 5 !== n2.tag && 6 !== n2.tag)) n2 = null;
          } else k3 = null, n2 = d2;
          if (k3 !== n2) {
            t2 = Bd;
            F2 = "onMouseLeave";
            x2 = "onMouseEnter";
            w2 = "mouse";
            if ("pointerout" === a || "pointerover" === a) t2 = Td, F2 = "onPointerLeave", x2 = "onPointerEnter", w2 = "pointer";
            J2 = null == k3 ? h2 : ue(k3);
            u2 = null == n2 ? h2 : ue(n2);
            h2 = new t2(F2, w2 + "leave", k3, c, e2);
            h2.target = J2;
            h2.relatedTarget = u2;
            F2 = null;
            Wc(e2) === d2 && (t2 = new t2(x2, w2 + "enter", n2, c, e2), t2.target = u2, t2.relatedTarget = J2, F2 = t2);
            J2 = F2;
            if (k3 && n2) b: {
              t2 = k3;
              x2 = n2;
              w2 = 0;
              for (u2 = t2; u2; u2 = vf(u2)) w2++;
              u2 = 0;
              for (F2 = x2; F2; F2 = vf(F2)) u2++;
              for (; 0 < w2 - u2; ) t2 = vf(t2), w2--;
              for (; 0 < u2 - w2; ) x2 = vf(x2), u2--;
              for (; w2--; ) {
                if (t2 === x2 || null !== x2 && t2 === x2.alternate) break b;
                t2 = vf(t2);
                x2 = vf(x2);
              }
              t2 = null;
            }
            else t2 = null;
            null !== k3 && wf(g2, h2, k3, t2, false);
            null !== n2 && null !== J2 && wf(g2, J2, n2, t2, true);
          }
        }
      }
      a: {
        h2 = d2 ? ue(d2) : window;
        k3 = h2.nodeName && h2.nodeName.toLowerCase();
        if ("select" === k3 || "input" === k3 && "file" === h2.type) var na = ve;
        else if (me(h2)) if (we) na = Fe;
        else {
          na = De;
          var xa = Ce;
        }
        else (k3 = h2.nodeName) && "input" === k3.toLowerCase() && ("checkbox" === h2.type || "radio" === h2.type) && (na = Ee);
        if (na && (na = na(a, d2))) {
          ne(g2, na, c, e2);
          break a;
        }
        xa && xa(a, h2, d2);
        "focusout" === a && (xa = h2._wrapperState) && xa.controlled && "number" === h2.type && cb(h2, "number", h2.value);
      }
      xa = d2 ? ue(d2) : window;
      switch (a) {
        case "focusin":
          if (me(xa) || "true" === xa.contentEditable) Qe = xa, Re = d2, Se = null;
          break;
        case "focusout":
          Se = Re = Qe = null;
          break;
        case "mousedown":
          Te = true;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          Te = false;
          Ue(g2, c, e2);
          break;
        case "selectionchange":
          if (Pe) break;
        case "keydown":
        case "keyup":
          Ue(g2, c, e2);
      }
      var $a;
      if (ae) b: {
        switch (a) {
          case "compositionstart":
            var ba = "onCompositionStart";
            break b;
          case "compositionend":
            ba = "onCompositionEnd";
            break b;
          case "compositionupdate":
            ba = "onCompositionUpdate";
            break b;
        }
        ba = void 0;
      }
      else ie ? ge(a, c) && (ba = "onCompositionEnd") : "keydown" === a && 229 === c.keyCode && (ba = "onCompositionStart");
      ba && (de && "ko" !== c.locale && (ie || "onCompositionStart" !== ba ? "onCompositionEnd" === ba && ie && ($a = nd()) : (kd = e2, ld = "value" in kd ? kd.value : kd.textContent, ie = true)), xa = oe(d2, ba), 0 < xa.length && (ba = new Ld(ba, a, null, c, e2), g2.push({ event: ba, listeners: xa }), $a ? ba.data = $a : ($a = he(c), null !== $a && (ba.data = $a))));
      if ($a = ce ? je(a, c) : ke(a, c)) d2 = oe(d2, "onBeforeInput"), 0 < d2.length && (e2 = new Ld("onBeforeInput", "beforeinput", null, c, e2), g2.push({ event: e2, listeners: d2 }), e2.data = $a);
    }
    se(g2, b);
  });
}
function tf(a, b, c) {
  return { instance: a, listener: b, currentTarget: c };
}
function oe(a, b) {
  for (var c = b + "Capture", d = []; null !== a; ) {
    var e = a, f2 = e.stateNode;
    5 === e.tag && null !== f2 && (e = f2, f2 = Kb(a, c), null != f2 && d.unshift(tf(a, f2, e)), f2 = Kb(a, b), null != f2 && d.push(tf(a, f2, e)));
    a = a.return;
  }
  return d;
}
function vf(a) {
  if (null === a) return null;
  do
    a = a.return;
  while (a && 5 !== a.tag);
  return a ? a : null;
}
function wf(a, b, c, d, e) {
  for (var f2 = b._reactName, g = []; null !== c && c !== d; ) {
    var h = c, k2 = h.alternate, l2 = h.stateNode;
    if (null !== k2 && k2 === d) break;
    5 === h.tag && null !== l2 && (h = l2, e ? (k2 = Kb(c, f2), null != k2 && g.unshift(tf(c, k2, h))) : e || (k2 = Kb(c, f2), null != k2 && g.push(tf(c, k2, h))));
    c = c.return;
  }
  0 !== g.length && a.push({ event: b, listeners: g });
}
var xf = /\r\n?/g, yf = /\u0000|\uFFFD/g;
function zf(a) {
  return ("string" === typeof a ? a : "" + a).replace(xf, "\n").replace(yf, "");
}
function Af(a, b, c) {
  b = zf(b);
  if (zf(a) !== b && c) throw Error(p(425));
}
function Bf() {
}
var Cf = null, Df = null;
function Ef(a, b) {
  return "textarea" === a || "noscript" === a || "string" === typeof b.children || "number" === typeof b.children || "object" === typeof b.dangerouslySetInnerHTML && null !== b.dangerouslySetInnerHTML && null != b.dangerouslySetInnerHTML.__html;
}
var Ff = "function" === typeof setTimeout ? setTimeout : void 0, Gf = "function" === typeof clearTimeout ? clearTimeout : void 0, Hf = "function" === typeof Promise ? Promise : void 0, Jf = "function" === typeof queueMicrotask ? queueMicrotask : "undefined" !== typeof Hf ? function(a) {
  return Hf.resolve(null).then(a).catch(If);
} : Ff;
function If(a) {
  setTimeout(function() {
    throw a;
  });
}
function Kf(a, b) {
  var c = b, d = 0;
  do {
    var e = c.nextSibling;
    a.removeChild(c);
    if (e && 8 === e.nodeType) if (c = e.data, "/$" === c) {
      if (0 === d) {
        a.removeChild(e);
        bd(b);
        return;
      }
      d--;
    } else "$" !== c && "$?" !== c && "$!" !== c || d++;
    c = e;
  } while (c);
  bd(b);
}
function Lf(a) {
  for (; null != a; a = a.nextSibling) {
    var b = a.nodeType;
    if (1 === b || 3 === b) break;
    if (8 === b) {
      b = a.data;
      if ("$" === b || "$!" === b || "$?" === b) break;
      if ("/$" === b) return null;
    }
  }
  return a;
}
function Mf(a) {
  a = a.previousSibling;
  for (var b = 0; a; ) {
    if (8 === a.nodeType) {
      var c = a.data;
      if ("$" === c || "$!" === c || "$?" === c) {
        if (0 === b) return a;
        b--;
      } else "/$" === c && b++;
    }
    a = a.previousSibling;
  }
  return null;
}
var Nf = Math.random().toString(36).slice(2), Of = "__reactFiber$" + Nf, Pf = "__reactProps$" + Nf, uf = "__reactContainer$" + Nf, of = "__reactEvents$" + Nf, Qf = "__reactListeners$" + Nf, Rf = "__reactHandles$" + Nf;
function Wc(a) {
  var b = a[Of];
  if (b) return b;
  for (var c = a.parentNode; c; ) {
    if (b = c[uf] || c[Of]) {
      c = b.alternate;
      if (null !== b.child || null !== c && null !== c.child) for (a = Mf(a); null !== a; ) {
        if (c = a[Of]) return c;
        a = Mf(a);
      }
      return b;
    }
    a = c;
    c = a.parentNode;
  }
  return null;
}
function Cb(a) {
  a = a[Of] || a[uf];
  return !a || 5 !== a.tag && 6 !== a.tag && 13 !== a.tag && 3 !== a.tag ? null : a;
}
function ue(a) {
  if (5 === a.tag || 6 === a.tag) return a.stateNode;
  throw Error(p(33));
}
function Db(a) {
  return a[Pf] || null;
}
var Sf = [], Tf = -1;
function Uf(a) {
  return { current: a };
}
function E(a) {
  0 > Tf || (a.current = Sf[Tf], Sf[Tf] = null, Tf--);
}
function G(a, b) {
  Tf++;
  Sf[Tf] = a.current;
  a.current = b;
}
var Vf = {}, H = Uf(Vf), Wf = Uf(false), Xf = Vf;
function Yf(a, b) {
  var c = a.type.contextTypes;
  if (!c) return Vf;
  var d = a.stateNode;
  if (d && d.__reactInternalMemoizedUnmaskedChildContext === b) return d.__reactInternalMemoizedMaskedChildContext;
  var e = {}, f2;
  for (f2 in c) e[f2] = b[f2];
  d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = b, a.__reactInternalMemoizedMaskedChildContext = e);
  return e;
}
function Zf(a) {
  a = a.childContextTypes;
  return null !== a && void 0 !== a;
}
function $f() {
  E(Wf);
  E(H);
}
function ag(a, b, c) {
  if (H.current !== Vf) throw Error(p(168));
  G(H, b);
  G(Wf, c);
}
function bg(a, b, c) {
  var d = a.stateNode;
  b = b.childContextTypes;
  if ("function" !== typeof d.getChildContext) return c;
  d = d.getChildContext();
  for (var e in d) if (!(e in b)) throw Error(p(108, Ra(a) || "Unknown", e));
  return A({}, c, d);
}
function cg(a) {
  a = (a = a.stateNode) && a.__reactInternalMemoizedMergedChildContext || Vf;
  Xf = H.current;
  G(H, a);
  G(Wf, Wf.current);
  return true;
}
function dg(a, b, c) {
  var d = a.stateNode;
  if (!d) throw Error(p(169));
  c ? (a = bg(a, b, Xf), d.__reactInternalMemoizedMergedChildContext = a, E(Wf), E(H), G(H, a)) : E(Wf);
  G(Wf, c);
}
var eg = null, fg = false, gg = false;
function hg(a) {
  null === eg ? eg = [a] : eg.push(a);
}
function ig(a) {
  fg = true;
  hg(a);
}
function jg() {
  if (!gg && null !== eg) {
    gg = true;
    var a = 0, b = C;
    try {
      var c = eg;
      for (C = 1; a < c.length; a++) {
        var d = c[a];
        do
          d = d(true);
        while (null !== d);
      }
      eg = null;
      fg = false;
    } catch (e) {
      throw null !== eg && (eg = eg.slice(a + 1)), ac(fc, jg), e;
    } finally {
      C = b, gg = false;
    }
  }
  return null;
}
var kg = [], lg = 0, mg = null, ng = 0, og = [], pg = 0, qg = null, rg = 1, sg = "";
function tg(a, b) {
  kg[lg++] = ng;
  kg[lg++] = mg;
  mg = a;
  ng = b;
}
function ug(a, b, c) {
  og[pg++] = rg;
  og[pg++] = sg;
  og[pg++] = qg;
  qg = a;
  var d = rg;
  a = sg;
  var e = 32 - oc(d) - 1;
  d &= ~(1 << e);
  c += 1;
  var f2 = 32 - oc(b) + e;
  if (30 < f2) {
    var g = e - e % 5;
    f2 = (d & (1 << g) - 1).toString(32);
    d >>= g;
    e -= g;
    rg = 1 << 32 - oc(b) + e | c << e | d;
    sg = f2 + a;
  } else rg = 1 << f2 | c << e | d, sg = a;
}
function vg(a) {
  null !== a.return && (tg(a, 1), ug(a, 1, 0));
}
function wg(a) {
  for (; a === mg; ) mg = kg[--lg], kg[lg] = null, ng = kg[--lg], kg[lg] = null;
  for (; a === qg; ) qg = og[--pg], og[pg] = null, sg = og[--pg], og[pg] = null, rg = og[--pg], og[pg] = null;
}
var xg = null, yg = null, I = false, zg = null;
function Ag(a, b) {
  var c = Bg(5, null, null, 0);
  c.elementType = "DELETED";
  c.stateNode = b;
  c.return = a;
  b = a.deletions;
  null === b ? (a.deletions = [c], a.flags |= 16) : b.push(c);
}
function Cg(a, b) {
  switch (a.tag) {
    case 5:
      var c = a.type;
      b = 1 !== b.nodeType || c.toLowerCase() !== b.nodeName.toLowerCase() ? null : b;
      return null !== b ? (a.stateNode = b, xg = a, yg = Lf(b.firstChild), true) : false;
    case 6:
      return b = "" === a.pendingProps || 3 !== b.nodeType ? null : b, null !== b ? (a.stateNode = b, xg = a, yg = null, true) : false;
    case 13:
      return b = 8 !== b.nodeType ? null : b, null !== b ? (c = null !== qg ? { id: rg, overflow: sg } : null, a.memoizedState = { dehydrated: b, treeContext: c, retryLane: 1073741824 }, c = Bg(18, null, null, 0), c.stateNode = b, c.return = a, a.child = c, xg = a, yg = null, true) : false;
    default:
      return false;
  }
}
function Dg(a) {
  return 0 !== (a.mode & 1) && 0 === (a.flags & 128);
}
function Eg(a) {
  if (I) {
    var b = yg;
    if (b) {
      var c = b;
      if (!Cg(a, b)) {
        if (Dg(a)) throw Error(p(418));
        b = Lf(c.nextSibling);
        var d = xg;
        b && Cg(a, b) ? Ag(d, c) : (a.flags = a.flags & -4097 | 2, I = false, xg = a);
      }
    } else {
      if (Dg(a)) throw Error(p(418));
      a.flags = a.flags & -4097 | 2;
      I = false;
      xg = a;
    }
  }
}
function Fg(a) {
  for (a = a.return; null !== a && 5 !== a.tag && 3 !== a.tag && 13 !== a.tag; ) a = a.return;
  xg = a;
}
function Gg(a) {
  if (a !== xg) return false;
  if (!I) return Fg(a), I = true, false;
  var b;
  (b = 3 !== a.tag) && !(b = 5 !== a.tag) && (b = a.type, b = "head" !== b && "body" !== b && !Ef(a.type, a.memoizedProps));
  if (b && (b = yg)) {
    if (Dg(a)) throw Hg(), Error(p(418));
    for (; b; ) Ag(a, b), b = Lf(b.nextSibling);
  }
  Fg(a);
  if (13 === a.tag) {
    a = a.memoizedState;
    a = null !== a ? a.dehydrated : null;
    if (!a) throw Error(p(317));
    a: {
      a = a.nextSibling;
      for (b = 0; a; ) {
        if (8 === a.nodeType) {
          var c = a.data;
          if ("/$" === c) {
            if (0 === b) {
              yg = Lf(a.nextSibling);
              break a;
            }
            b--;
          } else "$" !== c && "$!" !== c && "$?" !== c || b++;
        }
        a = a.nextSibling;
      }
      yg = null;
    }
  } else yg = xg ? Lf(a.stateNode.nextSibling) : null;
  return true;
}
function Hg() {
  for (var a = yg; a; ) a = Lf(a.nextSibling);
}
function Ig() {
  yg = xg = null;
  I = false;
}
function Jg(a) {
  null === zg ? zg = [a] : zg.push(a);
}
var Kg = ua.ReactCurrentBatchConfig;
function Lg(a, b, c) {
  a = c.ref;
  if (null !== a && "function" !== typeof a && "object" !== typeof a) {
    if (c._owner) {
      c = c._owner;
      if (c) {
        if (1 !== c.tag) throw Error(p(309));
        var d = c.stateNode;
      }
      if (!d) throw Error(p(147, a));
      var e = d, f2 = "" + a;
      if (null !== b && null !== b.ref && "function" === typeof b.ref && b.ref._stringRef === f2) return b.ref;
      b = function(a2) {
        var b2 = e.refs;
        null === a2 ? delete b2[f2] : b2[f2] = a2;
      };
      b._stringRef = f2;
      return b;
    }
    if ("string" !== typeof a) throw Error(p(284));
    if (!c._owner) throw Error(p(290, a));
  }
  return a;
}
function Mg(a, b) {
  a = Object.prototype.toString.call(b);
  throw Error(p(31, "[object Object]" === a ? "object with keys {" + Object.keys(b).join(", ") + "}" : a));
}
function Ng(a) {
  var b = a._init;
  return b(a._payload);
}
function Og(a) {
  function b(b2, c2) {
    if (a) {
      var d2 = b2.deletions;
      null === d2 ? (b2.deletions = [c2], b2.flags |= 16) : d2.push(c2);
    }
  }
  function c(c2, d2) {
    if (!a) return null;
    for (; null !== d2; ) b(c2, d2), d2 = d2.sibling;
    return null;
  }
  function d(a2, b2) {
    for (a2 = /* @__PURE__ */ new Map(); null !== b2; ) null !== b2.key ? a2.set(b2.key, b2) : a2.set(b2.index, b2), b2 = b2.sibling;
    return a2;
  }
  function e(a2, b2) {
    a2 = Pg(a2, b2);
    a2.index = 0;
    a2.sibling = null;
    return a2;
  }
  function f2(b2, c2, d2) {
    b2.index = d2;
    if (!a) return b2.flags |= 1048576, c2;
    d2 = b2.alternate;
    if (null !== d2) return d2 = d2.index, d2 < c2 ? (b2.flags |= 2, c2) : d2;
    b2.flags |= 2;
    return c2;
  }
  function g(b2) {
    a && null === b2.alternate && (b2.flags |= 2);
    return b2;
  }
  function h(a2, b2, c2, d2) {
    if (null === b2 || 6 !== b2.tag) return b2 = Qg(c2, a2.mode, d2), b2.return = a2, b2;
    b2 = e(b2, c2);
    b2.return = a2;
    return b2;
  }
  function k2(a2, b2, c2, d2) {
    var f3 = c2.type;
    if (f3 === ya) return m2(a2, b2, c2.props.children, d2, c2.key);
    if (null !== b2 && (b2.elementType === f3 || "object" === typeof f3 && null !== f3 && f3.$$typeof === Ha && Ng(f3) === b2.type)) return d2 = e(b2, c2.props), d2.ref = Lg(a2, b2, c2), d2.return = a2, d2;
    d2 = Rg(c2.type, c2.key, c2.props, null, a2.mode, d2);
    d2.ref = Lg(a2, b2, c2);
    d2.return = a2;
    return d2;
  }
  function l2(a2, b2, c2, d2) {
    if (null === b2 || 4 !== b2.tag || b2.stateNode.containerInfo !== c2.containerInfo || b2.stateNode.implementation !== c2.implementation) return b2 = Sg(c2, a2.mode, d2), b2.return = a2, b2;
    b2 = e(b2, c2.children || []);
    b2.return = a2;
    return b2;
  }
  function m2(a2, b2, c2, d2, f3) {
    if (null === b2 || 7 !== b2.tag) return b2 = Tg(c2, a2.mode, d2, f3), b2.return = a2, b2;
    b2 = e(b2, c2);
    b2.return = a2;
    return b2;
  }
  function q2(a2, b2, c2) {
    if ("string" === typeof b2 && "" !== b2 || "number" === typeof b2) return b2 = Qg("" + b2, a2.mode, c2), b2.return = a2, b2;
    if ("object" === typeof b2 && null !== b2) {
      switch (b2.$$typeof) {
        case va:
          return c2 = Rg(b2.type, b2.key, b2.props, null, a2.mode, c2), c2.ref = Lg(a2, null, b2), c2.return = a2, c2;
        case wa:
          return b2 = Sg(b2, a2.mode, c2), b2.return = a2, b2;
        case Ha:
          var d2 = b2._init;
          return q2(a2, d2(b2._payload), c2);
      }
      if (eb(b2) || Ka(b2)) return b2 = Tg(b2, a2.mode, c2, null), b2.return = a2, b2;
      Mg(a2, b2);
    }
    return null;
  }
  function r2(a2, b2, c2, d2) {
    var e2 = null !== b2 ? b2.key : null;
    if ("string" === typeof c2 && "" !== c2 || "number" === typeof c2) return null !== e2 ? null : h(a2, b2, "" + c2, d2);
    if ("object" === typeof c2 && null !== c2) {
      switch (c2.$$typeof) {
        case va:
          return c2.key === e2 ? k2(a2, b2, c2, d2) : null;
        case wa:
          return c2.key === e2 ? l2(a2, b2, c2, d2) : null;
        case Ha:
          return e2 = c2._init, r2(
            a2,
            b2,
            e2(c2._payload),
            d2
          );
      }
      if (eb(c2) || Ka(c2)) return null !== e2 ? null : m2(a2, b2, c2, d2, null);
      Mg(a2, c2);
    }
    return null;
  }
  function y2(a2, b2, c2, d2, e2) {
    if ("string" === typeof d2 && "" !== d2 || "number" === typeof d2) return a2 = a2.get(c2) || null, h(b2, a2, "" + d2, e2);
    if ("object" === typeof d2 && null !== d2) {
      switch (d2.$$typeof) {
        case va:
          return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, k2(b2, a2, d2, e2);
        case wa:
          return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, l2(b2, a2, d2, e2);
        case Ha:
          var f3 = d2._init;
          return y2(a2, b2, c2, f3(d2._payload), e2);
      }
      if (eb(d2) || Ka(d2)) return a2 = a2.get(c2) || null, m2(b2, a2, d2, e2, null);
      Mg(b2, d2);
    }
    return null;
  }
  function n2(e2, g2, h2, k3) {
    for (var l3 = null, m3 = null, u2 = g2, w2 = g2 = 0, x2 = null; null !== u2 && w2 < h2.length; w2++) {
      u2.index > w2 ? (x2 = u2, u2 = null) : x2 = u2.sibling;
      var n3 = r2(e2, u2, h2[w2], k3);
      if (null === n3) {
        null === u2 && (u2 = x2);
        break;
      }
      a && u2 && null === n3.alternate && b(e2, u2);
      g2 = f2(n3, g2, w2);
      null === m3 ? l3 = n3 : m3.sibling = n3;
      m3 = n3;
      u2 = x2;
    }
    if (w2 === h2.length) return c(e2, u2), I && tg(e2, w2), l3;
    if (null === u2) {
      for (; w2 < h2.length; w2++) u2 = q2(e2, h2[w2], k3), null !== u2 && (g2 = f2(u2, g2, w2), null === m3 ? l3 = u2 : m3.sibling = u2, m3 = u2);
      I && tg(e2, w2);
      return l3;
    }
    for (u2 = d(e2, u2); w2 < h2.length; w2++) x2 = y2(u2, e2, w2, h2[w2], k3), null !== x2 && (a && null !== x2.alternate && u2.delete(null === x2.key ? w2 : x2.key), g2 = f2(x2, g2, w2), null === m3 ? l3 = x2 : m3.sibling = x2, m3 = x2);
    a && u2.forEach(function(a2) {
      return b(e2, a2);
    });
    I && tg(e2, w2);
    return l3;
  }
  function t2(e2, g2, h2, k3) {
    var l3 = Ka(h2);
    if ("function" !== typeof l3) throw Error(p(150));
    h2 = l3.call(h2);
    if (null == h2) throw Error(p(151));
    for (var u2 = l3 = null, m3 = g2, w2 = g2 = 0, x2 = null, n3 = h2.next(); null !== m3 && !n3.done; w2++, n3 = h2.next()) {
      m3.index > w2 ? (x2 = m3, m3 = null) : x2 = m3.sibling;
      var t3 = r2(e2, m3, n3.value, k3);
      if (null === t3) {
        null === m3 && (m3 = x2);
        break;
      }
      a && m3 && null === t3.alternate && b(e2, m3);
      g2 = f2(t3, g2, w2);
      null === u2 ? l3 = t3 : u2.sibling = t3;
      u2 = t3;
      m3 = x2;
    }
    if (n3.done) return c(
      e2,
      m3
    ), I && tg(e2, w2), l3;
    if (null === m3) {
      for (; !n3.done; w2++, n3 = h2.next()) n3 = q2(e2, n3.value, k3), null !== n3 && (g2 = f2(n3, g2, w2), null === u2 ? l3 = n3 : u2.sibling = n3, u2 = n3);
      I && tg(e2, w2);
      return l3;
    }
    for (m3 = d(e2, m3); !n3.done; w2++, n3 = h2.next()) n3 = y2(m3, e2, w2, n3.value, k3), null !== n3 && (a && null !== n3.alternate && m3.delete(null === n3.key ? w2 : n3.key), g2 = f2(n3, g2, w2), null === u2 ? l3 = n3 : u2.sibling = n3, u2 = n3);
    a && m3.forEach(function(a2) {
      return b(e2, a2);
    });
    I && tg(e2, w2);
    return l3;
  }
  function J2(a2, d2, f3, h2) {
    "object" === typeof f3 && null !== f3 && f3.type === ya && null === f3.key && (f3 = f3.props.children);
    if ("object" === typeof f3 && null !== f3) {
      switch (f3.$$typeof) {
        case va:
          a: {
            for (var k3 = f3.key, l3 = d2; null !== l3; ) {
              if (l3.key === k3) {
                k3 = f3.type;
                if (k3 === ya) {
                  if (7 === l3.tag) {
                    c(a2, l3.sibling);
                    d2 = e(l3, f3.props.children);
                    d2.return = a2;
                    a2 = d2;
                    break a;
                  }
                } else if (l3.elementType === k3 || "object" === typeof k3 && null !== k3 && k3.$$typeof === Ha && Ng(k3) === l3.type) {
                  c(a2, l3.sibling);
                  d2 = e(l3, f3.props);
                  d2.ref = Lg(a2, l3, f3);
                  d2.return = a2;
                  a2 = d2;
                  break a;
                }
                c(a2, l3);
                break;
              } else b(a2, l3);
              l3 = l3.sibling;
            }
            f3.type === ya ? (d2 = Tg(f3.props.children, a2.mode, h2, f3.key), d2.return = a2, a2 = d2) : (h2 = Rg(f3.type, f3.key, f3.props, null, a2.mode, h2), h2.ref = Lg(a2, d2, f3), h2.return = a2, a2 = h2);
          }
          return g(a2);
        case wa:
          a: {
            for (l3 = f3.key; null !== d2; ) {
              if (d2.key === l3) if (4 === d2.tag && d2.stateNode.containerInfo === f3.containerInfo && d2.stateNode.implementation === f3.implementation) {
                c(a2, d2.sibling);
                d2 = e(d2, f3.children || []);
                d2.return = a2;
                a2 = d2;
                break a;
              } else {
                c(a2, d2);
                break;
              }
              else b(a2, d2);
              d2 = d2.sibling;
            }
            d2 = Sg(f3, a2.mode, h2);
            d2.return = a2;
            a2 = d2;
          }
          return g(a2);
        case Ha:
          return l3 = f3._init, J2(a2, d2, l3(f3._payload), h2);
      }
      if (eb(f3)) return n2(a2, d2, f3, h2);
      if (Ka(f3)) return t2(a2, d2, f3, h2);
      Mg(a2, f3);
    }
    return "string" === typeof f3 && "" !== f3 || "number" === typeof f3 ? (f3 = "" + f3, null !== d2 && 6 === d2.tag ? (c(a2, d2.sibling), d2 = e(d2, f3), d2.return = a2, a2 = d2) : (c(a2, d2), d2 = Qg(f3, a2.mode, h2), d2.return = a2, a2 = d2), g(a2)) : c(a2, d2);
  }
  return J2;
}
var Ug = Og(true), Vg = Og(false), Wg = Uf(null), Xg = null, Yg = null, Zg = null;
function $g() {
  Zg = Yg = Xg = null;
}
function ah(a) {
  var b = Wg.current;
  E(Wg);
  a._currentValue = b;
}
function bh(a, b, c) {
  for (; null !== a; ) {
    var d = a.alternate;
    (a.childLanes & b) !== b ? (a.childLanes |= b, null !== d && (d.childLanes |= b)) : null !== d && (d.childLanes & b) !== b && (d.childLanes |= b);
    if (a === c) break;
    a = a.return;
  }
}
function ch(a, b) {
  Xg = a;
  Zg = Yg = null;
  a = a.dependencies;
  null !== a && null !== a.firstContext && (0 !== (a.lanes & b) && (dh = true), a.firstContext = null);
}
function eh(a) {
  var b = a._currentValue;
  if (Zg !== a) if (a = { context: a, memoizedValue: b, next: null }, null === Yg) {
    if (null === Xg) throw Error(p(308));
    Yg = a;
    Xg.dependencies = { lanes: 0, firstContext: a };
  } else Yg = Yg.next = a;
  return b;
}
var fh = null;
function gh(a) {
  null === fh ? fh = [a] : fh.push(a);
}
function hh(a, b, c, d) {
  var e = b.interleaved;
  null === e ? (c.next = c, gh(b)) : (c.next = e.next, e.next = c);
  b.interleaved = c;
  return ih(a, d);
}
function ih(a, b) {
  a.lanes |= b;
  var c = a.alternate;
  null !== c && (c.lanes |= b);
  c = a;
  for (a = a.return; null !== a; ) a.childLanes |= b, c = a.alternate, null !== c && (c.childLanes |= b), c = a, a = a.return;
  return 3 === c.tag ? c.stateNode : null;
}
var jh = false;
function kh(a) {
  a.updateQueue = { baseState: a.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
}
function lh(a, b) {
  a = a.updateQueue;
  b.updateQueue === a && (b.updateQueue = { baseState: a.baseState, firstBaseUpdate: a.firstBaseUpdate, lastBaseUpdate: a.lastBaseUpdate, shared: a.shared, effects: a.effects });
}
function mh(a, b) {
  return { eventTime: a, lane: b, tag: 0, payload: null, callback: null, next: null };
}
function nh(a, b, c) {
  var d = a.updateQueue;
  if (null === d) return null;
  d = d.shared;
  if (0 !== (K & 2)) {
    var e = d.pending;
    null === e ? b.next = b : (b.next = e.next, e.next = b);
    d.pending = b;
    return ih(a, c);
  }
  e = d.interleaved;
  null === e ? (b.next = b, gh(d)) : (b.next = e.next, e.next = b);
  d.interleaved = b;
  return ih(a, c);
}
function oh(a, b, c) {
  b = b.updateQueue;
  if (null !== b && (b = b.shared, 0 !== (c & 4194240))) {
    var d = b.lanes;
    d &= a.pendingLanes;
    c |= d;
    b.lanes = c;
    Cc(a, c);
  }
}
function ph(a, b) {
  var c = a.updateQueue, d = a.alternate;
  if (null !== d && (d = d.updateQueue, c === d)) {
    var e = null, f2 = null;
    c = c.firstBaseUpdate;
    if (null !== c) {
      do {
        var g = { eventTime: c.eventTime, lane: c.lane, tag: c.tag, payload: c.payload, callback: c.callback, next: null };
        null === f2 ? e = f2 = g : f2 = f2.next = g;
        c = c.next;
      } while (null !== c);
      null === f2 ? e = f2 = b : f2 = f2.next = b;
    } else e = f2 = b;
    c = { baseState: d.baseState, firstBaseUpdate: e, lastBaseUpdate: f2, shared: d.shared, effects: d.effects };
    a.updateQueue = c;
    return;
  }
  a = c.lastBaseUpdate;
  null === a ? c.firstBaseUpdate = b : a.next = b;
  c.lastBaseUpdate = b;
}
function qh(a, b, c, d) {
  var e = a.updateQueue;
  jh = false;
  var f2 = e.firstBaseUpdate, g = e.lastBaseUpdate, h = e.shared.pending;
  if (null !== h) {
    e.shared.pending = null;
    var k2 = h, l2 = k2.next;
    k2.next = null;
    null === g ? f2 = l2 : g.next = l2;
    g = k2;
    var m2 = a.alternate;
    null !== m2 && (m2 = m2.updateQueue, h = m2.lastBaseUpdate, h !== g && (null === h ? m2.firstBaseUpdate = l2 : h.next = l2, m2.lastBaseUpdate = k2));
  }
  if (null !== f2) {
    var q2 = e.baseState;
    g = 0;
    m2 = l2 = k2 = null;
    h = f2;
    do {
      var r2 = h.lane, y2 = h.eventTime;
      if ((d & r2) === r2) {
        null !== m2 && (m2 = m2.next = {
          eventTime: y2,
          lane: 0,
          tag: h.tag,
          payload: h.payload,
          callback: h.callback,
          next: null
        });
        a: {
          var n2 = a, t2 = h;
          r2 = b;
          y2 = c;
          switch (t2.tag) {
            case 1:
              n2 = t2.payload;
              if ("function" === typeof n2) {
                q2 = n2.call(y2, q2, r2);
                break a;
              }
              q2 = n2;
              break a;
            case 3:
              n2.flags = n2.flags & -65537 | 128;
            case 0:
              n2 = t2.payload;
              r2 = "function" === typeof n2 ? n2.call(y2, q2, r2) : n2;
              if (null === r2 || void 0 === r2) break a;
              q2 = A({}, q2, r2);
              break a;
            case 2:
              jh = true;
          }
        }
        null !== h.callback && 0 !== h.lane && (a.flags |= 64, r2 = e.effects, null === r2 ? e.effects = [h] : r2.push(h));
      } else y2 = { eventTime: y2, lane: r2, tag: h.tag, payload: h.payload, callback: h.callback, next: null }, null === m2 ? (l2 = m2 = y2, k2 = q2) : m2 = m2.next = y2, g |= r2;
      h = h.next;
      if (null === h) if (h = e.shared.pending, null === h) break;
      else r2 = h, h = r2.next, r2.next = null, e.lastBaseUpdate = r2, e.shared.pending = null;
    } while (1);
    null === m2 && (k2 = q2);
    e.baseState = k2;
    e.firstBaseUpdate = l2;
    e.lastBaseUpdate = m2;
    b = e.shared.interleaved;
    if (null !== b) {
      e = b;
      do
        g |= e.lane, e = e.next;
      while (e !== b);
    } else null === f2 && (e.shared.lanes = 0);
    rh |= g;
    a.lanes = g;
    a.memoizedState = q2;
  }
}
function sh(a, b, c) {
  a = b.effects;
  b.effects = null;
  if (null !== a) for (b = 0; b < a.length; b++) {
    var d = a[b], e = d.callback;
    if (null !== e) {
      d.callback = null;
      d = c;
      if ("function" !== typeof e) throw Error(p(191, e));
      e.call(d);
    }
  }
}
var th = {}, uh = Uf(th), vh = Uf(th), wh = Uf(th);
function xh(a) {
  if (a === th) throw Error(p(174));
  return a;
}
function yh(a, b) {
  G(wh, b);
  G(vh, a);
  G(uh, th);
  a = b.nodeType;
  switch (a) {
    case 9:
    case 11:
      b = (b = b.documentElement) ? b.namespaceURI : lb(null, "");
      break;
    default:
      a = 8 === a ? b.parentNode : b, b = a.namespaceURI || null, a = a.tagName, b = lb(b, a);
  }
  E(uh);
  G(uh, b);
}
function zh() {
  E(uh);
  E(vh);
  E(wh);
}
function Ah(a) {
  xh(wh.current);
  var b = xh(uh.current);
  var c = lb(b, a.type);
  b !== c && (G(vh, a), G(uh, c));
}
function Bh(a) {
  vh.current === a && (E(uh), E(vh));
}
var L = Uf(0);
function Ch(a) {
  for (var b = a; null !== b; ) {
    if (13 === b.tag) {
      var c = b.memoizedState;
      if (null !== c && (c = c.dehydrated, null === c || "$?" === c.data || "$!" === c.data)) return b;
    } else if (19 === b.tag && void 0 !== b.memoizedProps.revealOrder) {
      if (0 !== (b.flags & 128)) return b;
    } else if (null !== b.child) {
      b.child.return = b;
      b = b.child;
      continue;
    }
    if (b === a) break;
    for (; null === b.sibling; ) {
      if (null === b.return || b.return === a) return null;
      b = b.return;
    }
    b.sibling.return = b.return;
    b = b.sibling;
  }
  return null;
}
var Dh = [];
function Eh() {
  for (var a = 0; a < Dh.length; a++) Dh[a]._workInProgressVersionPrimary = null;
  Dh.length = 0;
}
var Fh = ua.ReactCurrentDispatcher, Gh = ua.ReactCurrentBatchConfig, Hh = 0, M = null, N = null, O = null, Ih = false, Jh = false, Kh = 0, Lh = 0;
function P() {
  throw Error(p(321));
}
function Mh(a, b) {
  if (null === b) return false;
  for (var c = 0; c < b.length && c < a.length; c++) if (!He(a[c], b[c])) return false;
  return true;
}
function Nh(a, b, c, d, e, f2) {
  Hh = f2;
  M = b;
  b.memoizedState = null;
  b.updateQueue = null;
  b.lanes = 0;
  Fh.current = null === a || null === a.memoizedState ? Oh : Ph;
  a = c(d, e);
  if (Jh) {
    f2 = 0;
    do {
      Jh = false;
      Kh = 0;
      if (25 <= f2) throw Error(p(301));
      f2 += 1;
      O = N = null;
      b.updateQueue = null;
      Fh.current = Qh;
      a = c(d, e);
    } while (Jh);
  }
  Fh.current = Rh;
  b = null !== N && null !== N.next;
  Hh = 0;
  O = N = M = null;
  Ih = false;
  if (b) throw Error(p(300));
  return a;
}
function Sh() {
  var a = 0 !== Kh;
  Kh = 0;
  return a;
}
function Th() {
  var a = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  null === O ? M.memoizedState = O = a : O = O.next = a;
  return O;
}
function Uh() {
  if (null === N) {
    var a = M.alternate;
    a = null !== a ? a.memoizedState : null;
  } else a = N.next;
  var b = null === O ? M.memoizedState : O.next;
  if (null !== b) O = b, N = a;
  else {
    if (null === a) throw Error(p(310));
    N = a;
    a = { memoizedState: N.memoizedState, baseState: N.baseState, baseQueue: N.baseQueue, queue: N.queue, next: null };
    null === O ? M.memoizedState = O = a : O = O.next = a;
  }
  return O;
}
function Vh(a, b) {
  return "function" === typeof b ? b(a) : b;
}
function Wh(a) {
  var b = Uh(), c = b.queue;
  if (null === c) throw Error(p(311));
  c.lastRenderedReducer = a;
  var d = N, e = d.baseQueue, f2 = c.pending;
  if (null !== f2) {
    if (null !== e) {
      var g = e.next;
      e.next = f2.next;
      f2.next = g;
    }
    d.baseQueue = e = f2;
    c.pending = null;
  }
  if (null !== e) {
    f2 = e.next;
    d = d.baseState;
    var h = g = null, k2 = null, l2 = f2;
    do {
      var m2 = l2.lane;
      if ((Hh & m2) === m2) null !== k2 && (k2 = k2.next = { lane: 0, action: l2.action, hasEagerState: l2.hasEagerState, eagerState: l2.eagerState, next: null }), d = l2.hasEagerState ? l2.eagerState : a(d, l2.action);
      else {
        var q2 = {
          lane: m2,
          action: l2.action,
          hasEagerState: l2.hasEagerState,
          eagerState: l2.eagerState,
          next: null
        };
        null === k2 ? (h = k2 = q2, g = d) : k2 = k2.next = q2;
        M.lanes |= m2;
        rh |= m2;
      }
      l2 = l2.next;
    } while (null !== l2 && l2 !== f2);
    null === k2 ? g = d : k2.next = h;
    He(d, b.memoizedState) || (dh = true);
    b.memoizedState = d;
    b.baseState = g;
    b.baseQueue = k2;
    c.lastRenderedState = d;
  }
  a = c.interleaved;
  if (null !== a) {
    e = a;
    do
      f2 = e.lane, M.lanes |= f2, rh |= f2, e = e.next;
    while (e !== a);
  } else null === e && (c.lanes = 0);
  return [b.memoizedState, c.dispatch];
}
function Xh(a) {
  var b = Uh(), c = b.queue;
  if (null === c) throw Error(p(311));
  c.lastRenderedReducer = a;
  var d = c.dispatch, e = c.pending, f2 = b.memoizedState;
  if (null !== e) {
    c.pending = null;
    var g = e = e.next;
    do
      f2 = a(f2, g.action), g = g.next;
    while (g !== e);
    He(f2, b.memoizedState) || (dh = true);
    b.memoizedState = f2;
    null === b.baseQueue && (b.baseState = f2);
    c.lastRenderedState = f2;
  }
  return [f2, d];
}
function Yh() {
}
function Zh(a, b) {
  var c = M, d = Uh(), e = b(), f2 = !He(d.memoizedState, e);
  f2 && (d.memoizedState = e, dh = true);
  d = d.queue;
  $h(ai.bind(null, c, d, a), [a]);
  if (d.getSnapshot !== b || f2 || null !== O && O.memoizedState.tag & 1) {
    c.flags |= 2048;
    bi(9, ci.bind(null, c, d, e, b), void 0, null);
    if (null === Q) throw Error(p(349));
    0 !== (Hh & 30) || di(c, b, e);
  }
  return e;
}
function di(a, b, c) {
  a.flags |= 16384;
  a = { getSnapshot: b, value: c };
  b = M.updateQueue;
  null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.stores = [a]) : (c = b.stores, null === c ? b.stores = [a] : c.push(a));
}
function ci(a, b, c, d) {
  b.value = c;
  b.getSnapshot = d;
  ei(b) && fi(a);
}
function ai(a, b, c) {
  return c(function() {
    ei(b) && fi(a);
  });
}
function ei(a) {
  var b = a.getSnapshot;
  a = a.value;
  try {
    var c = b();
    return !He(a, c);
  } catch (d) {
    return true;
  }
}
function fi(a) {
  var b = ih(a, 1);
  null !== b && gi(b, a, 1, -1);
}
function hi(a) {
  var b = Th();
  "function" === typeof a && (a = a());
  b.memoizedState = b.baseState = a;
  a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Vh, lastRenderedState: a };
  b.queue = a;
  a = a.dispatch = ii.bind(null, M, a);
  return [b.memoizedState, a];
}
function bi(a, b, c, d) {
  a = { tag: a, create: b, destroy: c, deps: d, next: null };
  b = M.updateQueue;
  null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.lastEffect = a.next = a) : (c = b.lastEffect, null === c ? b.lastEffect = a.next = a : (d = c.next, c.next = a, a.next = d, b.lastEffect = a));
  return a;
}
function ji() {
  return Uh().memoizedState;
}
function ki(a, b, c, d) {
  var e = Th();
  M.flags |= a;
  e.memoizedState = bi(1 | b, c, void 0, void 0 === d ? null : d);
}
function li(a, b, c, d) {
  var e = Uh();
  d = void 0 === d ? null : d;
  var f2 = void 0;
  if (null !== N) {
    var g = N.memoizedState;
    f2 = g.destroy;
    if (null !== d && Mh(d, g.deps)) {
      e.memoizedState = bi(b, c, f2, d);
      return;
    }
  }
  M.flags |= a;
  e.memoizedState = bi(1 | b, c, f2, d);
}
function mi(a, b) {
  return ki(8390656, 8, a, b);
}
function $h(a, b) {
  return li(2048, 8, a, b);
}
function ni(a, b) {
  return li(4, 2, a, b);
}
function oi(a, b) {
  return li(4, 4, a, b);
}
function pi(a, b) {
  if ("function" === typeof b) return a = a(), b(a), function() {
    b(null);
  };
  if (null !== b && void 0 !== b) return a = a(), b.current = a, function() {
    b.current = null;
  };
}
function qi(a, b, c) {
  c = null !== c && void 0 !== c ? c.concat([a]) : null;
  return li(4, 4, pi.bind(null, b, a), c);
}
function ri() {
}
function si(a, b) {
  var c = Uh();
  b = void 0 === b ? null : b;
  var d = c.memoizedState;
  if (null !== d && null !== b && Mh(b, d[1])) return d[0];
  c.memoizedState = [a, b];
  return a;
}
function ti(a, b) {
  var c = Uh();
  b = void 0 === b ? null : b;
  var d = c.memoizedState;
  if (null !== d && null !== b && Mh(b, d[1])) return d[0];
  a = a();
  c.memoizedState = [a, b];
  return a;
}
function ui(a, b, c) {
  if (0 === (Hh & 21)) return a.baseState && (a.baseState = false, dh = true), a.memoizedState = c;
  He(c, b) || (c = yc(), M.lanes |= c, rh |= c, a.baseState = true);
  return b;
}
function vi(a, b) {
  var c = C;
  C = 0 !== c && 4 > c ? c : 4;
  a(true);
  var d = Gh.transition;
  Gh.transition = {};
  try {
    a(false), b();
  } finally {
    C = c, Gh.transition = d;
  }
}
function wi() {
  return Uh().memoizedState;
}
function xi(a, b, c) {
  var d = yi(a);
  c = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
  if (zi(a)) Ai(b, c);
  else if (c = hh(a, b, c, d), null !== c) {
    var e = R();
    gi(c, a, d, e);
    Bi(c, b, d);
  }
}
function ii(a, b, c) {
  var d = yi(a), e = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
  if (zi(a)) Ai(b, e);
  else {
    var f2 = a.alternate;
    if (0 === a.lanes && (null === f2 || 0 === f2.lanes) && (f2 = b.lastRenderedReducer, null !== f2)) try {
      var g = b.lastRenderedState, h = f2(g, c);
      e.hasEagerState = true;
      e.eagerState = h;
      if (He(h, g)) {
        var k2 = b.interleaved;
        null === k2 ? (e.next = e, gh(b)) : (e.next = k2.next, k2.next = e);
        b.interleaved = e;
        return;
      }
    } catch (l2) {
    } finally {
    }
    c = hh(a, b, e, d);
    null !== c && (e = R(), gi(c, a, d, e), Bi(c, b, d));
  }
}
function zi(a) {
  var b = a.alternate;
  return a === M || null !== b && b === M;
}
function Ai(a, b) {
  Jh = Ih = true;
  var c = a.pending;
  null === c ? b.next = b : (b.next = c.next, c.next = b);
  a.pending = b;
}
function Bi(a, b, c) {
  if (0 !== (c & 4194240)) {
    var d = b.lanes;
    d &= a.pendingLanes;
    c |= d;
    b.lanes = c;
    Cc(a, c);
  }
}
var Rh = { readContext: eh, useCallback: P, useContext: P, useEffect: P, useImperativeHandle: P, useInsertionEffect: P, useLayoutEffect: P, useMemo: P, useReducer: P, useRef: P, useState: P, useDebugValue: P, useDeferredValue: P, useTransition: P, useMutableSource: P, useSyncExternalStore: P, useId: P, unstable_isNewReconciler: false }, Oh = { readContext: eh, useCallback: function(a, b) {
  Th().memoizedState = [a, void 0 === b ? null : b];
  return a;
}, useContext: eh, useEffect: mi, useImperativeHandle: function(a, b, c) {
  c = null !== c && void 0 !== c ? c.concat([a]) : null;
  return ki(
    4194308,
    4,
    pi.bind(null, b, a),
    c
  );
}, useLayoutEffect: function(a, b) {
  return ki(4194308, 4, a, b);
}, useInsertionEffect: function(a, b) {
  return ki(4, 2, a, b);
}, useMemo: function(a, b) {
  var c = Th();
  b = void 0 === b ? null : b;
  a = a();
  c.memoizedState = [a, b];
  return a;
}, useReducer: function(a, b, c) {
  var d = Th();
  b = void 0 !== c ? c(b) : b;
  d.memoizedState = d.baseState = b;
  a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: a, lastRenderedState: b };
  d.queue = a;
  a = a.dispatch = xi.bind(null, M, a);
  return [d.memoizedState, a];
}, useRef: function(a) {
  var b = Th();
  a = { current: a };
  return b.memoizedState = a;
}, useState: hi, useDebugValue: ri, useDeferredValue: function(a) {
  return Th().memoizedState = a;
}, useTransition: function() {
  var a = hi(false), b = a[0];
  a = vi.bind(null, a[1]);
  Th().memoizedState = a;
  return [b, a];
}, useMutableSource: function() {
}, useSyncExternalStore: function(a, b, c) {
  var d = M, e = Th();
  if (I) {
    if (void 0 === c) throw Error(p(407));
    c = c();
  } else {
    c = b();
    if (null === Q) throw Error(p(349));
    0 !== (Hh & 30) || di(d, b, c);
  }
  e.memoizedState = c;
  var f2 = { value: c, getSnapshot: b };
  e.queue = f2;
  mi(ai.bind(
    null,
    d,
    f2,
    a
  ), [a]);
  d.flags |= 2048;
  bi(9, ci.bind(null, d, f2, c, b), void 0, null);
  return c;
}, useId: function() {
  var a = Th(), b = Q.identifierPrefix;
  if (I) {
    var c = sg;
    var d = rg;
    c = (d & ~(1 << 32 - oc(d) - 1)).toString(32) + c;
    b = ":" + b + "R" + c;
    c = Kh++;
    0 < c && (b += "H" + c.toString(32));
    b += ":";
  } else c = Lh++, b = ":" + b + "r" + c.toString(32) + ":";
  return a.memoizedState = b;
}, unstable_isNewReconciler: false }, Ph = {
  readContext: eh,
  useCallback: si,
  useContext: eh,
  useEffect: $h,
  useImperativeHandle: qi,
  useInsertionEffect: ni,
  useLayoutEffect: oi,
  useMemo: ti,
  useReducer: Wh,
  useRef: ji,
  useState: function() {
    return Wh(Vh);
  },
  useDebugValue: ri,
  useDeferredValue: function(a) {
    var b = Uh();
    return ui(b, N.memoizedState, a);
  },
  useTransition: function() {
    var a = Wh(Vh)[0], b = Uh().memoizedState;
    return [a, b];
  },
  useMutableSource: Yh,
  useSyncExternalStore: Zh,
  useId: wi,
  unstable_isNewReconciler: false
}, Qh = { readContext: eh, useCallback: si, useContext: eh, useEffect: $h, useImperativeHandle: qi, useInsertionEffect: ni, useLayoutEffect: oi, useMemo: ti, useReducer: Xh, useRef: ji, useState: function() {
  return Xh(Vh);
}, useDebugValue: ri, useDeferredValue: function(a) {
  var b = Uh();
  return null === N ? b.memoizedState = a : ui(b, N.memoizedState, a);
}, useTransition: function() {
  var a = Xh(Vh)[0], b = Uh().memoizedState;
  return [a, b];
}, useMutableSource: Yh, useSyncExternalStore: Zh, useId: wi, unstable_isNewReconciler: false };
function Ci(a, b) {
  if (a && a.defaultProps) {
    b = A({}, b);
    a = a.defaultProps;
    for (var c in a) void 0 === b[c] && (b[c] = a[c]);
    return b;
  }
  return b;
}
function Di(a, b, c, d) {
  b = a.memoizedState;
  c = c(d, b);
  c = null === c || void 0 === c ? b : A({}, b, c);
  a.memoizedState = c;
  0 === a.lanes && (a.updateQueue.baseState = c);
}
var Ei = { isMounted: function(a) {
  return (a = a._reactInternals) ? Vb(a) === a : false;
}, enqueueSetState: function(a, b, c) {
  a = a._reactInternals;
  var d = R(), e = yi(a), f2 = mh(d, e);
  f2.payload = b;
  void 0 !== c && null !== c && (f2.callback = c);
  b = nh(a, f2, e);
  null !== b && (gi(b, a, e, d), oh(b, a, e));
}, enqueueReplaceState: function(a, b, c) {
  a = a._reactInternals;
  var d = R(), e = yi(a), f2 = mh(d, e);
  f2.tag = 1;
  f2.payload = b;
  void 0 !== c && null !== c && (f2.callback = c);
  b = nh(a, f2, e);
  null !== b && (gi(b, a, e, d), oh(b, a, e));
}, enqueueForceUpdate: function(a, b) {
  a = a._reactInternals;
  var c = R(), d = yi(a), e = mh(c, d);
  e.tag = 2;
  void 0 !== b && null !== b && (e.callback = b);
  b = nh(a, e, d);
  null !== b && (gi(b, a, d, c), oh(b, a, d));
} };
function Fi(a, b, c, d, e, f2, g) {
  a = a.stateNode;
  return "function" === typeof a.shouldComponentUpdate ? a.shouldComponentUpdate(d, f2, g) : b.prototype && b.prototype.isPureReactComponent ? !Ie(c, d) || !Ie(e, f2) : true;
}
function Gi(a, b, c) {
  var d = false, e = Vf;
  var f2 = b.contextType;
  "object" === typeof f2 && null !== f2 ? f2 = eh(f2) : (e = Zf(b) ? Xf : H.current, d = b.contextTypes, f2 = (d = null !== d && void 0 !== d) ? Yf(a, e) : Vf);
  b = new b(c, f2);
  a.memoizedState = null !== b.state && void 0 !== b.state ? b.state : null;
  b.updater = Ei;
  a.stateNode = b;
  b._reactInternals = a;
  d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = e, a.__reactInternalMemoizedMaskedChildContext = f2);
  return b;
}
function Hi(a, b, c, d) {
  a = b.state;
  "function" === typeof b.componentWillReceiveProps && b.componentWillReceiveProps(c, d);
  "function" === typeof b.UNSAFE_componentWillReceiveProps && b.UNSAFE_componentWillReceiveProps(c, d);
  b.state !== a && Ei.enqueueReplaceState(b, b.state, null);
}
function Ii(a, b, c, d) {
  var e = a.stateNode;
  e.props = c;
  e.state = a.memoizedState;
  e.refs = {};
  kh(a);
  var f2 = b.contextType;
  "object" === typeof f2 && null !== f2 ? e.context = eh(f2) : (f2 = Zf(b) ? Xf : H.current, e.context = Yf(a, f2));
  e.state = a.memoizedState;
  f2 = b.getDerivedStateFromProps;
  "function" === typeof f2 && (Di(a, b, f2, c), e.state = a.memoizedState);
  "function" === typeof b.getDerivedStateFromProps || "function" === typeof e.getSnapshotBeforeUpdate || "function" !== typeof e.UNSAFE_componentWillMount && "function" !== typeof e.componentWillMount || (b = e.state, "function" === typeof e.componentWillMount && e.componentWillMount(), "function" === typeof e.UNSAFE_componentWillMount && e.UNSAFE_componentWillMount(), b !== e.state && Ei.enqueueReplaceState(e, e.state, null), qh(a, c, e, d), e.state = a.memoizedState);
  "function" === typeof e.componentDidMount && (a.flags |= 4194308);
}
function Ji(a, b) {
  try {
    var c = "", d = b;
    do
      c += Pa(d), d = d.return;
    while (d);
    var e = c;
  } catch (f2) {
    e = "\nError generating stack: " + f2.message + "\n" + f2.stack;
  }
  return { value: a, source: b, stack: e, digest: null };
}
function Ki(a, b, c) {
  return { value: a, source: null, stack: null != c ? c : null, digest: null != b ? b : null };
}
function Li(a, b) {
  try {
    console.error(b.value);
  } catch (c) {
    setTimeout(function() {
      throw c;
    });
  }
}
var Mi = "function" === typeof WeakMap ? WeakMap : Map;
function Ni(a, b, c) {
  c = mh(-1, c);
  c.tag = 3;
  c.payload = { element: null };
  var d = b.value;
  c.callback = function() {
    Oi || (Oi = true, Pi = d);
    Li(a, b);
  };
  return c;
}
function Qi(a, b, c) {
  c = mh(-1, c);
  c.tag = 3;
  var d = a.type.getDerivedStateFromError;
  if ("function" === typeof d) {
    var e = b.value;
    c.payload = function() {
      return d(e);
    };
    c.callback = function() {
      Li(a, b);
    };
  }
  var f2 = a.stateNode;
  null !== f2 && "function" === typeof f2.componentDidCatch && (c.callback = function() {
    Li(a, b);
    "function" !== typeof d && (null === Ri ? Ri = /* @__PURE__ */ new Set([this]) : Ri.add(this));
    var c2 = b.stack;
    this.componentDidCatch(b.value, { componentStack: null !== c2 ? c2 : "" });
  });
  return c;
}
function Si(a, b, c) {
  var d = a.pingCache;
  if (null === d) {
    d = a.pingCache = new Mi();
    var e = /* @__PURE__ */ new Set();
    d.set(b, e);
  } else e = d.get(b), void 0 === e && (e = /* @__PURE__ */ new Set(), d.set(b, e));
  e.has(c) || (e.add(c), a = Ti.bind(null, a, b, c), b.then(a, a));
}
function Ui(a) {
  do {
    var b;
    if (b = 13 === a.tag) b = a.memoizedState, b = null !== b ? null !== b.dehydrated ? true : false : true;
    if (b) return a;
    a = a.return;
  } while (null !== a);
  return null;
}
function Vi(a, b, c, d, e) {
  if (0 === (a.mode & 1)) return a === b ? a.flags |= 65536 : (a.flags |= 128, c.flags |= 131072, c.flags &= -52805, 1 === c.tag && (null === c.alternate ? c.tag = 17 : (b = mh(-1, 1), b.tag = 2, nh(c, b, 1))), c.lanes |= 1), a;
  a.flags |= 65536;
  a.lanes = e;
  return a;
}
var Wi = ua.ReactCurrentOwner, dh = false;
function Xi(a, b, c, d) {
  b.child = null === a ? Vg(b, null, c, d) : Ug(b, a.child, c, d);
}
function Yi(a, b, c, d, e) {
  c = c.render;
  var f2 = b.ref;
  ch(b, e);
  d = Nh(a, b, c, d, f2, e);
  c = Sh();
  if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
  I && c && vg(b);
  b.flags |= 1;
  Xi(a, b, d, e);
  return b.child;
}
function $i(a, b, c, d, e) {
  if (null === a) {
    var f2 = c.type;
    if ("function" === typeof f2 && !aj(f2) && void 0 === f2.defaultProps && null === c.compare && void 0 === c.defaultProps) return b.tag = 15, b.type = f2, bj(a, b, f2, d, e);
    a = Rg(c.type, null, d, b, b.mode, e);
    a.ref = b.ref;
    a.return = b;
    return b.child = a;
  }
  f2 = a.child;
  if (0 === (a.lanes & e)) {
    var g = f2.memoizedProps;
    c = c.compare;
    c = null !== c ? c : Ie;
    if (c(g, d) && a.ref === b.ref) return Zi(a, b, e);
  }
  b.flags |= 1;
  a = Pg(f2, d);
  a.ref = b.ref;
  a.return = b;
  return b.child = a;
}
function bj(a, b, c, d, e) {
  if (null !== a) {
    var f2 = a.memoizedProps;
    if (Ie(f2, d) && a.ref === b.ref) if (dh = false, b.pendingProps = d = f2, 0 !== (a.lanes & e)) 0 !== (a.flags & 131072) && (dh = true);
    else return b.lanes = a.lanes, Zi(a, b, e);
  }
  return cj(a, b, c, d, e);
}
function dj(a, b, c) {
  var d = b.pendingProps, e = d.children, f2 = null !== a ? a.memoizedState : null;
  if ("hidden" === d.mode) if (0 === (b.mode & 1)) b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, G(ej, fj), fj |= c;
  else {
    if (0 === (c & 1073741824)) return a = null !== f2 ? f2.baseLanes | c : c, b.lanes = b.childLanes = 1073741824, b.memoizedState = { baseLanes: a, cachePool: null, transitions: null }, b.updateQueue = null, G(ej, fj), fj |= a, null;
    b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null };
    d = null !== f2 ? f2.baseLanes : c;
    G(ej, fj);
    fj |= d;
  }
  else null !== f2 ? (d = f2.baseLanes | c, b.memoizedState = null) : d = c, G(ej, fj), fj |= d;
  Xi(a, b, e, c);
  return b.child;
}
function gj(a, b) {
  var c = b.ref;
  if (null === a && null !== c || null !== a && a.ref !== c) b.flags |= 512, b.flags |= 2097152;
}
function cj(a, b, c, d, e) {
  var f2 = Zf(c) ? Xf : H.current;
  f2 = Yf(b, f2);
  ch(b, e);
  c = Nh(a, b, c, d, f2, e);
  d = Sh();
  if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
  I && d && vg(b);
  b.flags |= 1;
  Xi(a, b, c, e);
  return b.child;
}
function hj(a, b, c, d, e) {
  if (Zf(c)) {
    var f2 = true;
    cg(b);
  } else f2 = false;
  ch(b, e);
  if (null === b.stateNode) ij(a, b), Gi(b, c, d), Ii(b, c, d, e), d = true;
  else if (null === a) {
    var g = b.stateNode, h = b.memoizedProps;
    g.props = h;
    var k2 = g.context, l2 = c.contextType;
    "object" === typeof l2 && null !== l2 ? l2 = eh(l2) : (l2 = Zf(c) ? Xf : H.current, l2 = Yf(b, l2));
    var m2 = c.getDerivedStateFromProps, q2 = "function" === typeof m2 || "function" === typeof g.getSnapshotBeforeUpdate;
    q2 || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== d || k2 !== l2) && Hi(b, g, d, l2);
    jh = false;
    var r2 = b.memoizedState;
    g.state = r2;
    qh(b, d, g, e);
    k2 = b.memoizedState;
    h !== d || r2 !== k2 || Wf.current || jh ? ("function" === typeof m2 && (Di(b, c, m2, d), k2 = b.memoizedState), (h = jh || Fi(b, c, h, d, r2, k2, l2)) ? (q2 || "function" !== typeof g.UNSAFE_componentWillMount && "function" !== typeof g.componentWillMount || ("function" === typeof g.componentWillMount && g.componentWillMount(), "function" === typeof g.UNSAFE_componentWillMount && g.UNSAFE_componentWillMount()), "function" === typeof g.componentDidMount && (b.flags |= 4194308)) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), b.memoizedProps = d, b.memoizedState = k2), g.props = d, g.state = k2, g.context = l2, d = h) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), d = false);
  } else {
    g = b.stateNode;
    lh(a, b);
    h = b.memoizedProps;
    l2 = b.type === b.elementType ? h : Ci(b.type, h);
    g.props = l2;
    q2 = b.pendingProps;
    r2 = g.context;
    k2 = c.contextType;
    "object" === typeof k2 && null !== k2 ? k2 = eh(k2) : (k2 = Zf(c) ? Xf : H.current, k2 = Yf(b, k2));
    var y2 = c.getDerivedStateFromProps;
    (m2 = "function" === typeof y2 || "function" === typeof g.getSnapshotBeforeUpdate) || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== q2 || r2 !== k2) && Hi(b, g, d, k2);
    jh = false;
    r2 = b.memoizedState;
    g.state = r2;
    qh(b, d, g, e);
    var n2 = b.memoizedState;
    h !== q2 || r2 !== n2 || Wf.current || jh ? ("function" === typeof y2 && (Di(b, c, y2, d), n2 = b.memoizedState), (l2 = jh || Fi(b, c, l2, d, r2, n2, k2) || false) ? (m2 || "function" !== typeof g.UNSAFE_componentWillUpdate && "function" !== typeof g.componentWillUpdate || ("function" === typeof g.componentWillUpdate && g.componentWillUpdate(d, n2, k2), "function" === typeof g.UNSAFE_componentWillUpdate && g.UNSAFE_componentWillUpdate(d, n2, k2)), "function" === typeof g.componentDidUpdate && (b.flags |= 4), "function" === typeof g.getSnapshotBeforeUpdate && (b.flags |= 1024)) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 1024), b.memoizedProps = d, b.memoizedState = n2), g.props = d, g.state = n2, g.context = k2, d = l2) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 1024), d = false);
  }
  return jj(a, b, c, d, f2, e);
}
function jj(a, b, c, d, e, f2) {
  gj(a, b);
  var g = 0 !== (b.flags & 128);
  if (!d && !g) return e && dg(b, c, false), Zi(a, b, f2);
  d = b.stateNode;
  Wi.current = b;
  var h = g && "function" !== typeof c.getDerivedStateFromError ? null : d.render();
  b.flags |= 1;
  null !== a && g ? (b.child = Ug(b, a.child, null, f2), b.child = Ug(b, null, h, f2)) : Xi(a, b, h, f2);
  b.memoizedState = d.state;
  e && dg(b, c, true);
  return b.child;
}
function kj(a) {
  var b = a.stateNode;
  b.pendingContext ? ag(a, b.pendingContext, b.pendingContext !== b.context) : b.context && ag(a, b.context, false);
  yh(a, b.containerInfo);
}
function lj(a, b, c, d, e) {
  Ig();
  Jg(e);
  b.flags |= 256;
  Xi(a, b, c, d);
  return b.child;
}
var mj = { dehydrated: null, treeContext: null, retryLane: 0 };
function nj(a) {
  return { baseLanes: a, cachePool: null, transitions: null };
}
function oj(a, b, c) {
  var d = b.pendingProps, e = L.current, f2 = false, g = 0 !== (b.flags & 128), h;
  (h = g) || (h = null !== a && null === a.memoizedState ? false : 0 !== (e & 2));
  if (h) f2 = true, b.flags &= -129;
  else if (null === a || null !== a.memoizedState) e |= 1;
  G(L, e & 1);
  if (null === a) {
    Eg(b);
    a = b.memoizedState;
    if (null !== a && (a = a.dehydrated, null !== a)) return 0 === (b.mode & 1) ? b.lanes = 1 : "$!" === a.data ? b.lanes = 8 : b.lanes = 1073741824, null;
    g = d.children;
    a = d.fallback;
    return f2 ? (d = b.mode, f2 = b.child, g = { mode: "hidden", children: g }, 0 === (d & 1) && null !== f2 ? (f2.childLanes = 0, f2.pendingProps = g) : f2 = pj(g, d, 0, null), a = Tg(a, d, c, null), f2.return = b, a.return = b, f2.sibling = a, b.child = f2, b.child.memoizedState = nj(c), b.memoizedState = mj, a) : qj(b, g);
  }
  e = a.memoizedState;
  if (null !== e && (h = e.dehydrated, null !== h)) return rj(a, b, g, d, h, e, c);
  if (f2) {
    f2 = d.fallback;
    g = b.mode;
    e = a.child;
    h = e.sibling;
    var k2 = { mode: "hidden", children: d.children };
    0 === (g & 1) && b.child !== e ? (d = b.child, d.childLanes = 0, d.pendingProps = k2, b.deletions = null) : (d = Pg(e, k2), d.subtreeFlags = e.subtreeFlags & 14680064);
    null !== h ? f2 = Pg(h, f2) : (f2 = Tg(f2, g, c, null), f2.flags |= 2);
    f2.return = b;
    d.return = b;
    d.sibling = f2;
    b.child = d;
    d = f2;
    f2 = b.child;
    g = a.child.memoizedState;
    g = null === g ? nj(c) : { baseLanes: g.baseLanes | c, cachePool: null, transitions: g.transitions };
    f2.memoizedState = g;
    f2.childLanes = a.childLanes & ~c;
    b.memoizedState = mj;
    return d;
  }
  f2 = a.child;
  a = f2.sibling;
  d = Pg(f2, { mode: "visible", children: d.children });
  0 === (b.mode & 1) && (d.lanes = c);
  d.return = b;
  d.sibling = null;
  null !== a && (c = b.deletions, null === c ? (b.deletions = [a], b.flags |= 16) : c.push(a));
  b.child = d;
  b.memoizedState = null;
  return d;
}
function qj(a, b) {
  b = pj({ mode: "visible", children: b }, a.mode, 0, null);
  b.return = a;
  return a.child = b;
}
function sj(a, b, c, d) {
  null !== d && Jg(d);
  Ug(b, a.child, null, c);
  a = qj(b, b.pendingProps.children);
  a.flags |= 2;
  b.memoizedState = null;
  return a;
}
function rj(a, b, c, d, e, f2, g) {
  if (c) {
    if (b.flags & 256) return b.flags &= -257, d = Ki(Error(p(422))), sj(a, b, g, d);
    if (null !== b.memoizedState) return b.child = a.child, b.flags |= 128, null;
    f2 = d.fallback;
    e = b.mode;
    d = pj({ mode: "visible", children: d.children }, e, 0, null);
    f2 = Tg(f2, e, g, null);
    f2.flags |= 2;
    d.return = b;
    f2.return = b;
    d.sibling = f2;
    b.child = d;
    0 !== (b.mode & 1) && Ug(b, a.child, null, g);
    b.child.memoizedState = nj(g);
    b.memoizedState = mj;
    return f2;
  }
  if (0 === (b.mode & 1)) return sj(a, b, g, null);
  if ("$!" === e.data) {
    d = e.nextSibling && e.nextSibling.dataset;
    if (d) var h = d.dgst;
    d = h;
    f2 = Error(p(419));
    d = Ki(f2, d, void 0);
    return sj(a, b, g, d);
  }
  h = 0 !== (g & a.childLanes);
  if (dh || h) {
    d = Q;
    if (null !== d) {
      switch (g & -g) {
        case 4:
          e = 2;
          break;
        case 16:
          e = 8;
          break;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          e = 32;
          break;
        case 536870912:
          e = 268435456;
          break;
        default:
          e = 0;
      }
      e = 0 !== (e & (d.suspendedLanes | g)) ? 0 : e;
      0 !== e && e !== f2.retryLane && (f2.retryLane = e, ih(a, e), gi(d, a, e, -1));
    }
    tj();
    d = Ki(Error(p(421)));
    return sj(a, b, g, d);
  }
  if ("$?" === e.data) return b.flags |= 128, b.child = a.child, b = uj.bind(null, a), e._reactRetry = b, null;
  a = f2.treeContext;
  yg = Lf(e.nextSibling);
  xg = b;
  I = true;
  zg = null;
  null !== a && (og[pg++] = rg, og[pg++] = sg, og[pg++] = qg, rg = a.id, sg = a.overflow, qg = b);
  b = qj(b, d.children);
  b.flags |= 4096;
  return b;
}
function vj(a, b, c) {
  a.lanes |= b;
  var d = a.alternate;
  null !== d && (d.lanes |= b);
  bh(a.return, b, c);
}
function wj(a, b, c, d, e) {
  var f2 = a.memoizedState;
  null === f2 ? a.memoizedState = { isBackwards: b, rendering: null, renderingStartTime: 0, last: d, tail: c, tailMode: e } : (f2.isBackwards = b, f2.rendering = null, f2.renderingStartTime = 0, f2.last = d, f2.tail = c, f2.tailMode = e);
}
function xj(a, b, c) {
  var d = b.pendingProps, e = d.revealOrder, f2 = d.tail;
  Xi(a, b, d.children, c);
  d = L.current;
  if (0 !== (d & 2)) d = d & 1 | 2, b.flags |= 128;
  else {
    if (null !== a && 0 !== (a.flags & 128)) a: for (a = b.child; null !== a; ) {
      if (13 === a.tag) null !== a.memoizedState && vj(a, c, b);
      else if (19 === a.tag) vj(a, c, b);
      else if (null !== a.child) {
        a.child.return = a;
        a = a.child;
        continue;
      }
      if (a === b) break a;
      for (; null === a.sibling; ) {
        if (null === a.return || a.return === b) break a;
        a = a.return;
      }
      a.sibling.return = a.return;
      a = a.sibling;
    }
    d &= 1;
  }
  G(L, d);
  if (0 === (b.mode & 1)) b.memoizedState = null;
  else switch (e) {
    case "forwards":
      c = b.child;
      for (e = null; null !== c; ) a = c.alternate, null !== a && null === Ch(a) && (e = c), c = c.sibling;
      c = e;
      null === c ? (e = b.child, b.child = null) : (e = c.sibling, c.sibling = null);
      wj(b, false, e, c, f2);
      break;
    case "backwards":
      c = null;
      e = b.child;
      for (b.child = null; null !== e; ) {
        a = e.alternate;
        if (null !== a && null === Ch(a)) {
          b.child = e;
          break;
        }
        a = e.sibling;
        e.sibling = c;
        c = e;
        e = a;
      }
      wj(b, true, c, null, f2);
      break;
    case "together":
      wj(b, false, null, null, void 0);
      break;
    default:
      b.memoizedState = null;
  }
  return b.child;
}
function ij(a, b) {
  0 === (b.mode & 1) && null !== a && (a.alternate = null, b.alternate = null, b.flags |= 2);
}
function Zi(a, b, c) {
  null !== a && (b.dependencies = a.dependencies);
  rh |= b.lanes;
  if (0 === (c & b.childLanes)) return null;
  if (null !== a && b.child !== a.child) throw Error(p(153));
  if (null !== b.child) {
    a = b.child;
    c = Pg(a, a.pendingProps);
    b.child = c;
    for (c.return = b; null !== a.sibling; ) a = a.sibling, c = c.sibling = Pg(a, a.pendingProps), c.return = b;
    c.sibling = null;
  }
  return b.child;
}
function yj(a, b, c) {
  switch (b.tag) {
    case 3:
      kj(b);
      Ig();
      break;
    case 5:
      Ah(b);
      break;
    case 1:
      Zf(b.type) && cg(b);
      break;
    case 4:
      yh(b, b.stateNode.containerInfo);
      break;
    case 10:
      var d = b.type._context, e = b.memoizedProps.value;
      G(Wg, d._currentValue);
      d._currentValue = e;
      break;
    case 13:
      d = b.memoizedState;
      if (null !== d) {
        if (null !== d.dehydrated) return G(L, L.current & 1), b.flags |= 128, null;
        if (0 !== (c & b.child.childLanes)) return oj(a, b, c);
        G(L, L.current & 1);
        a = Zi(a, b, c);
        return null !== a ? a.sibling : null;
      }
      G(L, L.current & 1);
      break;
    case 19:
      d = 0 !== (c & b.childLanes);
      if (0 !== (a.flags & 128)) {
        if (d) return xj(a, b, c);
        b.flags |= 128;
      }
      e = b.memoizedState;
      null !== e && (e.rendering = null, e.tail = null, e.lastEffect = null);
      G(L, L.current);
      if (d) break;
      else return null;
    case 22:
    case 23:
      return b.lanes = 0, dj(a, b, c);
  }
  return Zi(a, b, c);
}
var zj, Aj, Bj, Cj;
zj = function(a, b) {
  for (var c = b.child; null !== c; ) {
    if (5 === c.tag || 6 === c.tag) a.appendChild(c.stateNode);
    else if (4 !== c.tag && null !== c.child) {
      c.child.return = c;
      c = c.child;
      continue;
    }
    if (c === b) break;
    for (; null === c.sibling; ) {
      if (null === c.return || c.return === b) return;
      c = c.return;
    }
    c.sibling.return = c.return;
    c = c.sibling;
  }
};
Aj = function() {
};
Bj = function(a, b, c, d) {
  var e = a.memoizedProps;
  if (e !== d) {
    a = b.stateNode;
    xh(uh.current);
    var f2 = null;
    switch (c) {
      case "input":
        e = Ya(a, e);
        d = Ya(a, d);
        f2 = [];
        break;
      case "select":
        e = A({}, e, { value: void 0 });
        d = A({}, d, { value: void 0 });
        f2 = [];
        break;
      case "textarea":
        e = gb(a, e);
        d = gb(a, d);
        f2 = [];
        break;
      default:
        "function" !== typeof e.onClick && "function" === typeof d.onClick && (a.onclick = Bf);
    }
    ub(c, d);
    var g;
    c = null;
    for (l2 in e) if (!d.hasOwnProperty(l2) && e.hasOwnProperty(l2) && null != e[l2]) if ("style" === l2) {
      var h = e[l2];
      for (g in h) h.hasOwnProperty(g) && (c || (c = {}), c[g] = "");
    } else "dangerouslySetInnerHTML" !== l2 && "children" !== l2 && "suppressContentEditableWarning" !== l2 && "suppressHydrationWarning" !== l2 && "autoFocus" !== l2 && (ea.hasOwnProperty(l2) ? f2 || (f2 = []) : (f2 = f2 || []).push(l2, null));
    for (l2 in d) {
      var k2 = d[l2];
      h = null != e ? e[l2] : void 0;
      if (d.hasOwnProperty(l2) && k2 !== h && (null != k2 || null != h)) if ("style" === l2) if (h) {
        for (g in h) !h.hasOwnProperty(g) || k2 && k2.hasOwnProperty(g) || (c || (c = {}), c[g] = "");
        for (g in k2) k2.hasOwnProperty(g) && h[g] !== k2[g] && (c || (c = {}), c[g] = k2[g]);
      } else c || (f2 || (f2 = []), f2.push(
        l2,
        c
      )), c = k2;
      else "dangerouslySetInnerHTML" === l2 ? (k2 = k2 ? k2.__html : void 0, h = h ? h.__html : void 0, null != k2 && h !== k2 && (f2 = f2 || []).push(l2, k2)) : "children" === l2 ? "string" !== typeof k2 && "number" !== typeof k2 || (f2 = f2 || []).push(l2, "" + k2) : "suppressContentEditableWarning" !== l2 && "suppressHydrationWarning" !== l2 && (ea.hasOwnProperty(l2) ? (null != k2 && "onScroll" === l2 && D("scroll", a), f2 || h === k2 || (f2 = [])) : (f2 = f2 || []).push(l2, k2));
    }
    c && (f2 = f2 || []).push("style", c);
    var l2 = f2;
    if (b.updateQueue = l2) b.flags |= 4;
  }
};
Cj = function(a, b, c, d) {
  c !== d && (b.flags |= 4);
};
function Dj(a, b) {
  if (!I) switch (a.tailMode) {
    case "hidden":
      b = a.tail;
      for (var c = null; null !== b; ) null !== b.alternate && (c = b), b = b.sibling;
      null === c ? a.tail = null : c.sibling = null;
      break;
    case "collapsed":
      c = a.tail;
      for (var d = null; null !== c; ) null !== c.alternate && (d = c), c = c.sibling;
      null === d ? b || null === a.tail ? a.tail = null : a.tail.sibling = null : d.sibling = null;
  }
}
function S(a) {
  var b = null !== a.alternate && a.alternate.child === a.child, c = 0, d = 0;
  if (b) for (var e = a.child; null !== e; ) c |= e.lanes | e.childLanes, d |= e.subtreeFlags & 14680064, d |= e.flags & 14680064, e.return = a, e = e.sibling;
  else for (e = a.child; null !== e; ) c |= e.lanes | e.childLanes, d |= e.subtreeFlags, d |= e.flags, e.return = a, e = e.sibling;
  a.subtreeFlags |= d;
  a.childLanes = c;
  return b;
}
function Ej(a, b, c) {
  var d = b.pendingProps;
  wg(b);
  switch (b.tag) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return S(b), null;
    case 1:
      return Zf(b.type) && $f(), S(b), null;
    case 3:
      d = b.stateNode;
      zh();
      E(Wf);
      E(H);
      Eh();
      d.pendingContext && (d.context = d.pendingContext, d.pendingContext = null);
      if (null === a || null === a.child) Gg(b) ? b.flags |= 4 : null === a || a.memoizedState.isDehydrated && 0 === (b.flags & 256) || (b.flags |= 1024, null !== zg && (Fj(zg), zg = null));
      Aj(a, b);
      S(b);
      return null;
    case 5:
      Bh(b);
      var e = xh(wh.current);
      c = b.type;
      if (null !== a && null != b.stateNode) Bj(a, b, c, d, e), a.ref !== b.ref && (b.flags |= 512, b.flags |= 2097152);
      else {
        if (!d) {
          if (null === b.stateNode) throw Error(p(166));
          S(b);
          return null;
        }
        a = xh(uh.current);
        if (Gg(b)) {
          d = b.stateNode;
          c = b.type;
          var f2 = b.memoizedProps;
          d[Of] = b;
          d[Pf] = f2;
          a = 0 !== (b.mode & 1);
          switch (c) {
            case "dialog":
              D("cancel", d);
              D("close", d);
              break;
            case "iframe":
            case "object":
            case "embed":
              D("load", d);
              break;
            case "video":
            case "audio":
              for (e = 0; e < lf.length; e++) D(lf[e], d);
              break;
            case "source":
              D("error", d);
              break;
            case "img":
            case "image":
            case "link":
              D(
                "error",
                d
              );
              D("load", d);
              break;
            case "details":
              D("toggle", d);
              break;
            case "input":
              Za(d, f2);
              D("invalid", d);
              break;
            case "select":
              d._wrapperState = { wasMultiple: !!f2.multiple };
              D("invalid", d);
              break;
            case "textarea":
              hb(d, f2), D("invalid", d);
          }
          ub(c, f2);
          e = null;
          for (var g in f2) if (f2.hasOwnProperty(g)) {
            var h = f2[g];
            "children" === g ? "string" === typeof h ? d.textContent !== h && (true !== f2.suppressHydrationWarning && Af(d.textContent, h, a), e = ["children", h]) : "number" === typeof h && d.textContent !== "" + h && (true !== f2.suppressHydrationWarning && Af(
              d.textContent,
              h,
              a
            ), e = ["children", "" + h]) : ea.hasOwnProperty(g) && null != h && "onScroll" === g && D("scroll", d);
          }
          switch (c) {
            case "input":
              Va(d);
              db(d, f2, true);
              break;
            case "textarea":
              Va(d);
              jb(d);
              break;
            case "select":
            case "option":
              break;
            default:
              "function" === typeof f2.onClick && (d.onclick = Bf);
          }
          d = e;
          b.updateQueue = d;
          null !== d && (b.flags |= 4);
        } else {
          g = 9 === e.nodeType ? e : e.ownerDocument;
          "http://www.w3.org/1999/xhtml" === a && (a = kb(c));
          "http://www.w3.org/1999/xhtml" === a ? "script" === c ? (a = g.createElement("div"), a.innerHTML = "<script><\/script>", a = a.removeChild(a.firstChild)) : "string" === typeof d.is ? a = g.createElement(c, { is: d.is }) : (a = g.createElement(c), "select" === c && (g = a, d.multiple ? g.multiple = true : d.size && (g.size = d.size))) : a = g.createElementNS(a, c);
          a[Of] = b;
          a[Pf] = d;
          zj(a, b, false, false);
          b.stateNode = a;
          a: {
            g = vb(c, d);
            switch (c) {
              case "dialog":
                D("cancel", a);
                D("close", a);
                e = d;
                break;
              case "iframe":
              case "object":
              case "embed":
                D("load", a);
                e = d;
                break;
              case "video":
              case "audio":
                for (e = 0; e < lf.length; e++) D(lf[e], a);
                e = d;
                break;
              case "source":
                D("error", a);
                e = d;
                break;
              case "img":
              case "image":
              case "link":
                D(
                  "error",
                  a
                );
                D("load", a);
                e = d;
                break;
              case "details":
                D("toggle", a);
                e = d;
                break;
              case "input":
                Za(a, d);
                e = Ya(a, d);
                D("invalid", a);
                break;
              case "option":
                e = d;
                break;
              case "select":
                a._wrapperState = { wasMultiple: !!d.multiple };
                e = A({}, d, { value: void 0 });
                D("invalid", a);
                break;
              case "textarea":
                hb(a, d);
                e = gb(a, d);
                D("invalid", a);
                break;
              default:
                e = d;
            }
            ub(c, e);
            h = e;
            for (f2 in h) if (h.hasOwnProperty(f2)) {
              var k2 = h[f2];
              "style" === f2 ? sb(a, k2) : "dangerouslySetInnerHTML" === f2 ? (k2 = k2 ? k2.__html : void 0, null != k2 && nb(a, k2)) : "children" === f2 ? "string" === typeof k2 ? ("textarea" !== c || "" !== k2) && ob(a, k2) : "number" === typeof k2 && ob(a, "" + k2) : "suppressContentEditableWarning" !== f2 && "suppressHydrationWarning" !== f2 && "autoFocus" !== f2 && (ea.hasOwnProperty(f2) ? null != k2 && "onScroll" === f2 && D("scroll", a) : null != k2 && ta(a, f2, k2, g));
            }
            switch (c) {
              case "input":
                Va(a);
                db(a, d, false);
                break;
              case "textarea":
                Va(a);
                jb(a);
                break;
              case "option":
                null != d.value && a.setAttribute("value", "" + Sa(d.value));
                break;
              case "select":
                a.multiple = !!d.multiple;
                f2 = d.value;
                null != f2 ? fb(a, !!d.multiple, f2, false) : null != d.defaultValue && fb(
                  a,
                  !!d.multiple,
                  d.defaultValue,
                  true
                );
                break;
              default:
                "function" === typeof e.onClick && (a.onclick = Bf);
            }
            switch (c) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                d = !!d.autoFocus;
                break a;
              case "img":
                d = true;
                break a;
              default:
                d = false;
            }
          }
          d && (b.flags |= 4);
        }
        null !== b.ref && (b.flags |= 512, b.flags |= 2097152);
      }
      S(b);
      return null;
    case 6:
      if (a && null != b.stateNode) Cj(a, b, a.memoizedProps, d);
      else {
        if ("string" !== typeof d && null === b.stateNode) throw Error(p(166));
        c = xh(wh.current);
        xh(uh.current);
        if (Gg(b)) {
          d = b.stateNode;
          c = b.memoizedProps;
          d[Of] = b;
          if (f2 = d.nodeValue !== c) {
            if (a = xg, null !== a) switch (a.tag) {
              case 3:
                Af(d.nodeValue, c, 0 !== (a.mode & 1));
                break;
              case 5:
                true !== a.memoizedProps.suppressHydrationWarning && Af(d.nodeValue, c, 0 !== (a.mode & 1));
            }
          }
          f2 && (b.flags |= 4);
        } else d = (9 === c.nodeType ? c : c.ownerDocument).createTextNode(d), d[Of] = b, b.stateNode = d;
      }
      S(b);
      return null;
    case 13:
      E(L);
      d = b.memoizedState;
      if (null === a || null !== a.memoizedState && null !== a.memoizedState.dehydrated) {
        if (I && null !== yg && 0 !== (b.mode & 1) && 0 === (b.flags & 128)) Hg(), Ig(), b.flags |= 98560, f2 = false;
        else if (f2 = Gg(b), null !== d && null !== d.dehydrated) {
          if (null === a) {
            if (!f2) throw Error(p(318));
            f2 = b.memoizedState;
            f2 = null !== f2 ? f2.dehydrated : null;
            if (!f2) throw Error(p(317));
            f2[Of] = b;
          } else Ig(), 0 === (b.flags & 128) && (b.memoizedState = null), b.flags |= 4;
          S(b);
          f2 = false;
        } else null !== zg && (Fj(zg), zg = null), f2 = true;
        if (!f2) return b.flags & 65536 ? b : null;
      }
      if (0 !== (b.flags & 128)) return b.lanes = c, b;
      d = null !== d;
      d !== (null !== a && null !== a.memoizedState) && d && (b.child.flags |= 8192, 0 !== (b.mode & 1) && (null === a || 0 !== (L.current & 1) ? 0 === T && (T = 3) : tj()));
      null !== b.updateQueue && (b.flags |= 4);
      S(b);
      return null;
    case 4:
      return zh(), Aj(a, b), null === a && sf(b.stateNode.containerInfo), S(b), null;
    case 10:
      return ah(b.type._context), S(b), null;
    case 17:
      return Zf(b.type) && $f(), S(b), null;
    case 19:
      E(L);
      f2 = b.memoizedState;
      if (null === f2) return S(b), null;
      d = 0 !== (b.flags & 128);
      g = f2.rendering;
      if (null === g) if (d) Dj(f2, false);
      else {
        if (0 !== T || null !== a && 0 !== (a.flags & 128)) for (a = b.child; null !== a; ) {
          g = Ch(a);
          if (null !== g) {
            b.flags |= 128;
            Dj(f2, false);
            d = g.updateQueue;
            null !== d && (b.updateQueue = d, b.flags |= 4);
            b.subtreeFlags = 0;
            d = c;
            for (c = b.child; null !== c; ) f2 = c, a = d, f2.flags &= 14680066, g = f2.alternate, null === g ? (f2.childLanes = 0, f2.lanes = a, f2.child = null, f2.subtreeFlags = 0, f2.memoizedProps = null, f2.memoizedState = null, f2.updateQueue = null, f2.dependencies = null, f2.stateNode = null) : (f2.childLanes = g.childLanes, f2.lanes = g.lanes, f2.child = g.child, f2.subtreeFlags = 0, f2.deletions = null, f2.memoizedProps = g.memoizedProps, f2.memoizedState = g.memoizedState, f2.updateQueue = g.updateQueue, f2.type = g.type, a = g.dependencies, f2.dependencies = null === a ? null : { lanes: a.lanes, firstContext: a.firstContext }), c = c.sibling;
            G(L, L.current & 1 | 2);
            return b.child;
          }
          a = a.sibling;
        }
        null !== f2.tail && B() > Gj && (b.flags |= 128, d = true, Dj(f2, false), b.lanes = 4194304);
      }
      else {
        if (!d) if (a = Ch(g), null !== a) {
          if (b.flags |= 128, d = true, c = a.updateQueue, null !== c && (b.updateQueue = c, b.flags |= 4), Dj(f2, true), null === f2.tail && "hidden" === f2.tailMode && !g.alternate && !I) return S(b), null;
        } else 2 * B() - f2.renderingStartTime > Gj && 1073741824 !== c && (b.flags |= 128, d = true, Dj(f2, false), b.lanes = 4194304);
        f2.isBackwards ? (g.sibling = b.child, b.child = g) : (c = f2.last, null !== c ? c.sibling = g : b.child = g, f2.last = g);
      }
      if (null !== f2.tail) return b = f2.tail, f2.rendering = b, f2.tail = b.sibling, f2.renderingStartTime = B(), b.sibling = null, c = L.current, G(L, d ? c & 1 | 2 : c & 1), b;
      S(b);
      return null;
    case 22:
    case 23:
      return Hj(), d = null !== b.memoizedState, null !== a && null !== a.memoizedState !== d && (b.flags |= 8192), d && 0 !== (b.mode & 1) ? 0 !== (fj & 1073741824) && (S(b), b.subtreeFlags & 6 && (b.flags |= 8192)) : S(b), null;
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(p(156, b.tag));
}
function Ij(a, b) {
  wg(b);
  switch (b.tag) {
    case 1:
      return Zf(b.type) && $f(), a = b.flags, a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
    case 3:
      return zh(), E(Wf), E(H), Eh(), a = b.flags, 0 !== (a & 65536) && 0 === (a & 128) ? (b.flags = a & -65537 | 128, b) : null;
    case 5:
      return Bh(b), null;
    case 13:
      E(L);
      a = b.memoizedState;
      if (null !== a && null !== a.dehydrated) {
        if (null === b.alternate) throw Error(p(340));
        Ig();
      }
      a = b.flags;
      return a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
    case 19:
      return E(L), null;
    case 4:
      return zh(), null;
    case 10:
      return ah(b.type._context), null;
    case 22:
    case 23:
      return Hj(), null;
    case 24:
      return null;
    default:
      return null;
  }
}
var Jj = false, U = false, Kj = "function" === typeof WeakSet ? WeakSet : Set, V = null;
function Lj(a, b) {
  var c = a.ref;
  if (null !== c) if ("function" === typeof c) try {
    c(null);
  } catch (d) {
    W(a, b, d);
  }
  else c.current = null;
}
function Mj(a, b, c) {
  try {
    c();
  } catch (d) {
    W(a, b, d);
  }
}
var Nj = false;
function Oj(a, b) {
  Cf = dd;
  a = Me();
  if (Ne(a)) {
    if ("selectionStart" in a) var c = { start: a.selectionStart, end: a.selectionEnd };
    else a: {
      c = (c = a.ownerDocument) && c.defaultView || window;
      var d = c.getSelection && c.getSelection();
      if (d && 0 !== d.rangeCount) {
        c = d.anchorNode;
        var e = d.anchorOffset, f2 = d.focusNode;
        d = d.focusOffset;
        try {
          c.nodeType, f2.nodeType;
        } catch (F2) {
          c = null;
          break a;
        }
        var g = 0, h = -1, k2 = -1, l2 = 0, m2 = 0, q2 = a, r2 = null;
        b: for (; ; ) {
          for (var y2; ; ) {
            q2 !== c || 0 !== e && 3 !== q2.nodeType || (h = g + e);
            q2 !== f2 || 0 !== d && 3 !== q2.nodeType || (k2 = g + d);
            3 === q2.nodeType && (g += q2.nodeValue.length);
            if (null === (y2 = q2.firstChild)) break;
            r2 = q2;
            q2 = y2;
          }
          for (; ; ) {
            if (q2 === a) break b;
            r2 === c && ++l2 === e && (h = g);
            r2 === f2 && ++m2 === d && (k2 = g);
            if (null !== (y2 = q2.nextSibling)) break;
            q2 = r2;
            r2 = q2.parentNode;
          }
          q2 = y2;
        }
        c = -1 === h || -1 === k2 ? null : { start: h, end: k2 };
      } else c = null;
    }
    c = c || { start: 0, end: 0 };
  } else c = null;
  Df = { focusedElem: a, selectionRange: c };
  dd = false;
  for (V = b; null !== V; ) if (b = V, a = b.child, 0 !== (b.subtreeFlags & 1028) && null !== a) a.return = b, V = a;
  else for (; null !== V; ) {
    b = V;
    try {
      var n2 = b.alternate;
      if (0 !== (b.flags & 1024)) switch (b.tag) {
        case 0:
        case 11:
        case 15:
          break;
        case 1:
          if (null !== n2) {
            var t2 = n2.memoizedProps, J2 = n2.memoizedState, x2 = b.stateNode, w2 = x2.getSnapshotBeforeUpdate(b.elementType === b.type ? t2 : Ci(b.type, t2), J2);
            x2.__reactInternalSnapshotBeforeUpdate = w2;
          }
          break;
        case 3:
          var u2 = b.stateNode.containerInfo;
          1 === u2.nodeType ? u2.textContent = "" : 9 === u2.nodeType && u2.documentElement && u2.removeChild(u2.documentElement);
          break;
        case 5:
        case 6:
        case 4:
        case 17:
          break;
        default:
          throw Error(p(163));
      }
    } catch (F2) {
      W(b, b.return, F2);
    }
    a = b.sibling;
    if (null !== a) {
      a.return = b.return;
      V = a;
      break;
    }
    V = b.return;
  }
  n2 = Nj;
  Nj = false;
  return n2;
}
function Pj(a, b, c) {
  var d = b.updateQueue;
  d = null !== d ? d.lastEffect : null;
  if (null !== d) {
    var e = d = d.next;
    do {
      if ((e.tag & a) === a) {
        var f2 = e.destroy;
        e.destroy = void 0;
        void 0 !== f2 && Mj(b, c, f2);
      }
      e = e.next;
    } while (e !== d);
  }
}
function Qj(a, b) {
  b = b.updateQueue;
  b = null !== b ? b.lastEffect : null;
  if (null !== b) {
    var c = b = b.next;
    do {
      if ((c.tag & a) === a) {
        var d = c.create;
        c.destroy = d();
      }
      c = c.next;
    } while (c !== b);
  }
}
function Rj(a) {
  var b = a.ref;
  if (null !== b) {
    var c = a.stateNode;
    switch (a.tag) {
      case 5:
        a = c;
        break;
      default:
        a = c;
    }
    "function" === typeof b ? b(a) : b.current = a;
  }
}
function Sj(a) {
  var b = a.alternate;
  null !== b && (a.alternate = null, Sj(b));
  a.child = null;
  a.deletions = null;
  a.sibling = null;
  5 === a.tag && (b = a.stateNode, null !== b && (delete b[Of], delete b[Pf], delete b[of], delete b[Qf], delete b[Rf]));
  a.stateNode = null;
  a.return = null;
  a.dependencies = null;
  a.memoizedProps = null;
  a.memoizedState = null;
  a.pendingProps = null;
  a.stateNode = null;
  a.updateQueue = null;
}
function Tj(a) {
  return 5 === a.tag || 3 === a.tag || 4 === a.tag;
}
function Uj(a) {
  a: for (; ; ) {
    for (; null === a.sibling; ) {
      if (null === a.return || Tj(a.return)) return null;
      a = a.return;
    }
    a.sibling.return = a.return;
    for (a = a.sibling; 5 !== a.tag && 6 !== a.tag && 18 !== a.tag; ) {
      if (a.flags & 2) continue a;
      if (null === a.child || 4 === a.tag) continue a;
      else a.child.return = a, a = a.child;
    }
    if (!(a.flags & 2)) return a.stateNode;
  }
}
function Vj(a, b, c) {
  var d = a.tag;
  if (5 === d || 6 === d) a = a.stateNode, b ? 8 === c.nodeType ? c.parentNode.insertBefore(a, b) : c.insertBefore(a, b) : (8 === c.nodeType ? (b = c.parentNode, b.insertBefore(a, c)) : (b = c, b.appendChild(a)), c = c._reactRootContainer, null !== c && void 0 !== c || null !== b.onclick || (b.onclick = Bf));
  else if (4 !== d && (a = a.child, null !== a)) for (Vj(a, b, c), a = a.sibling; null !== a; ) Vj(a, b, c), a = a.sibling;
}
function Wj(a, b, c) {
  var d = a.tag;
  if (5 === d || 6 === d) a = a.stateNode, b ? c.insertBefore(a, b) : c.appendChild(a);
  else if (4 !== d && (a = a.child, null !== a)) for (Wj(a, b, c), a = a.sibling; null !== a; ) Wj(a, b, c), a = a.sibling;
}
var X = null, Xj = false;
function Yj(a, b, c) {
  for (c = c.child; null !== c; ) Zj(a, b, c), c = c.sibling;
}
function Zj(a, b, c) {
  if (lc && "function" === typeof lc.onCommitFiberUnmount) try {
    lc.onCommitFiberUnmount(kc, c);
  } catch (h) {
  }
  switch (c.tag) {
    case 5:
      U || Lj(c, b);
    case 6:
      var d = X, e = Xj;
      X = null;
      Yj(a, b, c);
      X = d;
      Xj = e;
      null !== X && (Xj ? (a = X, c = c.stateNode, 8 === a.nodeType ? a.parentNode.removeChild(c) : a.removeChild(c)) : X.removeChild(c.stateNode));
      break;
    case 18:
      null !== X && (Xj ? (a = X, c = c.stateNode, 8 === a.nodeType ? Kf(a.parentNode, c) : 1 === a.nodeType && Kf(a, c), bd(a)) : Kf(X, c.stateNode));
      break;
    case 4:
      d = X;
      e = Xj;
      X = c.stateNode.containerInfo;
      Xj = true;
      Yj(a, b, c);
      X = d;
      Xj = e;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (!U && (d = c.updateQueue, null !== d && (d = d.lastEffect, null !== d))) {
        e = d = d.next;
        do {
          var f2 = e, g = f2.destroy;
          f2 = f2.tag;
          void 0 !== g && (0 !== (f2 & 2) ? Mj(c, b, g) : 0 !== (f2 & 4) && Mj(c, b, g));
          e = e.next;
        } while (e !== d);
      }
      Yj(a, b, c);
      break;
    case 1:
      if (!U && (Lj(c, b), d = c.stateNode, "function" === typeof d.componentWillUnmount)) try {
        d.props = c.memoizedProps, d.state = c.memoizedState, d.componentWillUnmount();
      } catch (h) {
        W(c, b, h);
      }
      Yj(a, b, c);
      break;
    case 21:
      Yj(a, b, c);
      break;
    case 22:
      c.mode & 1 ? (U = (d = U) || null !== c.memoizedState, Yj(a, b, c), U = d) : Yj(a, b, c);
      break;
    default:
      Yj(a, b, c);
  }
}
function ak(a) {
  var b = a.updateQueue;
  if (null !== b) {
    a.updateQueue = null;
    var c = a.stateNode;
    null === c && (c = a.stateNode = new Kj());
    b.forEach(function(b2) {
      var d = bk.bind(null, a, b2);
      c.has(b2) || (c.add(b2), b2.then(d, d));
    });
  }
}
function ck(a, b) {
  var c = b.deletions;
  if (null !== c) for (var d = 0; d < c.length; d++) {
    var e = c[d];
    try {
      var f2 = a, g = b, h = g;
      a: for (; null !== h; ) {
        switch (h.tag) {
          case 5:
            X = h.stateNode;
            Xj = false;
            break a;
          case 3:
            X = h.stateNode.containerInfo;
            Xj = true;
            break a;
          case 4:
            X = h.stateNode.containerInfo;
            Xj = true;
            break a;
        }
        h = h.return;
      }
      if (null === X) throw Error(p(160));
      Zj(f2, g, e);
      X = null;
      Xj = false;
      var k2 = e.alternate;
      null !== k2 && (k2.return = null);
      e.return = null;
    } catch (l2) {
      W(e, b, l2);
    }
  }
  if (b.subtreeFlags & 12854) for (b = b.child; null !== b; ) dk(b, a), b = b.sibling;
}
function dk(a, b) {
  var c = a.alternate, d = a.flags;
  switch (a.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      ck(b, a);
      ek(a);
      if (d & 4) {
        try {
          Pj(3, a, a.return), Qj(3, a);
        } catch (t2) {
          W(a, a.return, t2);
        }
        try {
          Pj(5, a, a.return);
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      break;
    case 1:
      ck(b, a);
      ek(a);
      d & 512 && null !== c && Lj(c, c.return);
      break;
    case 5:
      ck(b, a);
      ek(a);
      d & 512 && null !== c && Lj(c, c.return);
      if (a.flags & 32) {
        var e = a.stateNode;
        try {
          ob(e, "");
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      if (d & 4 && (e = a.stateNode, null != e)) {
        var f2 = a.memoizedProps, g = null !== c ? c.memoizedProps : f2, h = a.type, k2 = a.updateQueue;
        a.updateQueue = null;
        if (null !== k2) try {
          "input" === h && "radio" === f2.type && null != f2.name && ab(e, f2);
          vb(h, g);
          var l2 = vb(h, f2);
          for (g = 0; g < k2.length; g += 2) {
            var m2 = k2[g], q2 = k2[g + 1];
            "style" === m2 ? sb(e, q2) : "dangerouslySetInnerHTML" === m2 ? nb(e, q2) : "children" === m2 ? ob(e, q2) : ta(e, m2, q2, l2);
          }
          switch (h) {
            case "input":
              bb(e, f2);
              break;
            case "textarea":
              ib(e, f2);
              break;
            case "select":
              var r2 = e._wrapperState.wasMultiple;
              e._wrapperState.wasMultiple = !!f2.multiple;
              var y2 = f2.value;
              null != y2 ? fb(e, !!f2.multiple, y2, false) : r2 !== !!f2.multiple && (null != f2.defaultValue ? fb(
                e,
                !!f2.multiple,
                f2.defaultValue,
                true
              ) : fb(e, !!f2.multiple, f2.multiple ? [] : "", false));
          }
          e[Pf] = f2;
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      break;
    case 6:
      ck(b, a);
      ek(a);
      if (d & 4) {
        if (null === a.stateNode) throw Error(p(162));
        e = a.stateNode;
        f2 = a.memoizedProps;
        try {
          e.nodeValue = f2;
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      break;
    case 3:
      ck(b, a);
      ek(a);
      if (d & 4 && null !== c && c.memoizedState.isDehydrated) try {
        bd(b.containerInfo);
      } catch (t2) {
        W(a, a.return, t2);
      }
      break;
    case 4:
      ck(b, a);
      ek(a);
      break;
    case 13:
      ck(b, a);
      ek(a);
      e = a.child;
      e.flags & 8192 && (f2 = null !== e.memoizedState, e.stateNode.isHidden = f2, !f2 || null !== e.alternate && null !== e.alternate.memoizedState || (fk = B()));
      d & 4 && ak(a);
      break;
    case 22:
      m2 = null !== c && null !== c.memoizedState;
      a.mode & 1 ? (U = (l2 = U) || m2, ck(b, a), U = l2) : ck(b, a);
      ek(a);
      if (d & 8192) {
        l2 = null !== a.memoizedState;
        if ((a.stateNode.isHidden = l2) && !m2 && 0 !== (a.mode & 1)) for (V = a, m2 = a.child; null !== m2; ) {
          for (q2 = V = m2; null !== V; ) {
            r2 = V;
            y2 = r2.child;
            switch (r2.tag) {
              case 0:
              case 11:
              case 14:
              case 15:
                Pj(4, r2, r2.return);
                break;
              case 1:
                Lj(r2, r2.return);
                var n2 = r2.stateNode;
                if ("function" === typeof n2.componentWillUnmount) {
                  d = r2;
                  c = r2.return;
                  try {
                    b = d, n2.props = b.memoizedProps, n2.state = b.memoizedState, n2.componentWillUnmount();
                  } catch (t2) {
                    W(d, c, t2);
                  }
                }
                break;
              case 5:
                Lj(r2, r2.return);
                break;
              case 22:
                if (null !== r2.memoizedState) {
                  gk(q2);
                  continue;
                }
            }
            null !== y2 ? (y2.return = r2, V = y2) : gk(q2);
          }
          m2 = m2.sibling;
        }
        a: for (m2 = null, q2 = a; ; ) {
          if (5 === q2.tag) {
            if (null === m2) {
              m2 = q2;
              try {
                e = q2.stateNode, l2 ? (f2 = e.style, "function" === typeof f2.setProperty ? f2.setProperty("display", "none", "important") : f2.display = "none") : (h = q2.stateNode, k2 = q2.memoizedProps.style, g = void 0 !== k2 && null !== k2 && k2.hasOwnProperty("display") ? k2.display : null, h.style.display = rb("display", g));
              } catch (t2) {
                W(a, a.return, t2);
              }
            }
          } else if (6 === q2.tag) {
            if (null === m2) try {
              q2.stateNode.nodeValue = l2 ? "" : q2.memoizedProps;
            } catch (t2) {
              W(a, a.return, t2);
            }
          } else if ((22 !== q2.tag && 23 !== q2.tag || null === q2.memoizedState || q2 === a) && null !== q2.child) {
            q2.child.return = q2;
            q2 = q2.child;
            continue;
          }
          if (q2 === a) break a;
          for (; null === q2.sibling; ) {
            if (null === q2.return || q2.return === a) break a;
            m2 === q2 && (m2 = null);
            q2 = q2.return;
          }
          m2 === q2 && (m2 = null);
          q2.sibling.return = q2.return;
          q2 = q2.sibling;
        }
      }
      break;
    case 19:
      ck(b, a);
      ek(a);
      d & 4 && ak(a);
      break;
    case 21:
      break;
    default:
      ck(
        b,
        a
      ), ek(a);
  }
}
function ek(a) {
  var b = a.flags;
  if (b & 2) {
    try {
      a: {
        for (var c = a.return; null !== c; ) {
          if (Tj(c)) {
            var d = c;
            break a;
          }
          c = c.return;
        }
        throw Error(p(160));
      }
      switch (d.tag) {
        case 5:
          var e = d.stateNode;
          d.flags & 32 && (ob(e, ""), d.flags &= -33);
          var f2 = Uj(a);
          Wj(a, f2, e);
          break;
        case 3:
        case 4:
          var g = d.stateNode.containerInfo, h = Uj(a);
          Vj(a, h, g);
          break;
        default:
          throw Error(p(161));
      }
    } catch (k2) {
      W(a, a.return, k2);
    }
    a.flags &= -3;
  }
  b & 4096 && (a.flags &= -4097);
}
function hk(a, b, c) {
  V = a;
  ik(a);
}
function ik(a, b, c) {
  for (var d = 0 !== (a.mode & 1); null !== V; ) {
    var e = V, f2 = e.child;
    if (22 === e.tag && d) {
      var g = null !== e.memoizedState || Jj;
      if (!g) {
        var h = e.alternate, k2 = null !== h && null !== h.memoizedState || U;
        h = Jj;
        var l2 = U;
        Jj = g;
        if ((U = k2) && !l2) for (V = e; null !== V; ) g = V, k2 = g.child, 22 === g.tag && null !== g.memoizedState ? jk(e) : null !== k2 ? (k2.return = g, V = k2) : jk(e);
        for (; null !== f2; ) V = f2, ik(f2), f2 = f2.sibling;
        V = e;
        Jj = h;
        U = l2;
      }
      kk(a);
    } else 0 !== (e.subtreeFlags & 8772) && null !== f2 ? (f2.return = e, V = f2) : kk(a);
  }
}
function kk(a) {
  for (; null !== V; ) {
    var b = V;
    if (0 !== (b.flags & 8772)) {
      var c = b.alternate;
      try {
        if (0 !== (b.flags & 8772)) switch (b.tag) {
          case 0:
          case 11:
          case 15:
            U || Qj(5, b);
            break;
          case 1:
            var d = b.stateNode;
            if (b.flags & 4 && !U) if (null === c) d.componentDidMount();
            else {
              var e = b.elementType === b.type ? c.memoizedProps : Ci(b.type, c.memoizedProps);
              d.componentDidUpdate(e, c.memoizedState, d.__reactInternalSnapshotBeforeUpdate);
            }
            var f2 = b.updateQueue;
            null !== f2 && sh(b, f2, d);
            break;
          case 3:
            var g = b.updateQueue;
            if (null !== g) {
              c = null;
              if (null !== b.child) switch (b.child.tag) {
                case 5:
                  c = b.child.stateNode;
                  break;
                case 1:
                  c = b.child.stateNode;
              }
              sh(b, g, c);
            }
            break;
          case 5:
            var h = b.stateNode;
            if (null === c && b.flags & 4) {
              c = h;
              var k2 = b.memoizedProps;
              switch (b.type) {
                case "button":
                case "input":
                case "select":
                case "textarea":
                  k2.autoFocus && c.focus();
                  break;
                case "img":
                  k2.src && (c.src = k2.src);
              }
            }
            break;
          case 6:
            break;
          case 4:
            break;
          case 12:
            break;
          case 13:
            if (null === b.memoizedState) {
              var l2 = b.alternate;
              if (null !== l2) {
                var m2 = l2.memoizedState;
                if (null !== m2) {
                  var q2 = m2.dehydrated;
                  null !== q2 && bd(q2);
                }
              }
            }
            break;
          case 19:
          case 17:
          case 21:
          case 22:
          case 23:
          case 25:
            break;
          default:
            throw Error(p(163));
        }
        U || b.flags & 512 && Rj(b);
      } catch (r2) {
        W(b, b.return, r2);
      }
    }
    if (b === a) {
      V = null;
      break;
    }
    c = b.sibling;
    if (null !== c) {
      c.return = b.return;
      V = c;
      break;
    }
    V = b.return;
  }
}
function gk(a) {
  for (; null !== V; ) {
    var b = V;
    if (b === a) {
      V = null;
      break;
    }
    var c = b.sibling;
    if (null !== c) {
      c.return = b.return;
      V = c;
      break;
    }
    V = b.return;
  }
}
function jk(a) {
  for (; null !== V; ) {
    var b = V;
    try {
      switch (b.tag) {
        case 0:
        case 11:
        case 15:
          var c = b.return;
          try {
            Qj(4, b);
          } catch (k2) {
            W(b, c, k2);
          }
          break;
        case 1:
          var d = b.stateNode;
          if ("function" === typeof d.componentDidMount) {
            var e = b.return;
            try {
              d.componentDidMount();
            } catch (k2) {
              W(b, e, k2);
            }
          }
          var f2 = b.return;
          try {
            Rj(b);
          } catch (k2) {
            W(b, f2, k2);
          }
          break;
        case 5:
          var g = b.return;
          try {
            Rj(b);
          } catch (k2) {
            W(b, g, k2);
          }
      }
    } catch (k2) {
      W(b, b.return, k2);
    }
    if (b === a) {
      V = null;
      break;
    }
    var h = b.sibling;
    if (null !== h) {
      h.return = b.return;
      V = h;
      break;
    }
    V = b.return;
  }
}
var lk = Math.ceil, mk = ua.ReactCurrentDispatcher, nk = ua.ReactCurrentOwner, ok = ua.ReactCurrentBatchConfig, K = 0, Q = null, Y = null, Z = 0, fj = 0, ej = Uf(0), T = 0, pk = null, rh = 0, qk = 0, rk = 0, sk = null, tk = null, fk = 0, Gj = Infinity, uk = null, Oi = false, Pi = null, Ri = null, vk = false, wk = null, xk = 0, yk = 0, zk = null, Ak = -1, Bk = 0;
function R() {
  return 0 !== (K & 6) ? B() : -1 !== Ak ? Ak : Ak = B();
}
function yi(a) {
  if (0 === (a.mode & 1)) return 1;
  if (0 !== (K & 2) && 0 !== Z) return Z & -Z;
  if (null !== Kg.transition) return 0 === Bk && (Bk = yc()), Bk;
  a = C;
  if (0 !== a) return a;
  a = window.event;
  a = void 0 === a ? 16 : jd(a.type);
  return a;
}
function gi(a, b, c, d) {
  if (50 < yk) throw yk = 0, zk = null, Error(p(185));
  Ac(a, c, d);
  if (0 === (K & 2) || a !== Q) a === Q && (0 === (K & 2) && (qk |= c), 4 === T && Ck(a, Z)), Dk(a, d), 1 === c && 0 === K && 0 === (b.mode & 1) && (Gj = B() + 500, fg && jg());
}
function Dk(a, b) {
  var c = a.callbackNode;
  wc(a, b);
  var d = uc(a, a === Q ? Z : 0);
  if (0 === d) null !== c && bc(c), a.callbackNode = null, a.callbackPriority = 0;
  else if (b = d & -d, a.callbackPriority !== b) {
    null != c && bc(c);
    if (1 === b) 0 === a.tag ? ig(Ek.bind(null, a)) : hg(Ek.bind(null, a)), Jf(function() {
      0 === (K & 6) && jg();
    }), c = null;
    else {
      switch (Dc(d)) {
        case 1:
          c = fc;
          break;
        case 4:
          c = gc;
          break;
        case 16:
          c = hc;
          break;
        case 536870912:
          c = jc;
          break;
        default:
          c = hc;
      }
      c = Fk(c, Gk.bind(null, a));
    }
    a.callbackPriority = b;
    a.callbackNode = c;
  }
}
function Gk(a, b) {
  Ak = -1;
  Bk = 0;
  if (0 !== (K & 6)) throw Error(p(327));
  var c = a.callbackNode;
  if (Hk() && a.callbackNode !== c) return null;
  var d = uc(a, a === Q ? Z : 0);
  if (0 === d) return null;
  if (0 !== (d & 30) || 0 !== (d & a.expiredLanes) || b) b = Ik(a, d);
  else {
    b = d;
    var e = K;
    K |= 2;
    var f2 = Jk();
    if (Q !== a || Z !== b) uk = null, Gj = B() + 500, Kk(a, b);
    do
      try {
        Lk();
        break;
      } catch (h) {
        Mk(a, h);
      }
    while (1);
    $g();
    mk.current = f2;
    K = e;
    null !== Y ? b = 0 : (Q = null, Z = 0, b = T);
  }
  if (0 !== b) {
    2 === b && (e = xc(a), 0 !== e && (d = e, b = Nk(a, e)));
    if (1 === b) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
    if (6 === b) Ck(a, d);
    else {
      e = a.current.alternate;
      if (0 === (d & 30) && !Ok(e) && (b = Ik(a, d), 2 === b && (f2 = xc(a), 0 !== f2 && (d = f2, b = Nk(a, f2))), 1 === b)) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
      a.finishedWork = e;
      a.finishedLanes = d;
      switch (b) {
        case 0:
        case 1:
          throw Error(p(345));
        case 2:
          Pk(a, tk, uk);
          break;
        case 3:
          Ck(a, d);
          if ((d & 130023424) === d && (b = fk + 500 - B(), 10 < b)) {
            if (0 !== uc(a, 0)) break;
            e = a.suspendedLanes;
            if ((e & d) !== d) {
              R();
              a.pingedLanes |= a.suspendedLanes & e;
              break;
            }
            a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), b);
            break;
          }
          Pk(a, tk, uk);
          break;
        case 4:
          Ck(a, d);
          if ((d & 4194240) === d) break;
          b = a.eventTimes;
          for (e = -1; 0 < d; ) {
            var g = 31 - oc(d);
            f2 = 1 << g;
            g = b[g];
            g > e && (e = g);
            d &= ~f2;
          }
          d = e;
          d = B() - d;
          d = (120 > d ? 120 : 480 > d ? 480 : 1080 > d ? 1080 : 1920 > d ? 1920 : 3e3 > d ? 3e3 : 4320 > d ? 4320 : 1960 * lk(d / 1960)) - d;
          if (10 < d) {
            a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), d);
            break;
          }
          Pk(a, tk, uk);
          break;
        case 5:
          Pk(a, tk, uk);
          break;
        default:
          throw Error(p(329));
      }
    }
  }
  Dk(a, B());
  return a.callbackNode === c ? Gk.bind(null, a) : null;
}
function Nk(a, b) {
  var c = sk;
  a.current.memoizedState.isDehydrated && (Kk(a, b).flags |= 256);
  a = Ik(a, b);
  2 !== a && (b = tk, tk = c, null !== b && Fj(b));
  return a;
}
function Fj(a) {
  null === tk ? tk = a : tk.push.apply(tk, a);
}
function Ok(a) {
  for (var b = a; ; ) {
    if (b.flags & 16384) {
      var c = b.updateQueue;
      if (null !== c && (c = c.stores, null !== c)) for (var d = 0; d < c.length; d++) {
        var e = c[d], f2 = e.getSnapshot;
        e = e.value;
        try {
          if (!He(f2(), e)) return false;
        } catch (g) {
          return false;
        }
      }
    }
    c = b.child;
    if (b.subtreeFlags & 16384 && null !== c) c.return = b, b = c;
    else {
      if (b === a) break;
      for (; null === b.sibling; ) {
        if (null === b.return || b.return === a) return true;
        b = b.return;
      }
      b.sibling.return = b.return;
      b = b.sibling;
    }
  }
  return true;
}
function Ck(a, b) {
  b &= ~rk;
  b &= ~qk;
  a.suspendedLanes |= b;
  a.pingedLanes &= ~b;
  for (a = a.expirationTimes; 0 < b; ) {
    var c = 31 - oc(b), d = 1 << c;
    a[c] = -1;
    b &= ~d;
  }
}
function Ek(a) {
  if (0 !== (K & 6)) throw Error(p(327));
  Hk();
  var b = uc(a, 0);
  if (0 === (b & 1)) return Dk(a, B()), null;
  var c = Ik(a, b);
  if (0 !== a.tag && 2 === c) {
    var d = xc(a);
    0 !== d && (b = d, c = Nk(a, d));
  }
  if (1 === c) throw c = pk, Kk(a, 0), Ck(a, b), Dk(a, B()), c;
  if (6 === c) throw Error(p(345));
  a.finishedWork = a.current.alternate;
  a.finishedLanes = b;
  Pk(a, tk, uk);
  Dk(a, B());
  return null;
}
function Qk(a, b) {
  var c = K;
  K |= 1;
  try {
    return a(b);
  } finally {
    K = c, 0 === K && (Gj = B() + 500, fg && jg());
  }
}
function Rk(a) {
  null !== wk && 0 === wk.tag && 0 === (K & 6) && Hk();
  var b = K;
  K |= 1;
  var c = ok.transition, d = C;
  try {
    if (ok.transition = null, C = 1, a) return a();
  } finally {
    C = d, ok.transition = c, K = b, 0 === (K & 6) && jg();
  }
}
function Hj() {
  fj = ej.current;
  E(ej);
}
function Kk(a, b) {
  a.finishedWork = null;
  a.finishedLanes = 0;
  var c = a.timeoutHandle;
  -1 !== c && (a.timeoutHandle = -1, Gf(c));
  if (null !== Y) for (c = Y.return; null !== c; ) {
    var d = c;
    wg(d);
    switch (d.tag) {
      case 1:
        d = d.type.childContextTypes;
        null !== d && void 0 !== d && $f();
        break;
      case 3:
        zh();
        E(Wf);
        E(H);
        Eh();
        break;
      case 5:
        Bh(d);
        break;
      case 4:
        zh();
        break;
      case 13:
        E(L);
        break;
      case 19:
        E(L);
        break;
      case 10:
        ah(d.type._context);
        break;
      case 22:
      case 23:
        Hj();
    }
    c = c.return;
  }
  Q = a;
  Y = a = Pg(a.current, null);
  Z = fj = b;
  T = 0;
  pk = null;
  rk = qk = rh = 0;
  tk = sk = null;
  if (null !== fh) {
    for (b = 0; b < fh.length; b++) if (c = fh[b], d = c.interleaved, null !== d) {
      c.interleaved = null;
      var e = d.next, f2 = c.pending;
      if (null !== f2) {
        var g = f2.next;
        f2.next = e;
        d.next = g;
      }
      c.pending = d;
    }
    fh = null;
  }
  return a;
}
function Mk(a, b) {
  do {
    var c = Y;
    try {
      $g();
      Fh.current = Rh;
      if (Ih) {
        for (var d = M.memoizedState; null !== d; ) {
          var e = d.queue;
          null !== e && (e.pending = null);
          d = d.next;
        }
        Ih = false;
      }
      Hh = 0;
      O = N = M = null;
      Jh = false;
      Kh = 0;
      nk.current = null;
      if (null === c || null === c.return) {
        T = 1;
        pk = b;
        Y = null;
        break;
      }
      a: {
        var f2 = a, g = c.return, h = c, k2 = b;
        b = Z;
        h.flags |= 32768;
        if (null !== k2 && "object" === typeof k2 && "function" === typeof k2.then) {
          var l2 = k2, m2 = h, q2 = m2.tag;
          if (0 === (m2.mode & 1) && (0 === q2 || 11 === q2 || 15 === q2)) {
            var r2 = m2.alternate;
            r2 ? (m2.updateQueue = r2.updateQueue, m2.memoizedState = r2.memoizedState, m2.lanes = r2.lanes) : (m2.updateQueue = null, m2.memoizedState = null);
          }
          var y2 = Ui(g);
          if (null !== y2) {
            y2.flags &= -257;
            Vi(y2, g, h, f2, b);
            y2.mode & 1 && Si(f2, l2, b);
            b = y2;
            k2 = l2;
            var n2 = b.updateQueue;
            if (null === n2) {
              var t2 = /* @__PURE__ */ new Set();
              t2.add(k2);
              b.updateQueue = t2;
            } else n2.add(k2);
            break a;
          } else {
            if (0 === (b & 1)) {
              Si(f2, l2, b);
              tj();
              break a;
            }
            k2 = Error(p(426));
          }
        } else if (I && h.mode & 1) {
          var J2 = Ui(g);
          if (null !== J2) {
            0 === (J2.flags & 65536) && (J2.flags |= 256);
            Vi(J2, g, h, f2, b);
            Jg(Ji(k2, h));
            break a;
          }
        }
        f2 = k2 = Ji(k2, h);
        4 !== T && (T = 2);
        null === sk ? sk = [f2] : sk.push(f2);
        f2 = g;
        do {
          switch (f2.tag) {
            case 3:
              f2.flags |= 65536;
              b &= -b;
              f2.lanes |= b;
              var x2 = Ni(f2, k2, b);
              ph(f2, x2);
              break a;
            case 1:
              h = k2;
              var w2 = f2.type, u2 = f2.stateNode;
              if (0 === (f2.flags & 128) && ("function" === typeof w2.getDerivedStateFromError || null !== u2 && "function" === typeof u2.componentDidCatch && (null === Ri || !Ri.has(u2)))) {
                f2.flags |= 65536;
                b &= -b;
                f2.lanes |= b;
                var F2 = Qi(f2, h, b);
                ph(f2, F2);
                break a;
              }
          }
          f2 = f2.return;
        } while (null !== f2);
      }
      Sk(c);
    } catch (na) {
      b = na;
      Y === c && null !== c && (Y = c = c.return);
      continue;
    }
    break;
  } while (1);
}
function Jk() {
  var a = mk.current;
  mk.current = Rh;
  return null === a ? Rh : a;
}
function tj() {
  if (0 === T || 3 === T || 2 === T) T = 4;
  null === Q || 0 === (rh & 268435455) && 0 === (qk & 268435455) || Ck(Q, Z);
}
function Ik(a, b) {
  var c = K;
  K |= 2;
  var d = Jk();
  if (Q !== a || Z !== b) uk = null, Kk(a, b);
  do
    try {
      Tk();
      break;
    } catch (e) {
      Mk(a, e);
    }
  while (1);
  $g();
  K = c;
  mk.current = d;
  if (null !== Y) throw Error(p(261));
  Q = null;
  Z = 0;
  return T;
}
function Tk() {
  for (; null !== Y; ) Uk(Y);
}
function Lk() {
  for (; null !== Y && !cc(); ) Uk(Y);
}
function Uk(a) {
  var b = Vk(a.alternate, a, fj);
  a.memoizedProps = a.pendingProps;
  null === b ? Sk(a) : Y = b;
  nk.current = null;
}
function Sk(a) {
  var b = a;
  do {
    var c = b.alternate;
    a = b.return;
    if (0 === (b.flags & 32768)) {
      if (c = Ej(c, b, fj), null !== c) {
        Y = c;
        return;
      }
    } else {
      c = Ij(c, b);
      if (null !== c) {
        c.flags &= 32767;
        Y = c;
        return;
      }
      if (null !== a) a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null;
      else {
        T = 6;
        Y = null;
        return;
      }
    }
    b = b.sibling;
    if (null !== b) {
      Y = b;
      return;
    }
    Y = b = a;
  } while (null !== b);
  0 === T && (T = 5);
}
function Pk(a, b, c) {
  var d = C, e = ok.transition;
  try {
    ok.transition = null, C = 1, Wk(a, b, c, d);
  } finally {
    ok.transition = e, C = d;
  }
  return null;
}
function Wk(a, b, c, d) {
  do
    Hk();
  while (null !== wk);
  if (0 !== (K & 6)) throw Error(p(327));
  c = a.finishedWork;
  var e = a.finishedLanes;
  if (null === c) return null;
  a.finishedWork = null;
  a.finishedLanes = 0;
  if (c === a.current) throw Error(p(177));
  a.callbackNode = null;
  a.callbackPriority = 0;
  var f2 = c.lanes | c.childLanes;
  Bc(a, f2);
  a === Q && (Y = Q = null, Z = 0);
  0 === (c.subtreeFlags & 2064) && 0 === (c.flags & 2064) || vk || (vk = true, Fk(hc, function() {
    Hk();
    return null;
  }));
  f2 = 0 !== (c.flags & 15990);
  if (0 !== (c.subtreeFlags & 15990) || f2) {
    f2 = ok.transition;
    ok.transition = null;
    var g = C;
    C = 1;
    var h = K;
    K |= 4;
    nk.current = null;
    Oj(a, c);
    dk(c, a);
    Oe(Df);
    dd = !!Cf;
    Df = Cf = null;
    a.current = c;
    hk(c);
    dc();
    K = h;
    C = g;
    ok.transition = f2;
  } else a.current = c;
  vk && (vk = false, wk = a, xk = e);
  f2 = a.pendingLanes;
  0 === f2 && (Ri = null);
  mc(c.stateNode);
  Dk(a, B());
  if (null !== b) for (d = a.onRecoverableError, c = 0; c < b.length; c++) e = b[c], d(e.value, { componentStack: e.stack, digest: e.digest });
  if (Oi) throw Oi = false, a = Pi, Pi = null, a;
  0 !== (xk & 1) && 0 !== a.tag && Hk();
  f2 = a.pendingLanes;
  0 !== (f2 & 1) ? a === zk ? yk++ : (yk = 0, zk = a) : yk = 0;
  jg();
  return null;
}
function Hk() {
  if (null !== wk) {
    var a = Dc(xk), b = ok.transition, c = C;
    try {
      ok.transition = null;
      C = 16 > a ? 16 : a;
      if (null === wk) var d = false;
      else {
        a = wk;
        wk = null;
        xk = 0;
        if (0 !== (K & 6)) throw Error(p(331));
        var e = K;
        K |= 4;
        for (V = a.current; null !== V; ) {
          var f2 = V, g = f2.child;
          if (0 !== (V.flags & 16)) {
            var h = f2.deletions;
            if (null !== h) {
              for (var k2 = 0; k2 < h.length; k2++) {
                var l2 = h[k2];
                for (V = l2; null !== V; ) {
                  var m2 = V;
                  switch (m2.tag) {
                    case 0:
                    case 11:
                    case 15:
                      Pj(8, m2, f2);
                  }
                  var q2 = m2.child;
                  if (null !== q2) q2.return = m2, V = q2;
                  else for (; null !== V; ) {
                    m2 = V;
                    var r2 = m2.sibling, y2 = m2.return;
                    Sj(m2);
                    if (m2 === l2) {
                      V = null;
                      break;
                    }
                    if (null !== r2) {
                      r2.return = y2;
                      V = r2;
                      break;
                    }
                    V = y2;
                  }
                }
              }
              var n2 = f2.alternate;
              if (null !== n2) {
                var t2 = n2.child;
                if (null !== t2) {
                  n2.child = null;
                  do {
                    var J2 = t2.sibling;
                    t2.sibling = null;
                    t2 = J2;
                  } while (null !== t2);
                }
              }
              V = f2;
            }
          }
          if (0 !== (f2.subtreeFlags & 2064) && null !== g) g.return = f2, V = g;
          else b: for (; null !== V; ) {
            f2 = V;
            if (0 !== (f2.flags & 2048)) switch (f2.tag) {
              case 0:
              case 11:
              case 15:
                Pj(9, f2, f2.return);
            }
            var x2 = f2.sibling;
            if (null !== x2) {
              x2.return = f2.return;
              V = x2;
              break b;
            }
            V = f2.return;
          }
        }
        var w2 = a.current;
        for (V = w2; null !== V; ) {
          g = V;
          var u2 = g.child;
          if (0 !== (g.subtreeFlags & 2064) && null !== u2) u2.return = g, V = u2;
          else b: for (g = w2; null !== V; ) {
            h = V;
            if (0 !== (h.flags & 2048)) try {
              switch (h.tag) {
                case 0:
                case 11:
                case 15:
                  Qj(9, h);
              }
            } catch (na) {
              W(h, h.return, na);
            }
            if (h === g) {
              V = null;
              break b;
            }
            var F2 = h.sibling;
            if (null !== F2) {
              F2.return = h.return;
              V = F2;
              break b;
            }
            V = h.return;
          }
        }
        K = e;
        jg();
        if (lc && "function" === typeof lc.onPostCommitFiberRoot) try {
          lc.onPostCommitFiberRoot(kc, a);
        } catch (na) {
        }
        d = true;
      }
      return d;
    } finally {
      C = c, ok.transition = b;
    }
  }
  return false;
}
function Xk(a, b, c) {
  b = Ji(c, b);
  b = Ni(a, b, 1);
  a = nh(a, b, 1);
  b = R();
  null !== a && (Ac(a, 1, b), Dk(a, b));
}
function W(a, b, c) {
  if (3 === a.tag) Xk(a, a, c);
  else for (; null !== b; ) {
    if (3 === b.tag) {
      Xk(b, a, c);
      break;
    } else if (1 === b.tag) {
      var d = b.stateNode;
      if ("function" === typeof b.type.getDerivedStateFromError || "function" === typeof d.componentDidCatch && (null === Ri || !Ri.has(d))) {
        a = Ji(c, a);
        a = Qi(b, a, 1);
        b = nh(b, a, 1);
        a = R();
        null !== b && (Ac(b, 1, a), Dk(b, a));
        break;
      }
    }
    b = b.return;
  }
}
function Ti(a, b, c) {
  var d = a.pingCache;
  null !== d && d.delete(b);
  b = R();
  a.pingedLanes |= a.suspendedLanes & c;
  Q === a && (Z & c) === c && (4 === T || 3 === T && (Z & 130023424) === Z && 500 > B() - fk ? Kk(a, 0) : rk |= c);
  Dk(a, b);
}
function Yk(a, b) {
  0 === b && (0 === (a.mode & 1) ? b = 1 : (b = sc, sc <<= 1, 0 === (sc & 130023424) && (sc = 4194304)));
  var c = R();
  a = ih(a, b);
  null !== a && (Ac(a, b, c), Dk(a, c));
}
function uj(a) {
  var b = a.memoizedState, c = 0;
  null !== b && (c = b.retryLane);
  Yk(a, c);
}
function bk(a, b) {
  var c = 0;
  switch (a.tag) {
    case 13:
      var d = a.stateNode;
      var e = a.memoizedState;
      null !== e && (c = e.retryLane);
      break;
    case 19:
      d = a.stateNode;
      break;
    default:
      throw Error(p(314));
  }
  null !== d && d.delete(b);
  Yk(a, c);
}
var Vk;
Vk = function(a, b, c) {
  if (null !== a) if (a.memoizedProps !== b.pendingProps || Wf.current) dh = true;
  else {
    if (0 === (a.lanes & c) && 0 === (b.flags & 128)) return dh = false, yj(a, b, c);
    dh = 0 !== (a.flags & 131072) ? true : false;
  }
  else dh = false, I && 0 !== (b.flags & 1048576) && ug(b, ng, b.index);
  b.lanes = 0;
  switch (b.tag) {
    case 2:
      var d = b.type;
      ij(a, b);
      a = b.pendingProps;
      var e = Yf(b, H.current);
      ch(b, c);
      e = Nh(null, b, d, a, e, c);
      var f2 = Sh();
      b.flags |= 1;
      "object" === typeof e && null !== e && "function" === typeof e.render && void 0 === e.$$typeof ? (b.tag = 1, b.memoizedState = null, b.updateQueue = null, Zf(d) ? (f2 = true, cg(b)) : f2 = false, b.memoizedState = null !== e.state && void 0 !== e.state ? e.state : null, kh(b), e.updater = Ei, b.stateNode = e, e._reactInternals = b, Ii(b, d, a, c), b = jj(null, b, d, true, f2, c)) : (b.tag = 0, I && f2 && vg(b), Xi(null, b, e, c), b = b.child);
      return b;
    case 16:
      d = b.elementType;
      a: {
        ij(a, b);
        a = b.pendingProps;
        e = d._init;
        d = e(d._payload);
        b.type = d;
        e = b.tag = Zk(d);
        a = Ci(d, a);
        switch (e) {
          case 0:
            b = cj(null, b, d, a, c);
            break a;
          case 1:
            b = hj(null, b, d, a, c);
            break a;
          case 11:
            b = Yi(null, b, d, a, c);
            break a;
          case 14:
            b = $i(null, b, d, Ci(d.type, a), c);
            break a;
        }
        throw Error(p(
          306,
          d,
          ""
        ));
      }
      return b;
    case 0:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), cj(a, b, d, e, c);
    case 1:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), hj(a, b, d, e, c);
    case 3:
      a: {
        kj(b);
        if (null === a) throw Error(p(387));
        d = b.pendingProps;
        f2 = b.memoizedState;
        e = f2.element;
        lh(a, b);
        qh(b, d, null, c);
        var g = b.memoizedState;
        d = g.element;
        if (f2.isDehydrated) if (f2 = { element: d, isDehydrated: false, cache: g.cache, pendingSuspenseBoundaries: g.pendingSuspenseBoundaries, transitions: g.transitions }, b.updateQueue.baseState = f2, b.memoizedState = f2, b.flags & 256) {
          e = Ji(Error(p(423)), b);
          b = lj(a, b, d, c, e);
          break a;
        } else if (d !== e) {
          e = Ji(Error(p(424)), b);
          b = lj(a, b, d, c, e);
          break a;
        } else for (yg = Lf(b.stateNode.containerInfo.firstChild), xg = b, I = true, zg = null, c = Vg(b, null, d, c), b.child = c; c; ) c.flags = c.flags & -3 | 4096, c = c.sibling;
        else {
          Ig();
          if (d === e) {
            b = Zi(a, b, c);
            break a;
          }
          Xi(a, b, d, c);
        }
        b = b.child;
      }
      return b;
    case 5:
      return Ah(b), null === a && Eg(b), d = b.type, e = b.pendingProps, f2 = null !== a ? a.memoizedProps : null, g = e.children, Ef(d, e) ? g = null : null !== f2 && Ef(d, f2) && (b.flags |= 32), gj(a, b), Xi(a, b, g, c), b.child;
    case 6:
      return null === a && Eg(b), null;
    case 13:
      return oj(a, b, c);
    case 4:
      return yh(b, b.stateNode.containerInfo), d = b.pendingProps, null === a ? b.child = Ug(b, null, d, c) : Xi(a, b, d, c), b.child;
    case 11:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), Yi(a, b, d, e, c);
    case 7:
      return Xi(a, b, b.pendingProps, c), b.child;
    case 8:
      return Xi(a, b, b.pendingProps.children, c), b.child;
    case 12:
      return Xi(a, b, b.pendingProps.children, c), b.child;
    case 10:
      a: {
        d = b.type._context;
        e = b.pendingProps;
        f2 = b.memoizedProps;
        g = e.value;
        G(Wg, d._currentValue);
        d._currentValue = g;
        if (null !== f2) if (He(f2.value, g)) {
          if (f2.children === e.children && !Wf.current) {
            b = Zi(a, b, c);
            break a;
          }
        } else for (f2 = b.child, null !== f2 && (f2.return = b); null !== f2; ) {
          var h = f2.dependencies;
          if (null !== h) {
            g = f2.child;
            for (var k2 = h.firstContext; null !== k2; ) {
              if (k2.context === d) {
                if (1 === f2.tag) {
                  k2 = mh(-1, c & -c);
                  k2.tag = 2;
                  var l2 = f2.updateQueue;
                  if (null !== l2) {
                    l2 = l2.shared;
                    var m2 = l2.pending;
                    null === m2 ? k2.next = k2 : (k2.next = m2.next, m2.next = k2);
                    l2.pending = k2;
                  }
                }
                f2.lanes |= c;
                k2 = f2.alternate;
                null !== k2 && (k2.lanes |= c);
                bh(
                  f2.return,
                  c,
                  b
                );
                h.lanes |= c;
                break;
              }
              k2 = k2.next;
            }
          } else if (10 === f2.tag) g = f2.type === b.type ? null : f2.child;
          else if (18 === f2.tag) {
            g = f2.return;
            if (null === g) throw Error(p(341));
            g.lanes |= c;
            h = g.alternate;
            null !== h && (h.lanes |= c);
            bh(g, c, b);
            g = f2.sibling;
          } else g = f2.child;
          if (null !== g) g.return = f2;
          else for (g = f2; null !== g; ) {
            if (g === b) {
              g = null;
              break;
            }
            f2 = g.sibling;
            if (null !== f2) {
              f2.return = g.return;
              g = f2;
              break;
            }
            g = g.return;
          }
          f2 = g;
        }
        Xi(a, b, e.children, c);
        b = b.child;
      }
      return b;
    case 9:
      return e = b.type, d = b.pendingProps.children, ch(b, c), e = eh(e), d = d(e), b.flags |= 1, Xi(a, b, d, c), b.child;
    case 14:
      return d = b.type, e = Ci(d, b.pendingProps), e = Ci(d.type, e), $i(a, b, d, e, c);
    case 15:
      return bj(a, b, b.type, b.pendingProps, c);
    case 17:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), ij(a, b), b.tag = 1, Zf(d) ? (a = true, cg(b)) : a = false, ch(b, c), Gi(b, d, e), Ii(b, d, e, c), jj(null, b, d, true, a, c);
    case 19:
      return xj(a, b, c);
    case 22:
      return dj(a, b, c);
  }
  throw Error(p(156, b.tag));
};
function Fk(a, b) {
  return ac(a, b);
}
function $k(a, b, c, d) {
  this.tag = a;
  this.key = c;
  this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
  this.index = 0;
  this.ref = null;
  this.pendingProps = b;
  this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
  this.mode = d;
  this.subtreeFlags = this.flags = 0;
  this.deletions = null;
  this.childLanes = this.lanes = 0;
  this.alternate = null;
}
function Bg(a, b, c, d) {
  return new $k(a, b, c, d);
}
function aj(a) {
  a = a.prototype;
  return !(!a || !a.isReactComponent);
}
function Zk(a) {
  if ("function" === typeof a) return aj(a) ? 1 : 0;
  if (void 0 !== a && null !== a) {
    a = a.$$typeof;
    if (a === Da) return 11;
    if (a === Ga) return 14;
  }
  return 2;
}
function Pg(a, b) {
  var c = a.alternate;
  null === c ? (c = Bg(a.tag, b, a.key, a.mode), c.elementType = a.elementType, c.type = a.type, c.stateNode = a.stateNode, c.alternate = a, a.alternate = c) : (c.pendingProps = b, c.type = a.type, c.flags = 0, c.subtreeFlags = 0, c.deletions = null);
  c.flags = a.flags & 14680064;
  c.childLanes = a.childLanes;
  c.lanes = a.lanes;
  c.child = a.child;
  c.memoizedProps = a.memoizedProps;
  c.memoizedState = a.memoizedState;
  c.updateQueue = a.updateQueue;
  b = a.dependencies;
  c.dependencies = null === b ? null : { lanes: b.lanes, firstContext: b.firstContext };
  c.sibling = a.sibling;
  c.index = a.index;
  c.ref = a.ref;
  return c;
}
function Rg(a, b, c, d, e, f2) {
  var g = 2;
  d = a;
  if ("function" === typeof a) aj(a) && (g = 1);
  else if ("string" === typeof a) g = 5;
  else a: switch (a) {
    case ya:
      return Tg(c.children, e, f2, b);
    case za:
      g = 8;
      e |= 8;
      break;
    case Aa:
      return a = Bg(12, c, b, e | 2), a.elementType = Aa, a.lanes = f2, a;
    case Ea:
      return a = Bg(13, c, b, e), a.elementType = Ea, a.lanes = f2, a;
    case Fa:
      return a = Bg(19, c, b, e), a.elementType = Fa, a.lanes = f2, a;
    case Ia:
      return pj(c, e, f2, b);
    default:
      if ("object" === typeof a && null !== a) switch (a.$$typeof) {
        case Ba:
          g = 10;
          break a;
        case Ca:
          g = 9;
          break a;
        case Da:
          g = 11;
          break a;
        case Ga:
          g = 14;
          break a;
        case Ha:
          g = 16;
          d = null;
          break a;
      }
      throw Error(p(130, null == a ? a : typeof a, ""));
  }
  b = Bg(g, c, b, e);
  b.elementType = a;
  b.type = d;
  b.lanes = f2;
  return b;
}
function Tg(a, b, c, d) {
  a = Bg(7, a, d, b);
  a.lanes = c;
  return a;
}
function pj(a, b, c, d) {
  a = Bg(22, a, d, b);
  a.elementType = Ia;
  a.lanes = c;
  a.stateNode = { isHidden: false };
  return a;
}
function Qg(a, b, c) {
  a = Bg(6, a, null, b);
  a.lanes = c;
  return a;
}
function Sg(a, b, c) {
  b = Bg(4, null !== a.children ? a.children : [], a.key, b);
  b.lanes = c;
  b.stateNode = { containerInfo: a.containerInfo, pendingChildren: null, implementation: a.implementation };
  return b;
}
function al(a, b, c, d, e) {
  this.tag = b;
  this.containerInfo = a;
  this.finishedWork = this.pingCache = this.current = this.pendingChildren = null;
  this.timeoutHandle = -1;
  this.callbackNode = this.pendingContext = this.context = null;
  this.callbackPriority = 0;
  this.eventTimes = zc(0);
  this.expirationTimes = zc(-1);
  this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
  this.entanglements = zc(0);
  this.identifierPrefix = d;
  this.onRecoverableError = e;
  this.mutableSourceEagerHydrationData = null;
}
function bl(a, b, c, d, e, f2, g, h, k2) {
  a = new al(a, b, c, h, k2);
  1 === b ? (b = 1, true === f2 && (b |= 8)) : b = 0;
  f2 = Bg(3, null, null, b);
  a.current = f2;
  f2.stateNode = a;
  f2.memoizedState = { element: d, isDehydrated: c, cache: null, transitions: null, pendingSuspenseBoundaries: null };
  kh(f2);
  return a;
}
function cl(a, b, c) {
  var d = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
  return { $$typeof: wa, key: null == d ? null : "" + d, children: a, containerInfo: b, implementation: c };
}
function dl(a) {
  if (!a) return Vf;
  a = a._reactInternals;
  a: {
    if (Vb(a) !== a || 1 !== a.tag) throw Error(p(170));
    var b = a;
    do {
      switch (b.tag) {
        case 3:
          b = b.stateNode.context;
          break a;
        case 1:
          if (Zf(b.type)) {
            b = b.stateNode.__reactInternalMemoizedMergedChildContext;
            break a;
          }
      }
      b = b.return;
    } while (null !== b);
    throw Error(p(171));
  }
  if (1 === a.tag) {
    var c = a.type;
    if (Zf(c)) return bg(a, c, b);
  }
  return b;
}
function el(a, b, c, d, e, f2, g, h, k2) {
  a = bl(c, d, true, a, e, f2, g, h, k2);
  a.context = dl(null);
  c = a.current;
  d = R();
  e = yi(c);
  f2 = mh(d, e);
  f2.callback = void 0 !== b && null !== b ? b : null;
  nh(c, f2, e);
  a.current.lanes = e;
  Ac(a, e, d);
  Dk(a, d);
  return a;
}
function fl(a, b, c, d) {
  var e = b.current, f2 = R(), g = yi(e);
  c = dl(c);
  null === b.context ? b.context = c : b.pendingContext = c;
  b = mh(f2, g);
  b.payload = { element: a };
  d = void 0 === d ? null : d;
  null !== d && (b.callback = d);
  a = nh(e, b, g);
  null !== a && (gi(a, e, g, f2), oh(a, e, g));
  return g;
}
function gl(a) {
  a = a.current;
  if (!a.child) return null;
  switch (a.child.tag) {
    case 5:
      return a.child.stateNode;
    default:
      return a.child.stateNode;
  }
}
function hl(a, b) {
  a = a.memoizedState;
  if (null !== a && null !== a.dehydrated) {
    var c = a.retryLane;
    a.retryLane = 0 !== c && c < b ? c : b;
  }
}
function il(a, b) {
  hl(a, b);
  (a = a.alternate) && hl(a, b);
}
function jl() {
  return null;
}
var kl = "function" === typeof reportError ? reportError : function(a) {
  console.error(a);
};
function ll(a) {
  this._internalRoot = a;
}
ml.prototype.render = ll.prototype.render = function(a) {
  var b = this._internalRoot;
  if (null === b) throw Error(p(409));
  fl(a, b, null, null);
};
ml.prototype.unmount = ll.prototype.unmount = function() {
  var a = this._internalRoot;
  if (null !== a) {
    this._internalRoot = null;
    var b = a.containerInfo;
    Rk(function() {
      fl(null, a, null, null);
    });
    b[uf] = null;
  }
};
function ml(a) {
  this._internalRoot = a;
}
ml.prototype.unstable_scheduleHydration = function(a) {
  if (a) {
    var b = Hc();
    a = { blockedOn: null, target: a, priority: b };
    for (var c = 0; c < Qc.length && 0 !== b && b < Qc[c].priority; c++) ;
    Qc.splice(c, 0, a);
    0 === c && Vc(a);
  }
};
function nl(a) {
  return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType);
}
function ol(a) {
  return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType && (8 !== a.nodeType || " react-mount-point-unstable " !== a.nodeValue));
}
function pl() {
}
function ql(a, b, c, d, e) {
  if (e) {
    if ("function" === typeof d) {
      var f2 = d;
      d = function() {
        var a2 = gl(g);
        f2.call(a2);
      };
    }
    var g = el(b, d, a, 0, null, false, false, "", pl);
    a._reactRootContainer = g;
    a[uf] = g.current;
    sf(8 === a.nodeType ? a.parentNode : a);
    Rk();
    return g;
  }
  for (; e = a.lastChild; ) a.removeChild(e);
  if ("function" === typeof d) {
    var h = d;
    d = function() {
      var a2 = gl(k2);
      h.call(a2);
    };
  }
  var k2 = bl(a, 0, false, null, null, false, false, "", pl);
  a._reactRootContainer = k2;
  a[uf] = k2.current;
  sf(8 === a.nodeType ? a.parentNode : a);
  Rk(function() {
    fl(b, k2, c, d);
  });
  return k2;
}
function rl(a, b, c, d, e) {
  var f2 = c._reactRootContainer;
  if (f2) {
    var g = f2;
    if ("function" === typeof e) {
      var h = e;
      e = function() {
        var a2 = gl(g);
        h.call(a2);
      };
    }
    fl(b, g, a, e);
  } else g = ql(c, b, a, e, d);
  return gl(g);
}
Ec = function(a) {
  switch (a.tag) {
    case 3:
      var b = a.stateNode;
      if (b.current.memoizedState.isDehydrated) {
        var c = tc(b.pendingLanes);
        0 !== c && (Cc(b, c | 1), Dk(b, B()), 0 === (K & 6) && (Gj = B() + 500, jg()));
      }
      break;
    case 13:
      Rk(function() {
        var b2 = ih(a, 1);
        if (null !== b2) {
          var c2 = R();
          gi(b2, a, 1, c2);
        }
      }), il(a, 1);
  }
};
Fc = function(a) {
  if (13 === a.tag) {
    var b = ih(a, 134217728);
    if (null !== b) {
      var c = R();
      gi(b, a, 134217728, c);
    }
    il(a, 134217728);
  }
};
Gc = function(a) {
  if (13 === a.tag) {
    var b = yi(a), c = ih(a, b);
    if (null !== c) {
      var d = R();
      gi(c, a, b, d);
    }
    il(a, b);
  }
};
Hc = function() {
  return C;
};
Ic = function(a, b) {
  var c = C;
  try {
    return C = a, b();
  } finally {
    C = c;
  }
};
yb = function(a, b, c) {
  switch (b) {
    case "input":
      bb(a, c);
      b = c.name;
      if ("radio" === c.type && null != b) {
        for (c = a; c.parentNode; ) c = c.parentNode;
        c = c.querySelectorAll("input[name=" + JSON.stringify("" + b) + '][type="radio"]');
        for (b = 0; b < c.length; b++) {
          var d = c[b];
          if (d !== a && d.form === a.form) {
            var e = Db(d);
            if (!e) throw Error(p(90));
            Wa(d);
            bb(d, e);
          }
        }
      }
      break;
    case "textarea":
      ib(a, c);
      break;
    case "select":
      b = c.value, null != b && fb(a, !!c.multiple, b, false);
  }
};
Gb = Qk;
Hb = Rk;
var sl = { usingClientEntryPoint: false, Events: [Cb, ue, Db, Eb, Fb, Qk] }, tl = { findFiberByHostInstance: Wc, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" };
var ul = { bundleType: tl.bundleType, version: tl.version, rendererPackageName: tl.rendererPackageName, rendererConfig: tl.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: ua.ReactCurrentDispatcher, findHostInstanceByFiber: function(a) {
  a = Zb(a);
  return null === a ? null : a.stateNode;
}, findFiberByHostInstance: tl.findFiberByHostInstance || jl, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
  var vl = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!vl.isDisabled && vl.supportsFiber) try {
    kc = vl.inject(ul), lc = vl;
  } catch (a) {
  }
}
reactDom_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = sl;
reactDom_production_min.createPortal = function(a, b) {
  var c = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
  if (!nl(b)) throw Error(p(200));
  return cl(a, b, null, c);
};
reactDom_production_min.createRoot = function(a, b) {
  if (!nl(a)) throw Error(p(299));
  var c = false, d = "", e = kl;
  null !== b && void 0 !== b && (true === b.unstable_strictMode && (c = true), void 0 !== b.identifierPrefix && (d = b.identifierPrefix), void 0 !== b.onRecoverableError && (e = b.onRecoverableError));
  b = bl(a, 1, false, null, null, c, false, d, e);
  a[uf] = b.current;
  sf(8 === a.nodeType ? a.parentNode : a);
  return new ll(b);
};
reactDom_production_min.findDOMNode = function(a) {
  if (null == a) return null;
  if (1 === a.nodeType) return a;
  var b = a._reactInternals;
  if (void 0 === b) {
    if ("function" === typeof a.render) throw Error(p(188));
    a = Object.keys(a).join(",");
    throw Error(p(268, a));
  }
  a = Zb(b);
  a = null === a ? null : a.stateNode;
  return a;
};
reactDom_production_min.flushSync = function(a) {
  return Rk(a);
};
reactDom_production_min.hydrate = function(a, b, c) {
  if (!ol(b)) throw Error(p(200));
  return rl(null, a, b, true, c);
};
reactDom_production_min.hydrateRoot = function(a, b, c) {
  if (!nl(a)) throw Error(p(405));
  var d = null != c && c.hydratedSources || null, e = false, f2 = "", g = kl;
  null !== c && void 0 !== c && (true === c.unstable_strictMode && (e = true), void 0 !== c.identifierPrefix && (f2 = c.identifierPrefix), void 0 !== c.onRecoverableError && (g = c.onRecoverableError));
  b = el(b, null, a, 1, null != c ? c : null, e, false, f2, g);
  a[uf] = b.current;
  sf(a);
  if (d) for (a = 0; a < d.length; a++) c = d[a], e = c._getVersion, e = e(c._source), null == b.mutableSourceEagerHydrationData ? b.mutableSourceEagerHydrationData = [c, e] : b.mutableSourceEagerHydrationData.push(
    c,
    e
  );
  return new ml(b);
};
reactDom_production_min.render = function(a, b, c) {
  if (!ol(b)) throw Error(p(200));
  return rl(null, a, b, false, c);
};
reactDom_production_min.unmountComponentAtNode = function(a) {
  if (!ol(a)) throw Error(p(40));
  return a._reactRootContainer ? (Rk(function() {
    rl(null, null, a, false, function() {
      a._reactRootContainer = null;
      a[uf] = null;
    });
  }), true) : false;
};
reactDom_production_min.unstable_batchedUpdates = Qk;
reactDom_production_min.unstable_renderSubtreeIntoContainer = function(a, b, c, d) {
  if (!ol(c)) throw Error(p(200));
  if (null == a || void 0 === a._reactInternals) throw Error(p(38));
  return rl(a, b, c, false, d);
};
reactDom_production_min.version = "18.3.1-next-f1338f8080-20240426";
function checkDCE() {
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
    return;
  }
  try {
    __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
  } catch (err) {
    console.error(err);
  }
}
{
  checkDCE();
  reactDom.exports = reactDom_production_min;
}
var reactDomExports = reactDom.exports;
var m = reactDomExports;
{
  client.createRoot = m.createRoot;
  client.hydrateRoot = m.hydrateRoot;
}
function Header({ title, subtitle, status, primaryAction }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "flex flex-col gap-6 border-b border-slate-200/70 pb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.4em] text-slate-400", children: subtitle }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-3 text-3xl font-semibold text-slate-900", children: title })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      status ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700", children: status }) : null,
      primaryAction ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: primaryAction.onClick,
          className: "flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/25 transition hover:-translate-y-0.5",
          children: [
            primaryAction.icon ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base", children: primaryAction.icon }) : null,
            primaryAction.label
          ]
        }
      ) : null
    ] })
  ] }) });
}
function MainLayout({ sidebar, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-h-screen bg-slate-50 text-slate-900", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pointer-events-none absolute inset-0 overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-20 left-1/3 h-72 w-72 rounded-full bg-amber-200/60 blur-3xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 right-10 h-80 w-80 rounded-full bg-sky-200/60 blur-3xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-10 top-1/2 h-40 w-64 -translate-y-1/2 rounded-[40%] bg-emerald-100/70 blur-2xl" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[260px_1fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full", children: sidebar }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex h-full flex-col gap-8 rounded-[32px] border border-slate-200/70 bg-white/80 p-8 shadow-xl shadow-slate-200/40 backdrop-blur", children })
    ] })
  ] });
}
function Sidebar({ items, activeId, onSelect }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "flex h-full w-full flex-col gap-6 border-r border-slate-200/70 bg-white/70 px-6 py-8 backdrop-blur", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.4em] text-slate-400", children: "Drapp" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-2 text-xl font-semibold text-slate-900", children: "Control Studio" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex flex-1 flex-col gap-2", children: items.map((item) => {
      const active = item.id === activeId;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => onSelect(item.id),
          className: `group flex items-center justify-between rounded-xl px-4 py-3 text-left transition ${active ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" : "text-slate-600 hover:bg-slate-100"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-lg ${active ? "text-white" : "text-slate-400"}`, children: item.icon }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium tracking-tight", children: item.label })
            ] }),
            item.hint ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: `rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-400"}`,
                children: item.hint
              }
            ) : null
          ]
        },
        item.id
      );
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4 text-xs text-slate-500", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-slate-700", children: "Focus mode" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2", children: "Queue tasks, schedule AI passes, and keep your library tidy." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-[11px] uppercase tracking-[0.3em] text-slate-400", children: "Shortcuts: Cmd/Ctrl + 1-6" })
    ] })
  ] });
}
function LockScreen({ onUnlock, isSetup, onSetupComplete }) {
  const [password, setPassword] = reactExports.useState("");
  const [confirmPassword, setConfirmPassword] = reactExports.useState("");
  const [error, setError] = reactExports.useState(null);
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const [showPassword, setShowPassword] = reactExports.useState(false);
  const inputRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const handleUnlock = async () => {
    if (!password) {
      setError("Please enter your password");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await window.api.appVerifyPassword(password);
      if (result.ok && result.valid) {
        onUnlock();
      } else {
        setError("Incorrect password");
        setPassword("");
      }
    } catch (err) {
      setError("Failed to verify password");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSetup = async () => {
    if (!password) {
      setError("Please enter a password");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await window.api.appSetPassword(password);
      if (result.ok) {
        onSetupComplete?.(password);
        onUnlock();
      } else {
        setError(result.error ?? "Failed to set password");
      }
    } catch (err) {
      setError("Failed to set password");
    } finally {
      setIsLoading(false);
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (isSetup) {
        void handleSetup();
      } else {
        void handleUnlock();
      }
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-slate-950", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-sm px-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-10 w-10 text-white", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-white", children: "Drapp" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-400", children: isSetup ? "Set up a password to protect your library" : "Enter your password to continue" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            ref: inputRef,
            type: showPassword ? "text" : "password",
            value: password,
            onChange: (e) => setPassword(e.target.value),
            onKeyDown: handleKeyDown,
            placeholder: isSetup ? "Create password" : "Enter password",
            className: "w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 pr-12 text-white placeholder-slate-500 backdrop-blur focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20",
            autoComplete: "off",
            disabled: isLoading
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setShowPassword(!showPassword),
            className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white",
            children: showPassword ? /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })
            ] })
          }
        )
      ] }),
      isSetup && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: showPassword ? "text" : "password",
          value: confirmPassword,
          onChange: (e) => setConfirmPassword(e.target.value),
          onKeyDown: handleKeyDown,
          placeholder: "Confirm password",
          className: "w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 backdrop-blur focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20",
          autoComplete: "off",
          disabled: isLoading
        }
      ),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400", children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: isSetup ? handleSetup : handleUnlock,
          disabled: isLoading,
          className: "w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-3 font-semibold text-white transition hover:from-purple-600 hover:to-pink-600 disabled:opacity-50",
          children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center justify-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "h-5 w-5 animate-spin", viewBox: "0 0 24 24", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4", fill: "none" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
            ] }),
            isSetup ? "Setting up..." : "Unlocking..."
          ] }) : isSetup ? "Set Password" : "Unlock"
        }
      )
    ] }),
    isSetup && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: onUnlock,
        className: "mt-4 w-full text-center text-sm text-slate-500 transition hover:text-slate-300",
        children: "Skip for now"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-8 text-center text-xs text-slate-600", children: "Your password is stored securely on this device" })
  ] }) });
}
const __vite_import_meta_env__$1 = {};
const createStoreImpl = (createState) => {
  let state;
  const listeners = /* @__PURE__ */ new Set();
  const setState = (partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, previousState));
    }
  };
  const getState = () => state;
  const getInitialState = () => initialState;
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const destroy = () => {
    if ((__vite_import_meta_env__$1 ? "production" : void 0) !== "production") {
      console.warn(
        "[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected."
      );
    }
    listeners.clear();
  };
  const api = { setState, getState, getInitialState, subscribe, destroy };
  const initialState = state = createState(setState, getState, api);
  return api;
};
const createStore = (createState) => createState ? createStoreImpl(createState) : createStoreImpl;
var withSelector = { exports: {} };
var withSelector_production = {};
var shim$2 = { exports: {} };
var useSyncExternalStoreShim_production = {};
/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var React$1 = reactExports;
function is$1(x2, y2) {
  return x2 === y2 && (0 !== x2 || 1 / x2 === 1 / y2) || x2 !== x2 && y2 !== y2;
}
var objectIs$1 = "function" === typeof Object.is ? Object.is : is$1, useState = React$1.useState, useEffect$1 = React$1.useEffect, useLayoutEffect = React$1.useLayoutEffect, useDebugValue$2 = React$1.useDebugValue;
function useSyncExternalStore$2(subscribe, getSnapshot) {
  var value = getSnapshot(), _useState = useState({ inst: { value, getSnapshot } }), inst = _useState[0].inst, forceUpdate = _useState[1];
  useLayoutEffect(
    function() {
      inst.value = value;
      inst.getSnapshot = getSnapshot;
      checkIfSnapshotChanged(inst) && forceUpdate({ inst });
    },
    [subscribe, value, getSnapshot]
  );
  useEffect$1(
    function() {
      checkIfSnapshotChanged(inst) && forceUpdate({ inst });
      return subscribe(function() {
        checkIfSnapshotChanged(inst) && forceUpdate({ inst });
      });
    },
    [subscribe]
  );
  useDebugValue$2(value);
  return value;
}
function checkIfSnapshotChanged(inst) {
  var latestGetSnapshot = inst.getSnapshot;
  inst = inst.value;
  try {
    var nextValue = latestGetSnapshot();
    return !objectIs$1(inst, nextValue);
  } catch (error) {
    return true;
  }
}
function useSyncExternalStore$1(subscribe, getSnapshot) {
  return getSnapshot();
}
var shim$1 = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
useSyncExternalStoreShim_production.useSyncExternalStore = void 0 !== React$1.useSyncExternalStore ? React$1.useSyncExternalStore : shim$1;
{
  shim$2.exports = useSyncExternalStoreShim_production;
}
var shimExports = shim$2.exports;
/**
 * @license React
 * use-sync-external-store-shim/with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var React = reactExports, shim = shimExports;
function is(x2, y2) {
  return x2 === y2 && (0 !== x2 || 1 / x2 === 1 / y2) || x2 !== x2 && y2 !== y2;
}
var objectIs = "function" === typeof Object.is ? Object.is : is, useSyncExternalStore = shim.useSyncExternalStore, useRef = React.useRef, useEffect = React.useEffect, useMemo = React.useMemo, useDebugValue$1 = React.useDebugValue;
withSelector_production.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
  var instRef = useRef(null);
  if (null === instRef.current) {
    var inst = { hasValue: false, value: null };
    instRef.current = inst;
  } else inst = instRef.current;
  instRef = useMemo(
    function() {
      function memoizedSelector(nextSnapshot) {
        if (!hasMemo) {
          hasMemo = true;
          memoizedSnapshot = nextSnapshot;
          nextSnapshot = selector(nextSnapshot);
          if (void 0 !== isEqual && inst.hasValue) {
            var currentSelection = inst.value;
            if (isEqual(currentSelection, nextSnapshot))
              return memoizedSelection = currentSelection;
          }
          return memoizedSelection = nextSnapshot;
        }
        currentSelection = memoizedSelection;
        if (objectIs(memoizedSnapshot, nextSnapshot)) return currentSelection;
        var nextSelection = selector(nextSnapshot);
        if (void 0 !== isEqual && isEqual(currentSelection, nextSelection))
          return memoizedSnapshot = nextSnapshot, currentSelection;
        memoizedSnapshot = nextSnapshot;
        return memoizedSelection = nextSelection;
      }
      var hasMemo = false, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
      return [
        function() {
          return memoizedSelector(getSnapshot());
        },
        null === maybeGetServerSnapshot ? void 0 : function() {
          return memoizedSelector(maybeGetServerSnapshot());
        }
      ];
    },
    [getSnapshot, getServerSnapshot, selector, isEqual]
  );
  var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
  useEffect(
    function() {
      inst.hasValue = true;
      inst.value = value;
    },
    [value]
  );
  useDebugValue$1(value);
  return value;
};
{
  withSelector.exports = withSelector_production;
}
var withSelectorExports = withSelector.exports;
const useSyncExternalStoreExports = /* @__PURE__ */ getDefaultExportFromCjs(withSelectorExports);
const __vite_import_meta_env__ = {};
const { useDebugValue } = React$2;
const { useSyncExternalStoreWithSelector } = useSyncExternalStoreExports;
let didWarnAboutEqualityFn = false;
const identity = (arg) => arg;
function useStore(api, selector = identity, equalityFn) {
  if ((__vite_import_meta_env__ ? "production" : void 0) !== "production" && equalityFn && !didWarnAboutEqualityFn) {
    console.warn(
      "[DEPRECATED] Use `createWithEqualityFn` instead of `create` or use `useStoreWithEqualityFn` instead of `useStore`. They can be imported from 'zustand/traditional'. https://github.com/pmndrs/zustand/discussions/1937"
    );
    didWarnAboutEqualityFn = true;
  }
  const slice = useSyncExternalStoreWithSelector(
    api.subscribe,
    api.getState,
    api.getServerState || api.getInitialState,
    selector,
    equalityFn
  );
  useDebugValue(slice);
  return slice;
}
const createImpl = (createState) => {
  if ((__vite_import_meta_env__ ? "production" : void 0) !== "production" && typeof createState !== "function") {
    console.warn(
      "[DEPRECATED] Passing a vanilla store will be unsupported in a future version. Instead use `import { useStore } from 'zustand'`."
    );
  }
  const api = typeof createState === "function" ? createStore(createState) : createState;
  const useBoundStore = (selector, equalityFn) => useStore(api, selector, equalityFn);
  Object.assign(useBoundStore, api);
  return useBoundStore;
};
const create = (createState) => createState ? createImpl(createState) : createImpl;
const defaultVideoState = {
  tags: [],
  isIndexed: false,
  frameCount: null,
  suggestions: null
};
const useSmartTaggingStore = create((set, get) => ({
  // Initial state
  taxonomy: null,
  llmAvailable: false,
  llmModels: [],
  videoStates: /* @__PURE__ */ new Map(),
  isLoadingTaxonomy: false,
  isCheckingLLM: false,
  indexingVideos: /* @__PURE__ */ new Set(),
  suggestingVideos: /* @__PURE__ */ new Set(),
  // Global actions
  loadTaxonomy: async () => {
    set({ isLoadingTaxonomy: true });
    try {
      const taxonomy = await window.api.smartTagging.getTaxonomy();
      set({ taxonomy, isLoadingTaxonomy: false });
    } catch (error) {
      console.error("Failed to load taxonomy:", error);
      set({ isLoadingTaxonomy: false });
    }
  },
  reloadTaxonomy: async () => {
    set({ isLoadingTaxonomy: true });
    try {
      const result = await window.api.smartTagging.reloadTaxonomy();
      if (result.success) {
        const taxonomy = await window.api.smartTagging.getTaxonomy();
        set({ taxonomy, isLoadingTaxonomy: false });
      } else {
        set({ isLoadingTaxonomy: false });
      }
      return result;
    } catch (error) {
      console.error("Failed to reload taxonomy:", error);
      set({ isLoadingTaxonomy: false });
      return { success: false, tagCount: 0 };
    }
  },
  checkLLMAvailability: async () => {
    set({ isCheckingLLM: true });
    try {
      const [availabilityResult, modelsResult] = await Promise.all([
        window.api.smartTagging.llmAvailable(),
        window.api.smartTagging.llmModels()
      ]);
      set({
        llmAvailable: availabilityResult.available,
        llmModels: modelsResult.models,
        isCheckingLLM: false
      });
    } catch (error) {
      console.error("Failed to check LLM availability:", error);
      set({ llmAvailable: false, llmModels: [], isCheckingLLM: false });
    }
  },
  // Video-specific actions
  loadVideoTags: async (videoId) => {
    try {
      const result = await window.api.smartTagging.getVideoTags(videoId);
      const videoStates = new Map(get().videoStates);
      const existing = videoStates.get(videoId) || { ...defaultVideoState };
      videoStates.set(videoId, { ...existing, tags: result.tags });
      set({ videoStates });
    } catch (error) {
      console.error("Failed to load video tags:", error);
    }
  },
  checkVideoIndexed: async (videoId) => {
    try {
      const result = await window.api.smartTagging.isIndexed(videoId);
      const videoStates = new Map(get().videoStates);
      const existing = videoStates.get(videoId) || { ...defaultVideoState };
      videoStates.set(videoId, {
        ...existing,
        isIndexed: result.indexed,
        frameCount: result.frameCount
      });
      set({ videoStates });
      return result;
    } catch (error) {
      console.error("Failed to check video indexed:", error);
      return { indexed: false, frameCount: null };
    }
  },
  indexVideo: async (videoId, videoPath) => {
    const indexingVideos = new Set(get().indexingVideos);
    indexingVideos.add(videoId);
    set({ indexingVideos });
    try {
      const result = await window.api.smartTagging.indexVideo(videoId, videoPath);
      indexingVideos.delete(videoId);
      const videoStates = new Map(get().videoStates);
      const existing = videoStates.get(videoId) || { ...defaultVideoState };
      videoStates.set(videoId, {
        ...existing,
        isIndexed: result.success,
        frameCount: result.frameCount
      });
      set({ indexingVideos, videoStates });
      return result;
    } catch (error) {
      console.error("Failed to index video:", error);
      indexingVideos.delete(videoId);
      set({ indexingVideos });
      return { success: false, frameCount: 0 };
    }
  },
  suggestTags: async (videoId, options = {}) => {
    const suggestingVideos = new Set(get().suggestingVideos);
    suggestingVideos.add(videoId);
    set({ suggestingVideos });
    try {
      const result = await window.api.smartTagging.suggestTags({
        videoId,
        ...options
      });
      suggestingVideos.delete(videoId);
      const videoStates = new Map(get().videoStates);
      const existing = videoStates.get(videoId) || { ...defaultVideoState };
      videoStates.set(videoId, { ...existing, suggestions: result });
      set({ suggestingVideos, videoStates });
      return result;
    } catch (error) {
      console.error("Failed to suggest tags:", error);
      suggestingVideos.delete(videoId);
      set({ suggestingVideos });
      throw error;
    }
  },
  regenerateSuggestions: async (videoId) => {
    const suggestingVideos = new Set(get().suggestingVideos);
    suggestingVideos.add(videoId);
    set({ suggestingVideos });
    try {
      const result = await window.api.smartTagging.regenerate(videoId);
      suggestingVideos.delete(videoId);
      const videoStates = new Map(get().videoStates);
      const existing = videoStates.get(videoId) || { ...defaultVideoState };
      videoStates.set(videoId, { ...existing, suggestions: result });
      set({ suggestingVideos, videoStates });
      await get().loadVideoTags(videoId);
      return result;
    } catch (error) {
      console.error("Failed to regenerate suggestions:", error);
      suggestingVideos.delete(videoId);
      set({ suggestingVideos });
      throw error;
    }
  },
  // Tag operations
  acceptTag: async (videoId, tagName) => {
    await window.api.smartTagging.applyDecision(videoId, tagName, "accept");
    await get().loadVideoTags(videoId);
  },
  rejectTag: async (videoId, tagName) => {
    await window.api.smartTagging.applyDecision(videoId, tagName, "reject");
    const videoStates = new Map(get().videoStates);
    const existing = videoStates.get(videoId);
    if (existing?.suggestions) {
      const suggestions = {
        ...existing.suggestions,
        accepted: existing.suggestions.accepted.filter((t2) => t2.tagName !== tagName),
        suggestedLowConfidence: existing.suggestions.suggestedLowConfidence.filter(
          (t2) => t2.tagName !== tagName
        ),
        needsReview: existing.suggestions.needsReview.filter((t2) => t2.tagName !== tagName)
      };
      videoStates.set(videoId, { ...existing, suggestions });
      set({ videoStates });
    }
  },
  addTag: async (videoId, tagName, lock) => {
    const result = await window.api.smartTagging.addTag(videoId, tagName, lock);
    if (result.success) {
      await get().loadVideoTags(videoId);
    }
    return result;
  },
  removeTag: async (videoId, tagName, force) => {
    const result = await window.api.smartTagging.removeTag(videoId, tagName, force);
    if (result.success) {
      await get().loadVideoTags(videoId);
    }
    return result;
  },
  lockTag: async (videoId, tagName) => {
    const result = await window.api.smartTagging.lockTag(videoId, tagName);
    if (result.success) {
      await get().loadVideoTags(videoId);
    }
    return result;
  },
  unlockTag: async (videoId, tagName) => {
    const result = await window.api.smartTagging.unlockTag(videoId, tagName);
    if (result.success) {
      await get().loadVideoTags(videoId);
    }
    return result;
  },
  // Cleanup
  cleanupVideo: async (videoId) => {
    await window.api.smartTagging.cleanup(videoId);
    get().clearVideoState(videoId);
  },
  clearVideoState: (videoId) => {
    const videoStates = new Map(get().videoStates);
    videoStates.delete(videoId);
    set({ videoStates });
  },
  // Helpers
  getVideoState: (videoId) => {
    return get().videoStates.get(videoId);
  },
  isVideoIndexing: (videoId) => {
    return get().indexingVideos.has(videoId);
  },
  isVideoSuggesting: (videoId) => {
    return get().suggestingVideos.has(videoId);
  }
}));
function useSmartTaggingInit() {
  const { loadTaxonomy, checkLLMAvailability, taxonomy, isLoadingTaxonomy } = useSmartTaggingStore();
  reactExports.useEffect(() => {
    loadTaxonomy();
    checkLLMAvailability();
  }, [loadTaxonomy, checkLLMAvailability]);
  return { taxonomy, isLoading: isLoadingTaxonomy };
}
function useVideoSmartTagging(videoId, videoPath) {
  const {
    taxonomy,
    llmAvailable,
    getVideoState,
    isVideoIndexing,
    isVideoSuggesting,
    loadVideoTags,
    checkVideoIndexed,
    indexVideo,
    suggestTags,
    regenerateSuggestions,
    acceptTag,
    rejectTag,
    addTag,
    removeTag,
    lockTag,
    unlockTag,
    cleanupVideo
  } = useSmartTaggingStore();
  const videoState = getVideoState(videoId);
  const isIndexing = isVideoIndexing(videoId);
  const isSuggesting = isVideoSuggesting(videoId);
  reactExports.useEffect(() => {
    loadVideoTags(videoId);
    checkVideoIndexed(videoId);
  }, [videoId, loadVideoTags, checkVideoIndexed]);
  const handleIndex = reactExports.useCallback(async () => {
    if (!videoPath) {
      console.error("No video path provided for indexing");
      return { success: false, frameCount: 0 };
    }
    return indexVideo(videoId, videoPath);
  }, [videoId, videoPath, indexVideo]);
  const handleSuggest = reactExports.useCallback(
    async (useLLM = true, videoTitle, videoDescription) => {
      return suggestTags(videoId, {
        useLLMRefinement: useLLM,
        videoTitle,
        videoDescription
      });
    },
    [videoId, suggestTags]
  );
  const handleRegenerate = reactExports.useCallback(async () => {
    return regenerateSuggestions(videoId);
  }, [videoId, regenerateSuggestions]);
  const handleAcceptTag = reactExports.useCallback(
    async (tagName) => {
      return acceptTag(videoId, tagName);
    },
    [videoId, acceptTag]
  );
  const handleRejectTag = reactExports.useCallback(
    async (tagName) => {
      return rejectTag(videoId, tagName);
    },
    [videoId, rejectTag]
  );
  const handleAddTag = reactExports.useCallback(
    async (tagName, lock) => {
      return addTag(videoId, tagName, lock);
    },
    [videoId, addTag]
  );
  const handleRemoveTag = reactExports.useCallback(
    async (tagName, force) => {
      return removeTag(videoId, tagName, force);
    },
    [videoId, removeTag]
  );
  const handleLockTag = reactExports.useCallback(
    async (tagName) => {
      return lockTag(videoId, tagName);
    },
    [videoId, lockTag]
  );
  const handleUnlockTag = reactExports.useCallback(
    async (tagName) => {
      return unlockTag(videoId, tagName);
    },
    [videoId, unlockTag]
  );
  const handleCleanup = reactExports.useCallback(async () => {
    return cleanupVideo(videoId);
  }, [videoId, cleanupVideo]);
  return {
    // State
    tags: videoState?.tags || [],
    isIndexed: videoState?.isIndexed || false,
    frameCount: videoState?.frameCount || null,
    suggestions: videoState?.suggestions || null,
    taxonomy,
    llmAvailable,
    // Loading states
    isIndexing,
    isSuggesting,
    // Actions
    index: handleIndex,
    suggest: handleSuggest,
    regenerate: handleRegenerate,
    acceptTag: handleAcceptTag,
    rejectTag: handleRejectTag,
    addTag: handleAddTag,
    removeTag: handleRemoveTag,
    lockTag: handleLockTag,
    unlockTag: handleUnlockTag,
    cleanup: handleCleanup
  };
}
const ARCHIVAL_CRF_DEFAULTS = {
  hdr: {
    "4k": 29,
    // Ultra-safe: 28, aggressive: 30 max
    "1440p": 28,
    // aggressive: 29 max
    "1080p": 28,
    // default 28, aggressive: 29 max
    "720p": 27,
    // aggressive: 28 max
    "480p": 27,
    "360p": 27
  },
  sdr: {
    "4k": 30,
    // aggressive: 31 max
    "1440p": 31,
    // aggressive: 32 max
    "1080p": 29,
    // aggressive: 31-32 max
    "720p": 32,
    // default 32, aggressive: 34 max
    "480p": 34,
    // default 34
    "360p": 36
    // default 36, aggressive: 37 max
  }
};
const BITRATE_THRESHOLDS = {
  "4k": { low: 8e6, medium: 15e6 },
  // 8 Mbps / 15 Mbps
  "1440p": { low: 4e6, medium: 8e6 },
  // 4 Mbps / 8 Mbps
  "1080p": { low: 25e5, medium: 5e6 },
  // 2.5 Mbps / 5 Mbps
  "720p": { low: 15e5, medium: 3e6 },
  // 1.5 Mbps / 3 Mbps
  "480p": { low: 8e5, medium: 15e5 },
  // 800 kbps / 1.5 Mbps
  "360p": { low: 4e5, medium: 8e5 }
  // 400 kbps / 800 kbps
};
function getBitrateAdjustedCrf(sourceInfo, baseCrf) {
  if (!sourceInfo.bitrate || sourceInfo.bitrate <= 0) {
    return { adjustedCrf: baseCrf, adjustment: 0 };
  }
  const resolution = getResolutionCategory(sourceInfo.width, sourceInfo.height);
  if (resolution === "source") {
    return { adjustedCrf: baseCrf, adjustment: 0 };
  }
  const thresholds = BITRATE_THRESHOLDS[resolution];
  if (!thresholds) {
    return { adjustedCrf: baseCrf, adjustment: 0 };
  }
  const bitrateMbps = (sourceInfo.bitrate / 1e6).toFixed(1);
  if (sourceInfo.bitrate < thresholds.low) {
    const adjustment = 3;
    return {
      adjustedCrf: Math.min(baseCrf + adjustment, 45),
      // Cap at CRF 45
      adjustment,
      reason: `Low bitrate source (${bitrateMbps} Mbps) - raising CRF to avoid over-compression`
    };
  }
  if (sourceInfo.bitrate < thresholds.medium) {
    const adjustment = 1;
    return {
      adjustedCrf: Math.min(baseCrf + adjustment, 45),
      adjustment,
      reason: `Moderate bitrate source (${bitrateMbps} Mbps) - slight CRF adjustment`
    };
  }
  return { adjustedCrf: baseCrf, adjustment: 0 };
}
const DEFAULT_ARCHIVAL_CONFIG = {
  // Default to AV1 for best compression
  av1: {
    encoder: "libsvtav1",
    // Faster than libaom with excellent quality
    preset: 6,
    // SVT-AV1: 0-13, lower=slower/better. 6 is balanced
    keyframeInterval: 240,
    // ~8-10 seconds at 24-30fps
    sceneChangeDetection: true,
    // CRITICAL: prevents GOP crossing scene cuts
    filmGrainSynthesis: 10,
    // Helps with noisy footage, disable for screen recordings
    tune: 0,
    // VQ (visual quality) - best for archival viewing
    adaptiveQuantization: true,
    // Better detail in complex areas
    crf: 30,
    // Will be auto-adjusted based on resolution/HDR
    twoPass: false
    // Single-pass by default for faster encoding
  },
  h265: {
    encoder: "libx265",
    preset: "medium",
    // Balanced speed/quality for web delivery
    crf: 23,
    // Visually transparent for most content
    keyframeInterval: 250,
    // ~10 seconds, good for streaming
    bframes: 4,
    // Standard B-frame count for good compression
    twoPass: false
    // Single-pass by default for faster encoding
  }
};
const ARCHIVAL_PRESETS = {
  // Recommended: Good balance of quality and speed
  archive: {
    av1: {
      ...DEFAULT_ARCHIVAL_CONFIG.av1,
      preset: 6,
      filmGrainSynthesis: 10,
      twoPass: false
    },
    h265: {
      ...DEFAULT_ARCHIVAL_CONFIG.h265,
      preset: "medium",
      crf: 23,
      twoPass: false
    }
  },
  // Maximum compression: Slower but smaller files (~3-5% smaller)
  "max-compression": {
    av1: {
      ...DEFAULT_ARCHIVAL_CONFIG.av1,
      preset: 4,
      // Slower, better compression
      filmGrainSynthesis: 12,
      // More aggressive grain synthesis
      twoPass: false
    },
    h265: {
      ...DEFAULT_ARCHIVAL_CONFIG.h265,
      preset: "slow",
      // Slower for better compression
      crf: 24,
      // Slightly higher CRF for smaller files
      twoPass: false
    }
  },
  // Fast: Faster encoding, slightly larger files
  fast: {
    av1: {
      ...DEFAULT_ARCHIVAL_CONFIG.av1,
      preset: 8,
      // Faster
      filmGrainSynthesis: 8,
      twoPass: false
    },
    h265: {
      ...DEFAULT_ARCHIVAL_CONFIG.h265,
      preset: "fast",
      // Faster encoding
      crf: 22,
      // Lower CRF to compensate for speed
      twoPass: false
    }
  }
};
function getResolutionCategory(width, height) {
  const pixels = Math.max(width, height);
  if (pixels >= 3840) return "4k";
  if (pixels >= 2560) return "1440p";
  if (pixels >= 1920) return "1080p";
  if (pixels >= 1280) return "720p";
  if (pixels >= 854) return "480p";
  return "360p";
}
function hasDolbyVision(hdrFormat) {
  if (!hdrFormat) return false;
  const lower = hdrFormat.toLowerCase();
  return lower.includes("dolby") || lower.includes("dv");
}
function getErrorMessage(errorType, details) {
  const messages = {
    disk_full: "Not enough disk space to complete encoding. Free up space and try again.",
    permission_denied: "Cannot write to output location. Check folder permissions.",
    file_not_found: "Input file not found. It may have been moved or deleted.",
    codec_unsupported: "Video format not supported. The input file may use an unsupported codec.",
    corrupt_input: "Input file appears to be corrupted or incomplete.",
    encoder_error: "Encoder error occurred. Try a different encoder preset.",
    cancelled: "Encoding was cancelled.",
    output_larger: "Output file is larger than original. Source may already be well-optimized.",
    unknown: "An unexpected error occurred."
  };
  const base = messages[errorType];
  return details ? `${base} (${details})` : base;
}
function formatEta(seconds) {
  if (!isFinite(seconds) || seconds < 0) return "--";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins2 = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${mins2}m ${secs}s` : `${mins2}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round(seconds % 3600 / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
function formatSpeed(speed) {
  if (!isFinite(speed) || speed <= 0) return "--";
  return `${speed.toFixed(1)}x`;
}
const ENCODING_SPEED_MULTIPLIERS = {
  // AV1 SVT speed multipliers by preset (0-12)
  // Based on typical 1080p encoding speeds
  av1_svt: {
    0: 0.05,
    // Very slow
    1: 0.08,
    2: 0.12,
    3: 0.18,
    4: 0.25,
    5: 0.35,
    6: 0.5,
    // Default balanced
    7: 0.7,
    8: 1,
    9: 1.4,
    10: 2,
    11: 2.8,
    12: 4
    // Very fast
  },
  // AV1 libaom speed multipliers by preset (0-8)
  av1_libaom: {
    0: 0.02,
    // Extremely slow
    1: 0.04,
    2: 0.07,
    3: 0.12,
    4: 0.2,
    5: 0.3,
    6: 0.45,
    7: 0.65,
    8: 0.9
  },
  // H.265 libx265 speed multipliers by preset
  h265: {
    "ultrafast": 5,
    "superfast": 3.5,
    "veryfast": 2.5,
    "faster": 1.8,
    "fast": 1.3,
    "medium": 0.9,
    "slow": 0.5,
    "slower": 0.3,
    "veryslow": 0.15
  }
};
const RESOLUTION_SPEED_FACTORS = {
  "360p": 4,
  // Much faster
  "480p": 2.5,
  "720p": 1.5,
  "1080p": 1,
  // Reference baseline
  "1440p": 0.6,
  "4k": 0.35,
  // Much slower
  "source": 1
  // Assume 1080p for source
};
function estimateEncodingTime$1(durationSeconds, codec, preset, encoder, resolution = "1080p", twoPass = false) {
  let speedMultiplier;
  if (codec === "h265") {
    const presetStr = preset;
    speedMultiplier = ENCODING_SPEED_MULTIPLIERS.h265[presetStr] ?? 0.9;
  } else {
    const presetNum = preset;
    if (encoder === "libsvtav1") {
      speedMultiplier = ENCODING_SPEED_MULTIPLIERS.av1_svt[presetNum] ?? 0.5;
    } else {
      speedMultiplier = ENCODING_SPEED_MULTIPLIERS.av1_libaom[presetNum] ?? 0.2;
    }
  }
  const resolutionFactor = RESOLUTION_SPEED_FACTORS[resolution] ?? 1;
  const adjustedSpeed = speedMultiplier * resolutionFactor;
  let encodingTime = durationSeconds / adjustedSpeed;
  if (twoPass) {
    encodingTime *= 2;
  }
  return {
    estimatedSeconds: Math.round(encodingTime),
    minSeconds: Math.round(encodingTime * 0.7),
    maxSeconds: Math.round(encodingTime * 1.5)
  };
}
function formatEstimatedTime(seconds) {
  if (!isFinite(seconds) || seconds <= 0) return "--";
  if (seconds < 60) return `~${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins2 = Math.round(seconds / 60);
    return `~${mins2}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round(seconds % 3600 / 60);
  return mins > 0 ? `~${hours}h ${mins}m` : `~${hours}h`;
}
const RESOLUTION_OPTIONS = [
  { value: "source", label: "Source (no change)" },
  { value: "4k", label: "4K (2160p)" },
  { value: "1440p", label: "1440p" },
  { value: "1080p", label: "1080p" },
  { value: "720p", label: "720p" },
  { value: "480p", label: "480p" },
  { value: "360p", label: "360p" }
];
const CONTAINER_OPTIONS = [
  { value: "mkv", label: "MKV (recommended)" },
  { value: "mp4", label: "MP4" },
  { value: "webm", label: "WebM" }
];
const CODEC_OPTIONS = [
  {
    value: "av1",
    label: "AV1",
    description: "Best compression for archival. Smaller files, longer encoding."
  },
  {
    value: "h265",
    label: "H.265 (HEVC)",
    description: "Better compatibility for web delivery. Faster encoding, wider device support."
  }
];
const H265_PRESET_OPTIONS = [
  { value: "ultrafast", label: "Ultrafast" },
  { value: "superfast", label: "Superfast" },
  { value: "veryfast", label: "Very Fast" },
  { value: "faster", label: "Faster" },
  { value: "fast", label: "Fast" },
  { value: "medium", label: "Medium (recommended)" },
  { value: "slow", label: "Slow" },
  { value: "slower", label: "Slower" },
  { value: "veryslow", label: "Very Slow" }
];
const PRESET_OPTIONS = [
  {
    value: "archive",
    label: "Archive (Recommended)",
    description: "Balanced quality and speed. Preset 6, good for most content."
  },
  {
    value: "max-compression",
    label: "Max Compression",
    description: "Slower encoding, ~3-5% smaller files. Preset 4."
  },
  {
    value: "fast",
    label: "Fast",
    description: "Faster encoding, slightly larger files. Preset 8."
  }
];
function Archive() {
  const [inputPaths, setInputPaths] = reactExports.useState([]);
  const [outputDir, setOutputDir] = reactExports.useState(null);
  const [config, setConfig] = reactExports.useState({});
  const [defaultConfig, setDefaultConfig] = reactExports.useState(null);
  const [encoderInfo, setEncoderInfo] = reactExports.useState(null);
  const [isUpgrading, setIsUpgrading] = reactExports.useState(false);
  const [upgradeProgress, setUpgradeProgress] = reactExports.useState(null);
  const [currentJob, setCurrentJob] = reactExports.useState(null);
  const [error, setError] = reactExports.useState(null);
  const [isStarting, setIsStarting] = reactExports.useState(false);
  const [previewCommand, setPreviewCommand] = reactExports.useState(null);
  const [sourceInfo, setSourceInfo] = reactExports.useState(null);
  const [isAnalyzing, setIsAnalyzing] = reactExports.useState(false);
  const [selectedPreset, setSelectedPreset] = reactExports.useState("archive");
  const [isDolbyVision, setIsDolbyVision] = reactExports.useState(false);
  const [showAdvanced, setShowAdvanced] = reactExports.useState(false);
  const [batchEta, setBatchEta] = reactExports.useState(void 0);
  const [batchSpeed, setBatchSpeed] = reactExports.useState(void 0);
  const [batchProgress, setBatchProgress] = reactExports.useState(0);
  const [folderPath, setFolderPath] = reactExports.useState(null);
  const [fileInfos, setFileInfos] = reactExports.useState([]);
  const [batchInfo, setBatchInfo] = reactExports.useState(null);
  const [isLoadingBatchInfo, setIsLoadingBatchInfo] = reactExports.useState(false);
  const [whisperProvider, setWhisperProvider] = reactExports.useState("bundled");
  const [lmstudioEndpoint, setLmstudioEndpoint] = reactExports.useState("http://localhost:1234/v1/audio/transcriptions");
  const [whisperGpuEnabled, setWhisperGpuEnabled] = reactExports.useState(false);
  const [whisperGpuAvailable, setWhisperGpuAvailable] = reactExports.useState(false);
  const [whisperGpuType, setWhisperGpuType] = reactExports.useState("none");
  const [whisperGpuReason, setWhisperGpuReason] = reactExports.useState();
  reactExports.useEffect(() => {
    let active = true;
    Promise.all([
      window.api.archivalGetDefaultConfig(),
      window.api.archivalDetectEncoders(),
      window.api.archivalGetStatus(),
      window.api.getWhisperProvider(),
      window.api.getWhisperGpuSettings()
    ]).then(([configResult, encoderResult, statusResult, whisperResult, gpuResult]) => {
      if (!active) return;
      if (whisperResult.ok) {
        if (whisperResult.provider) {
          setWhisperProvider(whisperResult.provider);
        }
        if (whisperResult.endpoint) {
          setLmstudioEndpoint(whisperResult.endpoint);
        }
      }
      if (gpuResult.ok && gpuResult.settings) {
        setWhisperGpuEnabled(gpuResult.settings.enabled);
        setWhisperGpuAvailable(gpuResult.settings.available);
        setWhisperGpuType(gpuResult.settings.gpuType);
        setWhisperGpuReason(gpuResult.settings.reason);
      }
      if (configResult.ok) {
        setDefaultConfig(configResult.config);
        let initialConfig = { ...configResult.config };
        if (encoderResult.ok && encoderResult.encoderInfo) {
          const info = encoderResult.encoderInfo;
          const defaultCodec = initialConfig.codec ?? "av1";
          if (defaultCodec === "av1" && !info.hasAv1Support && info.hasH265Support) {
            initialConfig = {
              ...initialConfig,
              codec: "h265",
              container: "mp4",
              audioCodec: "aac"
            };
          } else if (defaultCodec === "h265" && !info.hasH265Support && info.hasAv1Support) {
            initialConfig = {
              ...initialConfig,
              codec: "av1",
              container: "mkv"
            };
          }
        }
        setConfig(initialConfig);
      }
      if (encoderResult.ok && encoderResult.encoderInfo) {
        setEncoderInfo(encoderResult.encoderInfo);
      }
      if (statusResult.ok && statusResult.job) {
        setCurrentJob(statusResult.job);
      }
    }).catch(() => {
      if (active) {
        setError("Failed to load archival configuration");
      }
    });
    return () => {
      active = false;
    };
  }, []);
  reactExports.useEffect(() => {
    const unsubscribe = window.api.onArchivalEvent((event) => {
      if (event.kind === "item_progress") {
        if (event.batchEtaSeconds !== void 0) {
          setBatchEta(event.batchEtaSeconds);
        }
        if (event.encodingSpeed !== void 0) {
          setBatchSpeed(event.encodingSpeed);
        }
        if (event.batchProgress !== void 0) {
          setBatchProgress(event.batchProgress);
        }
      }
      if (event.kind === "batch_complete") {
        setBatchEta(void 0);
        setBatchSpeed(void 0);
        setBatchProgress(100);
      }
      setCurrentJob((prev) => {
        if (!prev || prev.id !== event.batchId) return prev;
        const updatedItems = prev.items.map((item) => {
          if (item.id !== event.itemId) return item;
          return {
            ...item,
            status: event.status ?? item.status,
            progress: event.progress ?? item.progress,
            error: event.error ?? item.error,
            errorType: event.errorType ?? item.errorType,
            sourceInfo: event.sourceInfo ?? item.sourceInfo,
            effectiveCrf: event.effectiveCrf ?? item.effectiveCrf,
            outputSize: event.outputSize ?? item.outputSize,
            compressionRatio: event.compressionRatio ?? item.compressionRatio,
            encodingSpeed: event.encodingSpeed ?? item.encodingSpeed,
            etaSeconds: event.itemEtaSeconds ?? item.etaSeconds,
            elapsedSeconds: event.elapsedSeconds ?? item.elapsedSeconds
          };
        });
        let completedItems = prev.completedItems;
        let failedItems = prev.failedItems;
        let skippedItems = prev.skippedItems;
        let status = prev.status;
        if (event.kind === "item_complete") {
          completedItems = updatedItems.filter((i) => i.status === "completed").length;
        }
        if (event.kind === "item_error") {
          failedItems = updatedItems.filter((i) => i.status === "failed").length;
        }
        skippedItems = updatedItems.filter((i) => i.status === "skipped").length;
        if (event.kind === "batch_complete") {
          const hasCancelled = updatedItems.some((i) => i.status === "cancelled");
          status = hasCancelled ? "cancelled" : "completed";
        }
        return {
          ...prev,
          items: updatedItems,
          completedItems,
          failedItems,
          skippedItems,
          status,
          batchEtaSeconds: event.batchEtaSeconds ?? prev.batchEtaSeconds,
          averageSpeed: event.encodingSpeed ?? prev.averageSpeed
        };
      });
    });
    const unsubUpgrade = window.api.onArchivalUpgradeProgress((progress) => {
      if (progress.stage === "complete") {
        setIsUpgrading(false);
        setUpgradeProgress(null);
        window.api.archivalDetectEncoders().then((result) => {
          if (result.ok && result.encoderInfo) {
            setEncoderInfo(result.encoderInfo);
          }
        });
      } else if (progress.stage === "error") {
        setIsUpgrading(false);
        setUpgradeProgress(`Error: ${progress.error}`);
      } else {
        setUpgradeProgress(`${progress.stage}${progress.progress ? ` (${progress.progress}%)` : ""}`);
      }
    });
    return () => {
      unsubscribe();
      unsubUpgrade();
    };
  }, []);
  reactExports.useEffect(() => {
    if (inputPaths.length === 0 || !outputDir) {
      setPreviewCommand(null);
      return;
    }
    const timeoutId = setTimeout(() => {
      window.api.archivalPreviewCommand({
        inputPath: inputPaths[0],
        outputDir,
        config
      }).then((result) => {
        if (result.ok && result.command) {
          setPreviewCommand(result.command);
        }
      }).catch(() => {
        setPreviewCommand(null);
      });
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [inputPaths, outputDir, config]);
  reactExports.useEffect(() => {
    if (inputPaths.length === 0 || !outputDir) {
      setBatchInfo(null);
      return;
    }
    let active = true;
    setIsLoadingBatchInfo(true);
    const timeoutId = setTimeout(() => {
      window.api.archivalGetBatchInfo({
        inputPaths,
        outputDir
      }).then((result) => {
        if (!active) return;
        if (result.ok) {
          setBatchInfo({
            totalDurationSeconds: result.totalDurationSeconds,
            totalInputBytes: result.totalInputBytes,
            estimatedOutputBytes: result.estimatedOutputBytes,
            availableBytes: result.availableBytes,
            hasEnoughSpace: result.hasEnoughSpace,
            existingCount: result.existingCount
          });
        }
        setIsLoadingBatchInfo(false);
      }).catch(() => {
        if (active) {
          setBatchInfo(null);
          setIsLoadingBatchInfo(false);
        }
      });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [inputPaths, outputDir]);
  const handleSelectFiles = async () => {
    try {
      const result = await window.api.archivalSelectFiles();
      if (result.ok && result.paths) {
        setInputPaths(result.paths);
        setError(null);
        setIsDolbyVision(false);
        setFolderPath(null);
        setFileInfos([]);
        setConfig((prev) => ({ ...prev, preserveStructure: false }));
        if (result.paths.length > 0) {
          setIsAnalyzing(true);
          const analyzeResult = await window.api.archivalAnalyzeVideo(result.paths[0]);
          if (analyzeResult.ok && analyzeResult.sourceInfo) {
            setSourceInfo(analyzeResult.sourceInfo);
            if (hasDolbyVision(analyzeResult.sourceInfo.hdrFormat)) {
              setIsDolbyVision(true);
            }
          }
          setIsAnalyzing(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select files");
    }
  };
  const handleSelectFolder = async () => {
    try {
      const result = await window.api.archivalSelectFolder();
      if (result.ok && result.paths && result.fileInfo) {
        setInputPaths(result.paths);
        setFolderPath(result.folderPath ?? null);
        setFileInfos(result.fileInfo);
        setError(null);
        setIsDolbyVision(false);
        setConfig((prev) => ({ ...prev, preserveStructure: true }));
        if (result.paths.length > 0) {
          setIsAnalyzing(true);
          const analyzeResult = await window.api.archivalAnalyzeVideo(result.paths[0]);
          if (analyzeResult.ok && analyzeResult.sourceInfo) {
            setSourceInfo(analyzeResult.sourceInfo);
            if (hasDolbyVision(analyzeResult.sourceInfo.hdrFormat)) {
              setIsDolbyVision(true);
            }
          }
          setIsAnalyzing(false);
        }
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select folder");
    }
  };
  const handlePresetChange = (preset) => {
    setSelectedPreset(preset);
    const presetConfig = ARCHIVAL_PRESETS[preset];
    setConfig((prev) => ({
      ...prev,
      ...presetConfig
    }));
  };
  const handleSelectOutputDir = async () => {
    try {
      const result = await window.api.archivalSelectOutputDir();
      if (result.ok && result.path) {
        setOutputDir(result.path);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select output directory");
    }
  };
  const handleStartBatch = async () => {
    if (inputPaths.length === 0) {
      setError("Select files to archive");
      return;
    }
    if (!outputDir) {
      setError("Select an output directory");
      return;
    }
    setIsStarting(true);
    setError(null);
    try {
      const result = await window.api.archivalStartBatch({
        inputPaths,
        outputDir,
        config,
        folderRoot: folderPath ?? void 0,
        relativePaths: fileInfos.length > 0 ? fileInfos.map((f2) => f2.relativePath) : void 0
      });
      if (!result.ok) {
        setError(result.error ?? "Failed to start batch");
        return;
      }
      if (result.job) {
        setCurrentJob(result.job);
        setInputPaths([]);
        setSourceInfo(null);
        setFolderPath(null);
        setFileInfos([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start batch");
    } finally {
      setIsStarting(false);
    }
  };
  const handleCancel = async () => {
    try {
      await window.api.archivalCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    }
  };
  const handleUpgradeFFmpeg = async () => {
    setIsUpgrading(true);
    setUpgradeProgress("Starting...");
    try {
      await window.api.archivalUpgradeFFmpeg();
    } catch (err) {
      setIsUpgrading(false);
      setUpgradeProgress(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };
  const handleConfigChange = reactExports.useCallback((key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);
  const handleFillModeChange = reactExports.useCallback((enabled) => {
    setConfig((prev) => ({
      ...prev,
      fillMode: enabled,
      ...enabled ? { overwriteExisting: false } : {}
    }));
  }, []);
  const handleAv1Change = reactExports.useCallback((key, value) => {
    setConfig((prev) => ({
      ...prev,
      av1: { ...prev.av1, [key]: value }
    }));
  }, []);
  const handleH265Change = reactExports.useCallback((key, value) => {
    setConfig((prev) => ({
      ...prev,
      h265: { ...prev.h265, [key]: value }
    }));
  }, []);
  const handleCodecChange = reactExports.useCallback((codec) => {
    setConfig((prev) => {
      const newConfig = { ...prev, codec };
      if (codec === "h265") {
        if (prev.container === "webm" || !prev.container) {
          newConfig.container = "mp4";
        }
        newConfig.audioCodec = "aac";
      } else {
        if (!prev.container) {
          newConfig.container = "mkv";
        }
      }
      return newConfig;
    });
  }, []);
  const formatFileSize2 = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };
  const formatDuration2 = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor(seconds % 3600 / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };
  const statusTone = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "encoding":
      case "analyzing":
        return "bg-blue-100 text-blue-700";
      case "failed":
        return "bg-rose-100 text-rose-700";
      case "cancelled":
      case "skipped":
        return "bg-slate-100 text-slate-500";
      case "queued":
      default:
        return "bg-amber-100 text-amber-700";
    }
  };
  const overallProgress = currentJob && currentJob.totalItems > 0 ? Math.round((currentJob.completedItems + currentJob.failedItems + currentJob.skippedItems) / currentJob.totalItems * 100) : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    encoderInfo && /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: `rounded-2xl border p-4 ${encoderInfo.hasAv1Support || encoderInfo.hasH265Support ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${encoderInfo.hasAv1Support ? "bg-emerald-200 text-emerald-800" : "bg-amber-200 text-amber-800"}`, children: encoderInfo.hasAv1Support ? "AV1 Ready" : "AV1 Not Available" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${encoderInfo.hasH265Support ? "bg-emerald-200 text-emerald-800" : "bg-amber-200 text-amber-800"}`, children: encoderInfo.hasH265Support ? "H.265 Ready" : "H.265 Not Available" }),
          encoderInfo.recommended && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-slate-500", children: [
            "AV1: ",
            encoderInfo.recommended
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-600", children: encoderInfo.hasAv1Support && encoderInfo.hasH265Support ? `Available: AV1 (${encoderInfo.available.join(", ")}), H.265 (${encoderInfo.h265Available.join(", ")})` : encoderInfo.hasH265Support ? `H.265 available (${encoderInfo.h265Available.join(", ")}). Upgrade FFmpeg for AV1 support.` : "Upgrade FFmpeg to enable AV1 encoding for optimal archival quality." })
      ] }),
      encoderInfo.canUpgrade && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => void handleUpgradeFFmpeg(),
          disabled: isUpgrading,
          className: "rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50",
          children: isUpgrading ? upgradeProgress : "Upgrade FFmpeg"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Select Files" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Choose video files to encode. Use AV1 for archival or H.265 for web delivery." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-slate-50 px-4 py-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Input files" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-600", children: inputPaths.length === 0 ? "No files selected" : `${inputPaths.length} file${inputPaths.length === 1 ? "" : "s"} selected` }),
            inputPaths.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-slate-500", children: [
              inputPaths.slice(0, 5).map((path) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate", children: path }, path)),
              inputPaths.length > 5 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-400", children: [
                "+",
                inputPaths.length - 5,
                " more"
              ] })
            ] }),
            inputPaths.length > 100 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Large batch:" }),
              " ",
              inputPaths.length,
              " files selected. This may take a while to process."
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => void handleSelectFiles(),
                  className: "rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500",
                  children: inputPaths.length > 0 ? "Change files" : "Select files"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => void handleSelectFolder(),
                  className: "rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500",
                  children: "Select folder"
                }
              )
            ] }),
            folderPath && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-3 text-xs text-slate-500", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "Folder: ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600", children: folderPath })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-center gap-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: config.preserveStructure ?? true,
                    onChange: (e) => handleConfigChange("preserveStructure", e.target.checked),
                    className: "h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: config.preserveStructure ? "text-blue-700" : "text-slate-500", children: "Preserve folder structure" })
              ] })
            ] })
          ] }),
          isAnalyzing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-500", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "h-4 w-4 animate-spin", viewBox: "0 0 24 24", fill: "none", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })
            ] }),
            "Analyzing video..."
          ] }),
          sourceInfo && (() => {
            const resolution = getResolutionCategory(sourceInfo.width, sourceInfo.height);
            const lookupRes = resolution === "source" ? "1080p" : resolution;
            const baseCrf = sourceInfo.isHdr ? ARCHIVAL_CRF_DEFAULTS.hdr[lookupRes] : ARCHIVAL_CRF_DEFAULTS.sdr[lookupRes];
            const crfInfo = sourceInfo.bitrate ? getBitrateAdjustedCrf({ ...sourceInfo, bitrate: sourceInfo.bitrate }, baseCrf) : null;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Source:" }),
                " ",
                sourceInfo.width,
                "x",
                sourceInfo.height,
                " ",
                sourceInfo.isHdr && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-violet-100 px-1 text-violet-700", children: "HDR" }),
                " ",
                isDolbyVision && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-amber-100 px-1 text-amber-700", children: "Dolby Vision" }),
                " ",
                Math.round(sourceInfo.frameRate),
                "fps",
                " ",
                sourceInfo.bitrate && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-slate-500", children: [
                  (sourceInfo.bitrate / 1e6).toFixed(1),
                  " Mbps "
                ] }),
                formatDuration2(sourceInfo.duration)
              ] }),
              crfInfo && crfInfo.adjustment > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-700", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "CRF adjusted:" }),
                " ",
                baseCrf,
                " → ",
                crfInfo.adjustedCrf,
                " (",
                crfInfo.reason,
                ")"
              ] })
            ] });
          })(),
          isDolbyVision && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg", children: "⚠" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-amber-800", children: "Dolby Vision Detected" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-amber-700", children: "AV1 cannot preserve Dolby Vision metadata. The output will be HDR10/PQ instead. Visual quality will be maintained, but Dolby Vision dynamic metadata will be lost." })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-slate-50 px-4 py-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Output directory" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 truncate text-sm text-slate-600", children: outputDir ?? "No directory selected" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => void handleSelectOutputDir(),
                className: "mt-3 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500",
                children: outputDir ? "Change directory" : "Select directory"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Encoding Settings" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Configure encoding parameters for video archival or web delivery." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "Video Codec" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-2 sm:grid-cols-2", children: CODEC_OPTIONS.map((codec) => {
              const isDisabled = codec.value === "av1" ? !encoderInfo?.hasAv1Support : !encoderInfo?.hasH265Support;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => handleCodecChange(codec.value),
                  disabled: isDisabled,
                  className: `rounded-lg border px-4 py-3 text-left transition ${config.codec === codec.value ? "border-slate-900 bg-slate-900 text-white" : isDisabled ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: codec.label }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `mt-0.5 text-xs ${config.codec === codec.value ? "text-slate-300" : isDisabled ? "text-slate-400" : "text-slate-500"}`, children: isDisabled ? "Encoder not available" : codec.description })
                  ]
                },
                codec.value
              );
            }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "Encoding Preset" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-2", children: PRESET_OPTIONS.map((preset) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => handlePresetChange(preset.value),
                className: `rounded-lg border px-4 py-3 text-left transition ${selectedPreset === preset.value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: preset.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `mt-0.5 text-xs ${selectedPreset === preset.value ? "text-slate-300" : "text-slate-500"}`, children: preset.description })
                ]
              },
              preset.value
            )) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "Output Format" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "select",
              {
                value: config.container ?? "mkv",
                onChange: (e) => handleConfigChange("container", e.target.value),
                className: "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm",
                children: CONTAINER_OPTIONS.filter((opt) => !(config.codec === "h265" && opt.value === "webm")).map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: opt.value, children: [
                  opt.label,
                  config.codec === "h265" && opt.value === "mp4" ? " (recommended for H.265)" : "",
                  config.codec !== "h265" && opt.value === "mkv" ? " (recommended for AV1)" : ""
                ] }, opt.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => setShowAdvanced(!showAdvanced),
              className: "flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-2 text-left text-sm text-slate-600 hover:border-slate-300",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Advanced Settings" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "svg",
                  {
                    className: `h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`,
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" })
                  }
                )
              ]
            }
          ),
          showAdvanced && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 rounded-lg border border-slate-100 bg-slate-50 p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "Resolution" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "select",
                {
                  value: config.resolution ?? "source",
                  onChange: (e) => handleConfigChange("resolution", e.target.value),
                  className: "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm",
                  children: RESOLUTION_OPTIONS.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: opt.value, children: opt.label }, opt.value))
                }
              )
            ] }),
            config.codec !== "h265" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              encoderInfo && encoderInfo.available.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "AV1 Encoder" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "select",
                  {
                    value: config.av1?.encoder ?? encoderInfo.recommended ?? "libsvtav1",
                    onChange: (e) => handleAv1Change("encoder", e.target.value),
                    className: "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm",
                    children: encoderInfo.available.map((enc) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: enc, children: [
                      enc,
                      " ",
                      enc === encoderInfo.recommended ? "(recommended)" : ""
                    ] }, enc))
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "Quality (CRF)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-slate-700", children: config.av1?.crf ?? 30 })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "range",
                    min: 18,
                    max: 45,
                    value: config.av1?.crf ?? 30,
                    onChange: (e) => handleAv1Change("crf", Number(e.target.value)),
                    className: "mt-2 w-full accent-slate-900"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex justify-between text-[10px] text-slate-400", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Higher quality (24-28)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Smaller file (35+)" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 flex flex-wrap gap-1.5", children: [
                  { value: 26, label: "High", desc: "Near lossless" },
                  { value: 30, label: "Recommended", desc: "Best balance for archival" },
                  { value: 35, label: "Medium", desc: "Good compression" },
                  { value: 40, label: "Small", desc: "Maximum compression" }
                ].map((preset) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleAv1Change("crf", preset.value),
                    className: `rounded px-2 py-1 text-[10px] transition ${config.av1?.crf === preset.value ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`,
                    title: preset.desc,
                    children: [
                      preset.label,
                      " (",
                      preset.value,
                      ")"
                    ]
                  },
                  preset.value
                )) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-[10px] text-slate-400", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Tip:" }),
                  " AV1 CRF 30 is excellent for archival. Auto-adjusted based on resolution and HDR."
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "Speed Preset" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-slate-700", children: config.av1?.preset ?? 6 })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "range",
                    min: 0,
                    max: 12,
                    value: config.av1?.preset ?? 6,
                    onChange: (e) => handleAv1Change("preset", Number(e.target.value)),
                    className: "mt-2 w-full accent-slate-900"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex justify-between text-[10px] text-slate-400", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Slower (better)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Faster" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "Film Grain" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-slate-700", children: config.av1?.filmGrainSynthesis === 0 ? "Off" : config.av1?.filmGrainSynthesis ?? 10 })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "range",
                    min: 0,
                    max: 20,
                    value: config.av1?.filmGrainSynthesis ?? 10,
                    onChange: (e) => handleAv1Change("filmGrainSynthesis", Number(e.target.value)),
                    className: "mt-2 w-full accent-slate-900"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-slate-400", children: "Synthesizes grain for better compression. Disable (0) for screen recordings." })
              ] }),
              config.av1?.encoder === "libaom-av1" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-slate-200 bg-white p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: config.av1?.twoPass ?? false,
                    onChange: (e) => handleAv1Change("twoPass", e.target.checked),
                    className: "h-4 w-4 rounded border-slate-300 text-blue-600"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-slate-700", children: "Two-Pass Encoding" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "Better quality/size efficiency. Takes ~2x longer." })
                ] })
              ] }) })
            ] }),
            config.codec === "h265" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "H.265 Preset" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "select",
                  {
                    value: config.h265?.preset ?? "medium",
                    onChange: (e) => handleH265Change("preset", e.target.value),
                    className: "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm",
                    children: H265_PRESET_OPTIONS.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: opt.value, children: opt.label }, opt.value))
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "Quality (CRF)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-slate-700", children: config.h265?.crf ?? 23 })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "range",
                    min: 18,
                    max: 35,
                    value: config.h265?.crf ?? 23,
                    onChange: (e) => handleH265Change("crf", Number(e.target.value)),
                    className: "mt-2 w-full accent-slate-900"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex justify-between text-[10px] text-slate-400", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Higher quality (18-22)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Smaller file (28+)" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 flex flex-wrap gap-1.5", children: [
                  { value: 20, label: "High", desc: "Near lossless" },
                  { value: 23, label: "Recommended", desc: "Best balance" },
                  { value: 26, label: "Medium", desc: "Good quality" },
                  { value: 28, label: "Small", desc: "Web optimized" }
                ].map((preset) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleH265Change("crf", preset.value),
                    className: `rounded px-2 py-1 text-[10px] transition ${config.h265?.crf === preset.value ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`,
                    title: preset.desc,
                    children: [
                      preset.label,
                      " (",
                      preset.value,
                      ")"
                    ]
                  },
                  preset.value
                )) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-[10px] text-slate-400", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Tip:" }),
                  " CRF 23 is ideal for web delivery. Use 20-22 for high quality archival, 26-28 for smaller files."
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "Tune (optional)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "select",
                  {
                    value: config.h265?.tune ?? "",
                    onChange: (e) => {
                      const value = e.target.value;
                      handleH265Change("tune", value === "" ? void 0 : value);
                    },
                    className: "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "None (default)" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "film", children: "Film - preserves grain" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "animation", children: "Animation - better for cartoons" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "grain", children: "Grain - heavy grain preservation" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "fastdecode", children: "Fast Decode - simpler decode" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "B-frames" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-slate-700", children: config.h265?.bframes ?? 4 })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "range",
                    min: 0,
                    max: 8,
                    value: config.h265?.bframes ?? 4,
                    onChange: (e) => handleH265Change("bframes", Number(e.target.value)),
                    className: "mt-2 w-full accent-slate-900"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-slate-400", children: "More B-frames = better compression. 4 recommended for web." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-slate-200 bg-white p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: config.h265?.twoPass ?? false,
                    onChange: (e) => handleH265Change("twoPass", e.target.checked),
                    className: "h-4 w-4 rounded border-slate-300 text-blue-600"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-slate-700", children: "Two-Pass Encoding" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "Better quality/size efficiency. Takes ~2x longer." })
                ] })
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-slate-100 bg-slate-50 p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                checked: config.audioCopy ?? true,
                onChange: (e) => handleConfigChange("audioCopy", e.target.checked),
                className: "h-4 w-4 rounded border-slate-300"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-600", children: "Copy audio (no re-encoding)" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  checked: config.preserveStructure ?? false,
                  onChange: (e) => handleConfigChange("preserveStructure", e.target.checked),
                  className: "h-4 w-4 rounded border-slate-300"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-600", children: "Preserve folder structure" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  checked: config.overwriteExisting ?? false,
                  onChange: (e) => handleConfigChange("overwriteExisting", e.target.checked),
                  disabled: config.fillMode ?? false,
                  className: "h-4 w-4 rounded border-slate-300 disabled:opacity-50"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-sm ${config.fillMode ? "text-slate-400" : "text-slate-600"}`, children: "Overwrite existing files" })
            ] }),
            config.fillMode && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "ml-7 text-xs text-slate-400", children: "Fill mode disables overwrite to avoid accidental replacements." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  checked: config.fillMode ?? false,
                  onChange: (e) => handleFillModeChange(e.target.checked),
                  className: "h-4 w-4 rounded border-slate-300"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-slate-600", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Fill mode" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "Skip files that would conflict with existing output names (disables overwrite)" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  checked: config.deleteOutputIfLarger ?? true,
                  onChange: (e) => handleConfigChange("deleteOutputIfLarger", e.target.checked),
                  className: "h-4 w-4 rounded border-slate-300"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-slate-600", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Skip if output is larger" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "Keep original if re-encoding produces a larger file" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  checked: config.extractThumbnail ?? false,
                  onChange: (e) => handleConfigChange("extractThumbnail", e.target.checked),
                  className: "h-4 w-4 rounded border-slate-300"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-slate-600", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Extract thumbnail" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "Save a JPEG thumbnail alongside each encoded video" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  checked: config.extractCaptions ?? false,
                  onChange: (e) => handleConfigChange("extractCaptions", e.target.checked),
                  className: "h-4 w-4 rounded border-slate-300"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-slate-600", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Extract captions" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "Generate subtitles using Whisper" })
              ] })
            ] }),
            config.extractCaptions && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-7 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-slate-500", children: "Transcription Provider" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "radio",
                      name: "whisperProvider",
                      value: "bundled",
                      checked: whisperProvider === "bundled",
                      onChange: () => {
                        setWhisperProvider("bundled");
                        void window.api.setWhisperProvider({ provider: "bundled" });
                      },
                      className: "h-3.5 w-3.5"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-600", children: "Bundled Whisper" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "radio",
                      name: "whisperProvider",
                      value: "lmstudio",
                      checked: whisperProvider === "lmstudio",
                      onChange: () => {
                        setWhisperProvider("lmstudio");
                        void window.api.setWhisperProvider({ provider: "lmstudio", endpoint: lmstudioEndpoint });
                      },
                      className: "h-3.5 w-3.5"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-600", children: "LM Studio" })
                ] })
              ] }),
              whisperProvider === "lmstudio" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-slate-500", children: "API Endpoint" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "text",
                    value: lmstudioEndpoint,
                    onChange: (e) => {
                      setLmstudioEndpoint(e.target.value);
                      void window.api.setWhisperProvider({ provider: "lmstudio", endpoint: e.target.value });
                    },
                    placeholder: "http://localhost:1234/v1/audio/transcriptions",
                    className: "w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 placeholder-slate-400"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "OpenAI-compatible transcription endpoint" })
              ] }),
              whisperProvider === "bundled" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "Requires whisper model configured in Settings → Processing" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "checkbox",
                        id: "whisper-gpu",
                        checked: whisperGpuEnabled,
                        disabled: !whisperGpuAvailable,
                        onChange: (e) => {
                          setWhisperGpuEnabled(e.target.checked);
                          void window.api.setWhisperGpuEnabled(e.target.checked);
                        },
                        className: "h-3.5 w-3.5 rounded border-slate-300 disabled:opacity-50"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { htmlFor: "whisper-gpu", className: `text-xs ${whisperGpuAvailable ? "text-slate-600" : "text-slate-400"}`, children: [
                      "GPU Acceleration ",
                      whisperGpuType === "metal" ? "(Metal)" : ""
                    ] })
                  ] }),
                  whisperGpuAvailable && whisperGpuEnabled && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700", children: "Enabled" })
                ] }),
                !whisperGpuAvailable && whisperGpuReason && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-600", children: whisperGpuReason })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 text-rose-600", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  checked: config.deleteOriginal ?? false,
                  onChange: (e) => handleConfigChange("deleteOriginal", e.target.checked),
                  className: "h-4 w-4 rounded border-rose-300"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: "Delete original after encoding" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "Thread limit" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  value: String(config.threadLimit ?? 0),
                  onChange: (e) => handleConfigChange("threadLimit", Number(e.target.value)),
                  className: "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "0", children: "No limit (use all threads)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "6", children: "Limit to 6 threads" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "4", children: "Limit to 4 threads" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-400", children: "Lower CPU usage at the cost of slower encoding." })
            ] })
          ] })
        ] })
      ] })
    ] }),
    previewCommand && previewCommand.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-slate-200/70 bg-slate-50 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "FFmpeg command preview" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("pre", { className: "mt-2 max-h-20 overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-[11px] text-slate-600", children: [
        "ffmpeg ",
        previewCommand.join(" ")
      ] })
    ] }),
    inputPaths.length > 0 && outputDir && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-slate-700", children: "Batch Summary" }),
      isLoadingBatchInfo ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-2 text-sm text-slate-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "h-4 w-4 animate-spin", viewBox: "0 0 24 24", fill: "none", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })
        ] }),
        "Calculating..."
      ] }) : batchInfo ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 px-3 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "Total Duration" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-slate-700", children: batchInfo.totalDurationSeconds ? formatDuration2(batchInfo.totalDurationSeconds) : "--" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-blue-50 px-3 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-blue-500", children: "Est. Encoding Time" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-blue-700", children: batchInfo.totalDurationSeconds ? (() => {
            const codec = config.codec ?? "av1";
            const preset = codec === "h265" ? config.h265?.preset ?? "medium" : config.av1?.preset ?? 6;
            const encoder = codec === "h265" ? "libx265" : config.av1?.encoder ?? "libsvtav1";
            const resolution = config.resolution ?? "source";
            const twoPass = codec === "h265" ? config.h265?.twoPass ?? false : config.av1?.encoder === "libaom-av1" && config.av1?.twoPass;
            const estimate = estimateEncodingTime$1(
              batchInfo.totalDurationSeconds,
              codec,
              preset,
              encoder,
              resolution,
              twoPass ?? false
            );
            return formatEstimatedTime(estimate.estimatedSeconds);
          })() : "--" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 px-3 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "Total Input Size" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-slate-700", children: batchInfo.totalInputBytes ? formatFileSize2(batchInfo.totalInputBytes) : "--" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 px-3 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "Est. Output Size" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-slate-700", children: batchInfo.estimatedOutputBytes ? formatFileSize2(batchInfo.estimatedOutputBytes) : "--" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-lg px-3 py-2 ${batchInfo.hasEnoughSpace === false ? "bg-rose-50" : "bg-slate-50"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "Available Space" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-sm font-semibold ${batchInfo.hasEnoughSpace === false ? "text-rose-600" : "text-slate-700"}`, children: batchInfo.availableBytes ? formatFileSize2(batchInfo.availableBytes) : "--" })
        ] })
      ] }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 space-y-2", children: [
        batchInfo?.hasEnoughSpace === false && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Not enough disk space!" }),
          " ",
          "Need ~",
          batchInfo.estimatedOutputBytes ? formatFileSize2(batchInfo.estimatedOutputBytes) : "?",
          " ",
          "but only ",
          batchInfo.availableBytes ? formatFileSize2(batchInfo.availableBytes) : "?",
          " available."
        ] }),
        batchInfo && batchInfo.existingCount !== void 0 && batchInfo.existingCount > 0 && !config.overwriteExisting && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold", children: [
            batchInfo.existingCount,
            " file",
            batchInfo.existingCount !== 1 ? "s" : "",
            " already exist"
          ] }),
          " ",
          config.fillMode ? "and will be skipped because Fill mode is enabled." : 'and will be skipped. Enable "Overwrite existing files" to re-encode them.'
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-slate-200/70 bg-slate-900 p-6 text-white shadow-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-semibold", children: "Start Archival Batch" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-sm text-slate-300", children: [
            inputPaths.length,
            " file",
            inputPaths.length !== 1 ? "s" : "",
            " ready to encode",
            batchInfo?.totalDurationSeconds ? ` · ${formatDuration2(batchInfo.totalDurationSeconds)} total` : ""
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                setInputPaths([]);
                setOutputDir(null);
                setSourceInfo(null);
                if (defaultConfig) setConfig(defaultConfig);
              },
              className: "rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide",
              children: "Reset"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleStartBatch(),
              disabled: isStarting || inputPaths.length === 0 || !outputDir || (config.codec === "h265" ? !encoderInfo?.hasH265Support : !encoderInfo?.hasAv1Support),
              className: "rounded-full bg-white px-6 py-2 text-sm font-semibold uppercase tracking-wide text-slate-900 disabled:opacity-50",
              children: isStarting ? "Starting..." : "Start Encoding"
            }
          )
        ] })
      ] }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-sm text-rose-300", children: error })
    ] }),
    currentJob && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Current Batch" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(currentJob.status)}`, children: currentJob.status })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-sm text-slate-500", children: [
            currentJob.completedItems,
            " of ",
            currentJob.totalItems,
            " completed",
            currentJob.failedItems > 0 && ` · ${currentJob.failedItems} failed`,
            currentJob.skippedItems > 0 && ` · ${currentJob.skippedItems} skipped`
          ] })
        ] }),
        currentJob.status === "running" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => void handleCancel(),
            className: "rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600",
            children: "Cancel"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs text-slate-500", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Overall progress" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            currentJob.status === "running" && batchSpeed !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-blue-600", children: [
              formatSpeed(batchSpeed),
              " realtime"
            ] }),
            currentJob.status === "running" && batchEta !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-slate-700", children: [
              "ETA: ",
              formatEta(batchEta)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              batchProgress || overallProgress,
              "%"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "h-full rounded-full bg-slate-900 transition-all",
            style: { width: `${batchProgress || overallProgress}%` }
          }
        ) })
      ] }),
      currentJob.status === "running" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 grid grid-cols-2 gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:grid-cols-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "Speed" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-slate-700", children: batchSpeed !== void 0 ? formatSpeed(batchSpeed) : "--" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "ETA" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-slate-700", children: batchEta !== void 0 ? formatEta(batchEta) : "--" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "Remaining" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-semibold text-slate-700", children: [
            currentJob.totalItems - currentJob.completedItems - currentJob.failedItems - currentJob.skippedItems,
            " files"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "Output Size" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-emerald-600", children: currentJob.actualOutputBytes ? formatFileSize2(currentJob.actualOutputBytes) : "--" })
        ] })
      ] }),
      currentJob.status === "completed" && currentJob.actualOutputBytes !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 sm:grid-cols-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-emerald-600", children: "Completed" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-semibold text-emerald-700", children: [
            currentJob.completedItems,
            " / ",
            currentJob.totalItems
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-emerald-600", children: "Total Output" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-emerald-700", children: formatFileSize2(currentJob.actualOutputBytes) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-emerald-600", children: "Skipped" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-emerald-700", children: currentJob.skippedItems })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-emerald-600", children: "Failed" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-sm font-semibold ${currentJob.failedItems > 0 ? "text-rose-600" : "text-emerald-700"}`, children: currentJob.failedItems })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 max-h-64 space-y-2 overflow-y-auto", children: currentJob.items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-slate-100 bg-slate-50 px-3 py-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "flex-1 truncate text-sm font-medium text-slate-700", children: item.inputPath.split(/[/\\]/).pop() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusTone(item.status)}`, children: item.status })
        ] }),
        item.status === "encoding" && item.progress != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 w-full overflow-hidden rounded-full bg-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "h-full rounded-full bg-blue-500 transition-all",
              style: { width: `${Math.min(100, item.progress)}%` }
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center justify-between text-[10px] text-slate-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              Math.round(item.progress),
              "%"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              item.encodingSpeed !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatSpeed(item.encodingSpeed) }),
              item.etaSeconds !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "ETA: ",
                formatEta(item.etaSeconds)
              ] }),
              item.elapsedSeconds !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-slate-300", children: [
                "Elapsed: ",
                formatEta(item.elapsedSeconds)
              ] })
            ] })
          ] })
        ] }),
        item.status === "completed" && item.compressionRatio != null && item.compressionRatio >= 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[10px] text-emerald-600", children: [
          "Compressed to ",
          (100 / item.compressionRatio).toFixed(0),
          "% of original",
          item.outputSize != null && ` (${formatFileSize2(item.outputSize)})`
        ] }),
        item.status === "completed" && item.compressionRatio != null && item.compressionRatio < 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[10px] text-amber-600", children: [
          "Warning: Output is ",
          (100 / item.compressionRatio).toFixed(0),
          "% of original (larger)",
          item.outputSize != null && ` (${formatFileSize2(item.outputSize)})`
        ] }),
        item.errorType === "output_larger" && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[10px] text-amber-600", children: [
          "Skipped: Output would be larger than original (",
          item.compressionRatio && item.compressionRatio < 1 ? `${(100 / item.compressionRatio).toFixed(0)}% of original` : "no savings",
          ")"
        ] }),
        item.error && item.errorType !== "output_larger" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-rose-600", children: item.errorType ? getErrorMessage(item.errorType) : item.error })
      ] }, item.id)) })
    ] })
  ] });
}
const mapDownload = (item) => ({
  id: item.id,
  url: item.url,
  jobId: item.job_id,
  status: item.status,
  createdAt: item.created_at,
  progress: item.progress ?? null,
  speed: item.speed ?? void 0,
  eta: item.eta ?? void 0,
  outputPath: item.output_path ?? null,
  updatedAt: item.updated_at,
  error: item.error_message,
  videoId: item.video_id
});
let poller = null;
let unsubscribeEvents = null;
let refreshTimer = null;
const scheduleRefresh = (fn, delayMs = 1500) => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    fn();
  }, delayMs);
};
const useDownloadsStore = create((set, get) => ({
  downloads: [],
  error: null,
  isLoading: false,
  lastSynced: null,
  setError: (error) => set({ error }),
  addDownload: (download) => set((state) => ({ downloads: [download, ...state.downloads] })),
  patchDownload: (downloadId, patch) => set((state) => ({
    downloads: state.downloads.map((item) => item.id === downloadId ? { ...item, ...patch } : item)
  })),
  applyEvent: (event) => set((state) => {
    const index = state.downloads.findIndex((item) => item.id === event.downloadId);
    if (index === -1) {
      return state;
    }
    const next = [...state.downloads];
    const current = next[index];
    if (event.type === "status") {
      next[index] = {
        ...current,
        status: event.status,
        progress: event.status === "completed" ? 100 : current.progress,
        error: event.error ?? current.error
      };
    } else {
      next[index] = {
        ...current,
        progress: event.progress ?? current.progress,
        speed: event.speed ?? current.speed,
        eta: event.eta ?? current.eta
      };
    }
    return { ...state, downloads: next };
  }),
  loadDownloads: async () => {
    set({ isLoading: true });
    try {
      const result = await window.api.downloadList();
      if (result.ok) {
        set({
          downloads: result.downloads.map(mapDownload),
          error: null,
          lastSynced: (/* @__PURE__ */ new Date()).toISOString()
        });
      } else {
        set({ error: "Unable to load downloads." });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unable to load downloads." });
    } finally {
      set({ isLoading: false });
    }
  },
  startPolling: (intervalMs = 15e3) => {
    if (poller) {
      return;
    }
    poller = setInterval(() => {
      void get().loadDownloads();
    }, intervalMs);
    void get().loadDownloads();
  },
  stopPolling: () => {
    if (poller) {
      clearInterval(poller);
      poller = null;
    }
  },
  startRealtime: () => {
    if (unsubscribeEvents) {
      return;
    }
    unsubscribeEvents = window.api.onDownloadEvent((event) => {
      const state = get();
      if (!state.downloads.some((item) => item.id === event.downloadId)) {
        scheduleRefresh(() => {
          void state.loadDownloads();
        });
      }
      get().applyEvent(event);
    });
  },
  stopRealtime: () => {
    if (unsubscribeEvents) {
      unsubscribeEvents();
      unsubscribeEvents = null;
    }
  }
}));
const parseBatchInput = (input) => {
  const urls = [];
  const seen = /* @__PURE__ */ new Set();
  let total = 0;
  let duplicates = 0;
  let invalid = 0;
  const lines = input.split(/\r?\n/);
  const regex = /https?:\/\/[^\s]+/g;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const matches = trimmed.match(regex);
    if (!matches) {
      invalid += 1;
      continue;
    }
    for (const match of matches) {
      total += 1;
      if (seen.has(match)) {
        duplicates += 1;
        continue;
      }
      seen.add(match);
      urls.push(match);
    }
  }
  return { urls, total, duplicates, invalid };
};
const formatBatchReason = (reason) => {
  if (!reason) {
    return "Unknown";
  }
  switch (reason) {
    case "duplicate_in_batch":
      return "Duplicate in batch";
    case "already_queued":
      return "Already queued";
    case "already_downloaded":
      return "Already in library";
    case "empty":
      return "Empty entry";
    default:
      return reason.replace(/_/g, " ");
  }
};
function Downloads() {
  const [url, setUrl] = reactExports.useState("");
  const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
  const [batchInput, setBatchInput] = reactExports.useState("");
  const [batchSubmitting, setBatchSubmitting] = reactExports.useState(false);
  const [batchError, setBatchError] = reactExports.useState(null);
  const [batchResponse, setBatchResponse] = reactExports.useState(null);
  const [confirmCancelId, setConfirmCancelId] = reactExports.useState(null);
  const [downloadPath, setDownloadPath] = reactExports.useState(null);
  const [isDragging, setIsDragging] = reactExports.useState(false);
  const dragCounter = reactExports.useRef(0);
  const downloads = useDownloadsStore((state) => state.downloads);
  const error = useDownloadsStore((state) => state.error);
  const setError = useDownloadsStore((state) => state.setError);
  const addDownload = useDownloadsStore((state) => state.addDownload);
  const patchDownload = useDownloadsStore((state) => state.patchDownload);
  const startPolling = useDownloadsStore((state) => state.startPolling);
  const stopPolling = useDownloadsStore((state) => state.stopPolling);
  const startRealtime = useDownloadsStore((state) => state.startRealtime);
  const stopRealtime = useDownloadsStore((state) => state.stopRealtime);
  const parsedBatch = reactExports.useMemo(() => parseBatchInput(batchInput), [batchInput]);
  reactExports.useEffect(() => {
    startPolling(15e3);
    startRealtime();
    window.api.getDownloadPath().then((result) => {
      if (result.ok && result.path) {
        setDownloadPath(result.path);
      }
    }).catch(() => {
      setDownloadPath(null);
    });
    return () => {
      stopPolling();
      stopRealtime();
    };
  }, [startPolling, startRealtime, stopPolling, stopRealtime]);
  reactExports.useEffect(() => {
    if (!confirmCancelId) {
      return;
    }
    const entry = downloads.find((item) => item.id === confirmCancelId);
    if (!entry || !["queued", "downloading"].includes(entry.status)) {
      setConfirmCancelId(null);
    }
  }, [confirmCancelId, downloads]);
  const handleSubmit = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Enter a URL to queue a download.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await window.api.downloadStart(trimmed);
      if (!result.ok || !result.downloadId) {
        const message = result.error === "already_queued" ? "This URL is already queued." : result.error === "already_downloaded" ? "This URL is already in your library." : result.error ?? "Download could not be queued.";
        setError(message);
        return;
      }
      const entry = {
        id: result.downloadId,
        url: trimmed,
        jobId: result.jobId ?? null,
        status: result.status ?? "queued",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        progress: 0,
        error: null
      };
      addDownload(entry);
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleCancel = async (downloadId) => {
    try {
      const result = await window.api.downloadCancel(downloadId);
      if (!result.ok) {
        setError(result.error ?? "Cancel failed.");
        return;
      }
      patchDownload(downloadId, {
        status: result.status ?? "canceled",
        error: "canceled_by_user"
      });
      setConfirmCancelId(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed.");
    }
  };
  const handleRetry = async (downloadId) => {
    try {
      const result = await window.api.downloadRetry(downloadId);
      if (!result.ok) {
        setError(result.error ?? "Retry failed.");
        return;
      }
      patchDownload(downloadId, {
        jobId: result.jobId ?? null,
        status: result.status ?? "queued",
        progress: 0,
        speed: void 0,
        eta: void 0,
        error: null
      });
      setConfirmCancelId(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed.");
    }
  };
  const handleSelectFolder = async () => {
    try {
      const result = await window.api.selectDownloadPath();
      if (result.ok && result.path) {
        setDownloadPath(result.path);
        setError(null);
      } else if (!result.canceled) {
        setError(result.error ?? "Unable to update download path.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update download path.");
    }
  };
  const applyDroppedUrls = reactExports.useCallback(
    async (urls) => {
      if (urls.length === 0) {
        setBatchError("No valid URLs found in drop.");
        return;
      }
      setBatchError(null);
      if (urls.length === 1) {
        setIsSubmitting(true);
        try {
          const result = await window.api.downloadStart(urls[0]);
          if (!result.ok || !result.downloadId) {
            const message = result.error === "already_queued" ? "This URL is already queued." : result.error === "already_downloaded" ? "This URL is already in your library." : result.error ?? "Download could not be queued.";
            setBatchError(message);
            return;
          }
          addDownload({
            id: result.downloadId,
            url: urls[0],
            jobId: result.jobId ?? null,
            status: result.status ?? "queued",
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            progress: 0,
            error: null
          });
        } catch (err) {
          setBatchError(err instanceof Error ? err.message : "Download failed.");
        } finally {
          setIsSubmitting(false);
        }
        return;
      }
      setBatchSubmitting(true);
      setBatchResponse(null);
      try {
        const result = await window.api.downloadBatch({ urls });
        if (!result.ok) {
          setBatchError(result.error ?? "Batch queue failed.");
          return;
        }
        setBatchResponse(result);
        result.results.filter((item) => item.status === "queued" && item.downloadId).forEach((item) => {
          addDownload({
            id: item.downloadId ?? "",
            url: item.url,
            jobId: item.jobId ?? null,
            status: "queued",
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            progress: 0,
            error: null
          });
        });
      } catch (err) {
        setBatchError(err instanceof Error ? err.message : "Batch queue failed.");
      } finally {
        setBatchSubmitting(false);
      }
    },
    [addDownload]
  );
  reactExports.useEffect(() => {
    const handleDragEnter = (event) => {
      event.preventDefault();
      dragCounter.current += 1;
      setIsDragging(true);
    };
    const handleDragOver = (event) => {
      event.preventDefault();
    };
    const handleDragLeave = (event) => {
      event.preventDefault();
      dragCounter.current = Math.max(0, dragCounter.current - 1);
      if (dragCounter.current === 0) {
        setIsDragging(false);
      }
    };
    const handleDrop = (event) => {
      event.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      const uriList = event.dataTransfer?.getData("text/uri-list") ?? "";
      const plainText = event.dataTransfer?.getData("text/plain") ?? "";
      const combined = [uriList, plainText].filter(Boolean).join("\n");
      const parsed = parseBatchInput(combined);
      void applyDroppedUrls(parsed.urls);
    };
    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [applyDroppedUrls]);
  const handleBatchSubmit = async () => {
    if (!parsedBatch.urls.length) {
      setBatchError("Paste at least one URL to queue.");
      return;
    }
    setBatchSubmitting(true);
    setBatchError(null);
    setBatchResponse(null);
    try {
      const result = await window.api.downloadBatch({ urls: parsedBatch.urls });
      if (!result.ok) {
        setBatchError(result.error ?? "Batch queue failed.");
        return;
      }
      setBatchResponse(result);
      result.results.filter((item) => item.status === "queued" && item.downloadId).forEach((item) => {
        const entry = {
          id: item.downloadId ?? "",
          url: item.url,
          jobId: item.jobId ?? null,
          status: "queued",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          progress: 0,
          error: null
        };
        addDownload(entry);
      });
      setBatchInput("");
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : "Batch queue failed.");
    } finally {
      setBatchSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    isDragging ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-white/20 bg-white/10 px-8 py-6 text-center text-sm text-white", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-semibold", children: "Drop URLs to queue" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-white/70", children: "Supports multiple links at once." })
    ] }) }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Start a download" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Paste a URL or drag and drop links to begin a managed download. Jobs will appear in the queue below." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "truncate", children: [
          "Download folder: ",
          downloadPath ?? "Default"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => void handleSelectFolder(),
            className: "rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:border-slate-300",
            children: "Change folder"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex flex-col gap-3 md:flex-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: url,
            onChange: (event) => setUrl(event.target.value),
            placeholder: "https://",
            className: "flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none focus:border-slate-400"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => void handleSubmit(),
            disabled: isSubmitting,
            className: "rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70",
            children: isSubmitting ? "Queuing..." : "Queue download"
          }
        )
      ] }),
      error ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-rose-600", children: error }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Batch URL import" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Paste multiple URLs or a mixed list. Comments starting with # are ignored." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500", children: [
          parsedBatch.urls.length,
          " ready"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: batchInput,
            onChange: (event) => setBatchInput(event.target.value),
            placeholder: "https://example.com/video-a",
            rows: 6,
            className: "w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none focus:border-slate-400"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 text-xs text-slate-500", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Parsed: ",
            parsedBatch.urls.length,
            " URLs"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Total matches: ",
            parsedBatch.total
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Duplicates removed: ",
            parsedBatch.duplicates
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Invalid lines: ",
            parsedBatch.invalid
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleBatchSubmit(),
              disabled: batchSubmitting || parsedBatch.urls.length === 0,
              className: "rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70",
              children: batchSubmitting ? "Queuing batch..." : "Queue batch"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                setBatchInput("");
                setBatchResponse(null);
                setBatchError(null);
              },
              className: "rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-500 hover:border-slate-300",
              children: "Clear"
            }
          )
        ] }),
        batchError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-rose-600", children: batchError }) : null,
        batchResponse ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-slate-50 px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-emerald-100 px-3 py-1 text-emerald-700", children: [
              batchResponse.queued,
              " queued"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-amber-100 px-3 py-1 text-amber-700", children: [
              batchResponse.skipped,
              " skipped"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-rose-100 px-3 py-1 text-rose-700", children: [
              batchResponse.failed,
              " failed"
            ] })
          ] }),
          batchResponse.results.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 max-h-56 space-y-2 overflow-y-auto", children: batchResponse.results.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate text-slate-600", children: item.url || "Unknown URL" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: `rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${item.status === "queued" ? "bg-emerald-100 text-emerald-700" : item.status === "skipped" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`,
                    children: item.status
                  }
                ),
                item.status !== "queued" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase tracking-wide text-slate-400", children: formatBatchReason(item.reason) }) : null
              ]
            },
            `${item.url}-${index}`
          )) }) : null
        ] }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Download queue" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500", children: downloads.length ? `${downloads.length} queued` : "Empty" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 space-y-3", children: downloads.length === 0 ? ["Waiting", "Active", "Completed"].map((stage) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500",
          children: [
            stage,
            " downloads will appear here."
          ]
        },
        stage
      )) : downloads.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-slate-200 px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium text-slate-900", children: item.url }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-slate-400", children: [
            "Queued at ",
            new Date(item.createdAt).toLocaleString()
          ] }),
          item.error ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs text-rose-600", children: [
            "Error: ",
            item.error
          ] }) : null,
          item.outputPath ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 truncate text-xs text-slate-500", children: [
            "Saved to: ",
            item.outputPath
          ] }) : null,
          typeof item.progress === "number" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs text-slate-500", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                item.progress.toFixed(1),
                "%"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                item.speed ?? "--",
                " ",
                item.eta ? `ETA ${item.eta}` : ""
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 h-1.5 w-full rounded-full bg-slate-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "h-1.5 rounded-full bg-emerald-500 transition-all",
                style: { width: `${Math.min(100, Math.max(0, item.progress))}%` }
              }
            ) })
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          ["queued", "downloading"].includes(item.status) ? confirmCancelId === item.id ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => void handleCancel(item.id),
                className: "rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white",
                children: "Confirm"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => setConfirmCancelId(null),
                className: "rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:border-slate-300",
                children: "Keep"
              }
            )
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => setConfirmCancelId(item.id),
              className: "rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:border-slate-300",
              children: "Cancel"
            }
          ) : null,
          ["failed", "canceled"].includes(item.status) ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleRetry(item.id),
              className: "rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white",
              children: "Retry"
            }
          ) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500", children: item.status })
        ] })
      ] }) }, item.id)) })
    ] })
  ] });
}
const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
const PlayIcon = () => /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M8 5v14l11-7z" }) });
const PauseIcon = () => /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M6 19h4V5H6v14zm8-14v14h4V5h-4z" }) });
const VolumeHighIcon = () => /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" }) });
const VolumeMuteIcon = () => /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" }) });
const FullscreenIcon = () => /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" }) });
const ExitFullscreenIcon = () => /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" }) });
const SettingsIcon = () => /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" }) });
const PipIcon = () => /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" }) });
const SkipBackIcon = () => /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" }) });
const SkipForwardIcon = () => /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" }) });
function VideoPlayer({ src, videoId, title, onClose }) {
  const containerRef = reactExports.useRef(null);
  const videoRef = reactExports.useRef(null);
  const controlsTimeoutRef = reactExports.useRef(null);
  const lastSavedRef = reactExports.useRef(0);
  const [savedPosition, setSavedPosition] = reactExports.useState(null);
  const [isPlaying, setIsPlaying] = reactExports.useState(false);
  const [currentTime, setCurrentTime] = reactExports.useState(0);
  const [duration, setDuration] = reactExports.useState(0);
  const [volume, setVolume] = reactExports.useState(1);
  const [playbackRate, setPlaybackRate] = reactExports.useState(1);
  const [isMuted, setIsMuted] = reactExports.useState(false);
  const [isFullscreen, setIsFullscreen] = reactExports.useState(false);
  const [showControls, setShowControls] = reactExports.useState(true);
  const [showSettings, setShowSettings] = reactExports.useState(false);
  const [buffered, setBuffered] = reactExports.useState(0);
  const [isLoading, setIsLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [isPiP, setIsPiP] = reactExports.useState(false);
  reactExports.useEffect(() => {
    let active = true;
    setSavedPosition(null);
    setError(null);
    setIsLoading(true);
    window.api.libraryGetPlayback(videoId).then((result) => {
      if (active && result.ok) {
        setSavedPosition(result.position ?? 0);
      }
    }).catch(() => {
      if (active) {
        setSavedPosition(0);
      }
    });
    return () => {
      active = false;
    };
  }, [videoId]);
  reactExports.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleLoaded = () => {
      const total = Number.isFinite(video.duration) ? video.duration : 0;
      setDuration(total);
      setIsLoading(false);
      if (savedPosition && savedPosition > 0 && savedPosition < total - 1) {
        video.currentTime = savedPosition;
        setCurrentTime(savedPosition);
      }
    };
    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      if (video.buffered.length > 0 && video.duration > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered(bufferedEnd / video.duration * 100);
      }
      if (Math.abs(time - lastSavedRef.current) >= 5) {
        lastSavedRef.current = time;
        void window.api.librarySavePlayback({
          videoId,
          position: time,
          duration: video.duration
        });
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => {
      setIsPlaying(false);
      void window.api.librarySavePlayback({
        videoId,
        position: video.currentTime,
        duration: video.duration
      });
    };
    const handleEnded = () => {
      setIsPlaying(false);
      void window.api.librarySavePlayback({
        videoId,
        position: video.duration,
        duration: video.duration
      });
    };
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setError("Failed to load video. The format may not be supported.");
      setIsLoading(false);
    };
    video.addEventListener("loadedmetadata", handleLoaded);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);
    return () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
    };
  }, [savedPosition, videoId]);
  reactExports.useEffect(() => {
    const video = videoRef.current;
    if (!video || savedPosition == null || savedPosition <= 0) return;
    if (video.readyState >= 1) {
      const total = Number.isFinite(video.duration) ? video.duration : 0;
      const next = total > 1 ? Math.min(savedPosition, total - 1) : savedPosition;
      video.currentTime = next;
      setCurrentTime(next);
    }
  }, [savedPosition]);
  reactExports.useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = isMuted;
    }
  }, [isMuted, volume]);
  reactExports.useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = playbackRate;
    }
  }, [playbackRate]);
  reactExports.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);
  reactExports.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handlePiPEnter = () => setIsPiP(true);
    const handlePiPLeave = () => setIsPiP(false);
    video.addEventListener("enterpictureinpicture", handlePiPEnter);
    video.addEventListener("leavepictureinpicture", handlePiPLeave);
    return () => {
      video.removeEventListener("enterpictureinpicture", handlePiPEnter);
      video.removeEventListener("leavepictureinpicture", handlePiPLeave);
    };
  }, []);
  const togglePlay = reactExports.useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  }, []);
  const handleSeek = reactExports.useCallback((value) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setCurrentTime(value);
  }, []);
  const handleSkip = reactExports.useCallback((delta) => {
    const video = videoRef.current;
    if (!video) return;
    const maxTime = duration || video.duration || 0;
    if (maxTime <= 0) return;
    const next = Math.min(Math.max(video.currentTime + delta, 0), maxTime);
    video.currentTime = next;
    setCurrentTime(next);
  }, [duration]);
  const toggleFullscreen = reactExports.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void container.requestFullscreen();
    }
  }, []);
  const togglePiP = reactExports.useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn("PiP not supported:", err);
    }
  }, []);
  const cyclePlaybackRate = reactExports.useCallback((direction) => {
    const currentIndex = playbackRates.indexOf(playbackRate);
    const nextIndex = Math.max(0, Math.min(playbackRates.length - 1, currentIndex + direction));
    setPlaybackRate(playbackRates[nextIndex]);
  }, [playbackRate]);
  const handleProgressClick = reactExports.useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    handleSeek(newTime);
  }, [duration, handleSeek]);
  reactExports.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const video = videoRef.current;
      if (!video) return;
      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
        case "j":
          e.preventDefault();
          handleSkip(-10);
          break;
        case "arrowright":
        case "l":
          e.preventDefault();
          handleSkip(10);
          break;
        case "arrowup":
          e.preventDefault();
          setVolume((v2) => Math.min(1, v2 + 0.1));
          break;
        case "arrowdown":
          e.preventDefault();
          setVolume((v2) => Math.max(0, v2 - 0.1));
          break;
        case "m":
          e.preventDefault();
          setIsMuted((m2) => !m2);
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "escape":
          if (isFullscreen) {
            void document.exitFullscreen();
          }
          break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          e.preventDefault();
          const percent = parseInt(e.key) * 10;
          video.currentTime = duration * percent / 100;
          break;
        case ",":
          e.preventDefault();
          handleSkip(-1 / 30);
          break;
        case ".":
          e.preventDefault();
          handleSkip(1 / 30);
          break;
        case "<":
          e.preventDefault();
          cyclePlaybackRate(-1);
          break;
        case ">":
          e.preventDefault();
          cyclePlaybackRate(1);
          break;
        case "p":
          e.preventDefault();
          togglePiP();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [duration, isFullscreen, togglePlay, handleSkip, toggleFullscreen, togglePiP, cyclePlaybackRate]);
  const showControlsTemporarily = reactExports.useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3e3);
    }
  }, [isPlaying]);
  reactExports.useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  }, [isPlaying]);
  reactExports.useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (!video) return;
      void window.api.librarySavePlayback({
        videoId,
        position: video.currentTime,
        duration: video.duration
      });
    };
  }, [videoId]);
  const formattedTime = reactExports.useMemo(() => {
    return `${formatTime(currentTime)} / ${formatTime(duration)}`;
  }, [currentTime, duration]);
  const progressPercent = duration > 0 ? currentTime / duration * 100 : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref: containerRef,
      className: `relative overflow-hidden bg-black ${isFullscreen ? "h-screen w-screen" : "rounded-xl"}`,
      onMouseMove: showControlsTemporarily,
      onMouseLeave: () => isPlaying && setShowControls(false),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "video",
          {
            ref: videoRef,
            src,
            className: `w-full bg-black ${isFullscreen ? "h-full object-contain" : "max-h-[520px]"}`,
            onClick: togglePlay,
            playsInline: true,
            preload: "metadata"
          },
          videoId
        ),
        isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" }) }),
        error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/80", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-medium text-red-400", children: error }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-400", children: "Try converting the video to a more compatible format (MP4/H.264)" })
        ] }) }),
        !isPlaying && !isLoading && !error && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: togglePlay,
            className: "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 p-5 backdrop-blur-sm transition hover:bg-white/30",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(PlayIcon, {})
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: `absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-4 pt-16 transition-opacity duration-300 ${showControls ? "opacity-100" : "pointer-events-none opacity-0"}`,
            children: [
              title && isFullscreen && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-4 top-4 text-lg font-medium text-white drop-shadow-lg", children: title }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "group mb-3 h-1.5 cursor-pointer rounded-full bg-white/30",
                  onClick: handleProgressClick,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "absolute h-1.5 rounded-full bg-white/40 transition-all",
                        style: { width: `${buffered}%` }
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "relative h-1.5 rounded-full bg-white transition-all",
                        style: { width: `${progressPercent}%` },
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-2 -top-1 h-3.5 w-3.5 rounded-full bg-white opacity-0 shadow-lg transition group-hover:opacity-100" })
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleSkip(-10),
                      className: "rounded-full p-2 text-white transition hover:bg-white/20",
                      title: "Skip back 10s (J)",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SkipBackIcon, {})
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: togglePlay,
                      className: "rounded-full bg-white p-2.5 text-black transition hover:bg-white/90",
                      title: isPlaying ? "Pause (K)" : "Play (K)",
                      children: isPlaying ? /* @__PURE__ */ jsxRuntimeExports.jsx(PauseIcon, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(PlayIcon, {})
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleSkip(10),
                      className: "rounded-full p-2 text-white transition hover:bg-white/20",
                      title: "Skip forward 10s (L)",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SkipForwardIcon, {})
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group flex items-center", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setIsMuted((m2) => !m2),
                        className: "rounded-full p-2 text-white transition hover:bg-white/20",
                        title: "Mute (M)",
                        children: isMuted || volume === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(VolumeMuteIcon, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(VolumeHighIcon, {})
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "range",
                        min: 0,
                        max: 1,
                        step: 0.05,
                        value: isMuted ? 0 : volume,
                        onChange: (e) => {
                          setVolume(Number(e.target.value));
                          if (Number(e.target.value) > 0) setIsMuted(false);
                        },
                        className: "w-0 origin-left scale-x-0 accent-white transition-all group-hover:w-20 group-hover:scale-x-100"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 text-sm text-white/90", children: formattedTime })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setShowSettings(!showSettings),
                        className: "rounded-full p-2 text-white transition hover:bg-white/20",
                        title: "Settings",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsIcon, {})
                      }
                    ),
                    showSettings && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute bottom-full right-0 mb-2 w-48 rounded-lg bg-slate-900/95 p-2 text-sm shadow-xl backdrop-blur", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 border-b border-white/10 pb-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-1 text-xs font-medium text-white/60", children: "Playback Speed" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-5 gap-1", children: playbackRates.map((rate) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "button",
                          {
                            type: "button",
                            onClick: () => setPlaybackRate(rate),
                            className: `rounded px-1.5 py-1 text-xs transition ${playbackRate === rate ? "bg-white text-black" : "text-white/80 hover:bg-white/10"}`,
                            children: [
                              rate,
                              "x"
                            ]
                          },
                          rate
                        )) })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-white/40", children: "Shortcuts: < / > to change speed" })
                    ] })
                  ] }),
                  document.pictureInPictureEnabled && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: togglePiP,
                      className: `rounded-full p-2 text-white transition hover:bg-white/20 ${isPiP ? "bg-white/20" : ""}`,
                      title: "Picture-in-Picture (P)",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(PipIcon, {})
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: toggleFullscreen,
                      className: "rounded-full p-2 text-white transition hover:bg-white/20",
                      title: "Fullscreen (F)",
                      children: isFullscreen ? /* @__PURE__ */ jsxRuntimeExports.jsx(ExitFullscreenIcon, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(FullscreenIcon, {})
                    }
                  )
                ] })
              ] }),
              isFullscreen && showControls && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 text-center text-[10px] text-white/40", children: "Space/K: Play · J/L: ±10s · ←/→: ±10s · ↑/↓: Volume · M: Mute · F: Fullscreen · 0-9: Seek · ,/.: Frame step" })
            ]
          }
        )
      ]
    }
  );
}
function formatTime(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0:00";
  }
  const total = Math.floor(value);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor(total % 3600 / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
const variantStyles = {
  default: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200"
  },
  suggestion: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200"
  },
  lowConfidence: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200"
  },
  needsReview: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200"
  }
};
const sourceIcons = {
  user: "U",
  suggested: "S",
  ai_refined: "AI",
  imported: "I"
};
function TagChip({
  name,
  section,
  confidence,
  isLocked = false,
  source,
  variant = "default",
  showConfidence = false,
  showLock = true,
  removable = false,
  onRemove,
  onLock,
  onUnlock,
  onClick
}) {
  const [isHovered, setIsHovered] = reactExports.useState(false);
  const styles = variantStyles[variant];
  const confidencePercent = confidence != null ? Math.round(confidence * 100) : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "span",
    {
      className: `
        inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium
        transition-all duration-150
        ${styles.bg} ${styles.text} ${styles.border}
        ${onClick ? "cursor-pointer hover:shadow-sm" : ""}
        ${isLocked ? "ring-1 ring-slate-400 ring-offset-1" : ""}
      `,
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      onClick,
      children: [
        source && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-4 w-4 items-center justify-center rounded-full bg-white/60 text-[9px] font-bold", children: sourceIcons[source] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "max-w-[120px] truncate", children: name }),
        section && isHovered && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-white/50 px-1 text-[9px] uppercase tracking-wide opacity-70", children: section }),
        showConfidence && confidencePercent != null && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "span",
          {
            className: `
            rounded-full px-1.5 py-0.5 text-[10px] font-semibold
            ${confidencePercent >= 70 ? "bg-emerald-200/50 text-emerald-800" : ""}
            ${confidencePercent >= 40 && confidencePercent < 70 ? "bg-amber-200/50 text-amber-800" : ""}
            ${confidencePercent < 40 ? "bg-red-200/50 text-red-800" : ""}
          `,
            children: [
              confidencePercent,
              "%"
            ]
          }
        ),
        showLock && isLocked && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: (e) => {
              e.stopPropagation();
              onUnlock?.();
            },
            className: "flex h-4 w-4 items-center justify-center rounded-full bg-slate-300/50 text-[10px] hover:bg-slate-400/50",
            title: "Unlock tag",
            children: "L"
          }
        ),
        showLock && !isLocked && isHovered && onLock && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: (e) => {
              e.stopPropagation();
              onLock();
            },
            className: "flex h-4 w-4 items-center justify-center rounded-full bg-slate-200/50 text-[10px] hover:bg-slate-300/50",
            title: "Lock tag (protect from regeneration)",
            children: "l"
          }
        ),
        removable && isHovered && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: (e) => {
              e.stopPropagation();
              onRemove?.();
            },
            className: "flex h-4 w-4 items-center justify-center rounded-full bg-red-200/50 text-red-700 hover:bg-red-300/50",
            title: isLocked ? "Force remove locked tag" : "Remove tag",
            children: "x"
          }
        )
      ]
    }
  );
}
function TagSuggestionPanel({
  result,
  isLoading = false,
  onAccept,
  onReject,
  onRegenerate
}) {
  const [activeTab, setActiveTab] = reactExports.useState("accepted");
  const tabs = [
    { id: "accepted", label: "Accepted", count: result.accepted.length },
    { id: "suggested", label: "Suggested", count: result.suggestedLowConfidence.length },
    { id: "review", label: "Review", count: result.needsReview.length },
    { id: "evidence", label: "Evidence", count: result.evidence.similarVideos.length }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-white", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 px-4 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-slate-900", children: "Tag Suggestions" }),
        result.evidence.llmRefined && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-700", children: "AI Refined" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: onRegenerate,
          disabled: isLoading,
          className: "rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200 disabled:opacity-50",
          children: isLoading ? "Generating..." : "Regenerate"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 border-b border-slate-100 px-4", children: tabs.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => setActiveTab(tab.id),
        className: `
              relative px-3 py-2 text-xs font-medium transition
              ${activeTab === tab.id ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}
            `,
        children: [
          tab.label,
          tab.count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: `
                  ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]
                  ${activeTab === tab.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}
                `,
              children: tab.count
            }
          ),
          activeTab === tab.id && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-slate-900" })
        ]
      },
      tab.id
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      activeTab === "accepted" && /* @__PURE__ */ jsxRuntimeExports.jsx(AcceptedTagsView, { tags: result.accepted, onReject }),
      activeTab === "suggested" && /* @__PURE__ */ jsxRuntimeExports.jsx(
        SuggestedTagsView,
        {
          tags: result.suggestedLowConfidence,
          onAccept,
          onReject
        }
      ),
      activeTab === "review" && /* @__PURE__ */ jsxRuntimeExports.jsx(
        SuggestedTagsView,
        {
          tags: result.needsReview,
          onAccept,
          onReject
        }
      ),
      activeTab === "evidence" && /* @__PURE__ */ jsxRuntimeExports.jsx(EvidenceView, { evidence: result.evidence })
    ] }) })
  ] });
}
function AcceptedTagsView({
  tags,
  onReject
}) {
  if (tags.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-4 text-center text-sm text-slate-400", children: "No tags automatically accepted. Check suggested tags." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: "These tags passed the confidence threshold and will be applied:" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: tags.map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TagChip,
        {
          name: tag.tagName,
          section: tag.section,
          confidence: tag.confidence,
          variant: "suggestion",
          showConfidence: true
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => onReject(tag.tagName),
          className: "absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white group-hover:flex",
          title: "Reject this tag",
          children: "x"
        }
      )
    ] }, tag.tagName)) }),
    tags.some((t2) => t2.reason) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-slate-600", children: "AI Reasoning:" }),
      tags.filter((t2) => t2.reason).map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 p-2 text-xs text-slate-600", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
          tag.tagName,
          ":"
        ] }),
        " ",
        tag.reason
      ] }, tag.tagName))
    ] })
  ] });
}
function SuggestedTagsView({
  tags,
  onAccept,
  onReject
}) {
  if (tags.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-4 text-center text-sm text-slate-400", children: "No additional suggestions in this category." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: "Click to accept or reject these suggestions:" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: tags.map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-2",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TagChip,
            {
              name: tag.tagName,
              section: tag.section,
              confidence: tag.confidence,
              variant: "lowConfidence",
              showConfidence: true
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => onAccept(tag.tagName),
                className: "rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-200",
                children: "Accept"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => onReject(tag.tagName),
                className: "rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200",
                children: "Reject"
              }
            )
          ] })
        ]
      },
      tag.tagName
    )) })
  ] });
}
function EvidenceView({
  evidence
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs text-slate-500", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "Based on ",
        evidence.candidatesGenerated,
        " tag candidates"
      ] }),
      evidence.llmRefined && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-purple-600", children: "Refined by local LLM" })
    ] }),
    evidence.similarVideos.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-4 text-center text-sm text-slate-400", children: "No similar videos found in your library yet. Tag more videos to improve suggestions." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-slate-600", children: "Similar Videos:" }),
      evidence.similarVideos.map((video) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "rounded-lg border border-slate-100 bg-slate-50/50 p-3",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-slate-800", children: video.title || "Untitled" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-0.5 text-xs text-slate-500", children: [
                Math.round(video.similarity * 100),
                "% similar"
              ] })
            ] }) }),
            video.tags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap gap-1", children: [
              video.tags.slice(0, 8).map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: "rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-600",
                  children: tag
                },
                tag
              )),
              video.tags.length > 8 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-slate-400", children: [
                "+",
                video.tags.length - 8,
                " more"
              ] })
            ] })
          ]
        },
        video.videoId
      ))
    ] })
  ] });
}
function VideoTagManager({
  videoId,
  videoTitle,
  videoDescription,
  tags,
  taxonomy,
  suggestions,
  isIndexed,
  isIndexing,
  isSuggesting,
  llmAvailable,
  onIndex,
  onSuggest,
  onAcceptTag,
  onRejectTag,
  onAddTag,
  onRemoveTag,
  onLockTag,
  onUnlockTag,
  onRegenerate
}) {
  const [showAddTag, setShowAddTag] = reactExports.useState(false);
  const [tagSearch, setTagSearch] = reactExports.useState("");
  const [useLLM, setUseLLM] = reactExports.useState(true);
  const filteredTaxonomyTags = reactExports.useMemo(() => {
    if (!taxonomy || !tagSearch) return [];
    const existingTagNames = new Set(tags.map((t2) => t2.name.toLowerCase()));
    const allTags = [];
    for (const [section, tagNames] of Object.entries(taxonomy.sections)) {
      for (const name of tagNames) {
        if (!existingTagNames.has(name.toLowerCase())) {
          allTags.push({ name, section });
        }
      }
    }
    const search = tagSearch.toLowerCase();
    return allTags.filter((t2) => t2.name.toLowerCase().includes(search)).slice(0, 10);
  }, [taxonomy, tagSearch, tags]);
  const handleAddTag = reactExports.useCallback(
    (tagName) => {
      onAddTag(tagName);
      setTagSearch("");
      setShowAddTag(false);
    },
    [onAddTag]
  );
  const tagsBySection = tags.reduce(
    (acc, tag) => {
      const section = tag.section || "Other";
      if (!acc[section]) acc[section] = [];
      acc[section].push(tag);
      return acc;
    },
    {}
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-slate-900", children: "Video Analysis" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-slate-500", children: isIndexed ? "Video has been indexed for smart tagging" : "Index this video to enable smart tag suggestions" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: isIndexed ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700", children: "Indexed" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: onIndex,
            disabled: isIndexing,
            className: "rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-50",
            children: isIndexing ? "Indexing..." : "Index Video"
          }
        ) })
      ] }),
      isIndexed && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-between border-t border-slate-100 pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-xs text-slate-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: useLLM,
              onChange: (e) => setUseLLM(e.target.checked),
              disabled: !llmAvailable,
              className: "rounded border-slate-300"
            }
          ),
          "Use LLM refinement",
          !llmAvailable && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-amber-600", children: "(LM Studio not running)" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => onSuggest(useLLM && llmAvailable),
            disabled: isSuggesting,
            className: "rounded-lg bg-purple-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-purple-700 disabled:opacity-50",
            children: isSuggesting ? "Analyzing..." : "Get Suggestions"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-slate-900", children: [
          "Current Tags",
          tags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500", children: tags.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setShowAddTag(!showAddTag),
            className: "rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200",
            children: showAddTag ? "Cancel" : "+ Add Tag"
          }
        )
      ] }),
      showAddTag && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: tagSearch,
            onChange: (e) => setTagSearch(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter" && tagSearch.trim()) {
                handleAddTag(tagSearch.trim());
              }
            },
            placeholder: "Search or create custom tag...",
            className: "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none",
            autoFocus: true
          }
        ),
        tagSearch && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white", children: [
          tagSearch.trim() && !filteredTaxonomyTags.some((t2) => t2.name.toLowerCase() === tagSearch.trim().toLowerCase()) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => handleAddTag(tagSearch.trim()),
              className: "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-purple-50 border-b border-slate-100 bg-purple-50/50",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-purple-600 font-medium", children: "Create:" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: tagSearch.trim().toLowerCase().replace(/\s+/g, "-") })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-purple-500", children: "Custom" })
              ]
            }
          ),
          filteredTaxonomyTags.map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => handleAddTag(tag.name),
              className: "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: tag.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-400", children: tag.section })
              ]
            },
            tag.name
          )),
          filteredTaxonomyTags.length === 0 && !tagSearch.trim() && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-3 py-2 text-sm text-slate-400", children: "No matching tags in taxonomy" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: "Press Enter to add custom tags. Custom tags will be added to the learning system." })
      ] }),
      tags.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-4 text-sm text-slate-400", children: [
        "No tags yet. ",
        isIndexed ? "Get suggestions or add tags manually." : "Index the video first."
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 space-y-4", children: Object.entries(tagsBySection).map(([section, sectionTags]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 text-xs font-medium uppercase tracking-wide text-slate-400", children: section }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: sectionTags.map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          TagChip,
          {
            name: tag.name,
            section: tag.section,
            confidence: tag.confidence,
            isLocked: tag.isLocked,
            source: tag.source,
            showConfidence: tag.confidence != null,
            showLock: true,
            removable: true,
            onLock: () => onLockTag(tag.name),
            onUnlock: () => onUnlockTag(tag.name),
            onRemove: () => {
              if (tag.isLocked) {
                if (window.confirm(`"${tag.name}" is locked. Remove anyway?`)) {
                  onRemoveTag(tag.name, true);
                }
              } else {
                onRemoveTag(tag.name, false);
              }
            }
          },
          tag.name
        )) })
      ] }, section)) })
    ] }),
    suggestions && /* @__PURE__ */ jsxRuntimeExports.jsx(
      TagSuggestionPanel,
      {
        result: suggestions,
        isLoading: isSuggesting,
        onAccept: onAcceptTag,
        onReject: onRejectTag,
        onRegenerate
      }
    )
  ] });
}
function Library() {
  const downloads = useDownloadsStore((state) => state.downloads);
  const startPolling = useDownloadsStore((state) => state.startPolling);
  const stopPolling = useDownloadsStore((state) => state.stopPolling);
  const startRealtime = useDownloadsStore((state) => state.startRealtime);
  const stopRealtime = useDownloadsStore((state) => state.stopRealtime);
  const [videos, setVideos] = reactExports.useState([]);
  const [selectedVideoId, setSelectedVideoId] = reactExports.useState(null);
  const [libraryError, setLibraryError] = reactExports.useState(null);
  const [scanStatus, setScanStatus] = reactExports.useState(null);
  const [isScanning, setIsScanning] = reactExports.useState(false);
  const [scanId, setScanId] = reactExports.useState(null);
  const [scanProgress, setScanProgress] = reactExports.useState(null);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const deferredSearchQuery = reactExports.useDeferredValue(searchQuery);
  const [containerFilter, setContainerFilter] = reactExports.useState("all");
  const listRef = reactExports.useRef(null);
  const [scrollTop, setScrollTop] = reactExports.useState(0);
  const [viewportHeight, setViewportHeight] = reactExports.useState(520);
  const scanIdRef = reactExports.useRef(null);
  const [privacySettings, setPrivacySettings] = reactExports.useState(null);
  const [privacyError, setPrivacyError] = reactExports.useState(null);
  const [showHidden, setShowHidden] = reactExports.useState(false);
  const [hiddenPin, setHiddenPin] = reactExports.useState("");
  const [hiddenPinError, setHiddenPinError] = reactExports.useState(null);
  const [hiddenUnlocked, setHiddenUnlocked] = reactExports.useState(false);
  const [integrityResult, setIntegrityResult] = reactExports.useState(null);
  const [integrityStatus, setIntegrityStatus] = reactExports.useState(null);
  const [integrityError, setIntegrityError] = reactExports.useState(null);
  const [isIntegrityScanning, setIsIntegrityScanning] = reactExports.useState(false);
  const [isIntegrityFixing, setIsIntegrityFixing] = reactExports.useState(false);
  const [confirmIntegrityFix, setConfirmIntegrityFix] = reactExports.useState(false);
  const [stats, setStats] = reactExports.useState(null);
  const [statsError, setStatsError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    startPolling(15e3);
    startRealtime();
    return () => {
      stopPolling();
      stopRealtime();
    };
  }, [startPolling, startRealtime, stopPolling, stopRealtime]);
  reactExports.useEffect(() => {
    let active = true;
    window.api.privacyGetSettings().then((result) => {
      if (!active) {
        return;
      }
      if (result.ok && result.settings) {
        setPrivacySettings(result.settings);
        setPrivacyError(null);
      } else {
        setPrivacyError(result.error ?? "Unable to load privacy settings.");
      }
    }).catch((error) => {
      if (active) {
        setPrivacyError(error instanceof Error ? error.message : "Unable to load privacy settings.");
      }
    });
    return () => {
      active = false;
    };
  }, []);
  reactExports.useEffect(() => {
    if (!privacySettings?.hiddenFolderEnabled) {
      setShowHidden(false);
      setHiddenUnlocked(false);
      setHiddenPin("");
      setHiddenPinError(null);
    }
  }, [privacySettings?.hiddenFolderEnabled]);
  const handleUnlockHidden = async () => {
    if (!hiddenPin.trim()) {
      setHiddenPinError("Enter your PIN to unlock hidden items.");
      return;
    }
    try {
      const result = await window.api.privacyVerifyPin(hiddenPin.trim());
      if (result.ok && result.valid) {
        setHiddenUnlocked(true);
        setShowHidden(true);
        setHiddenPin("");
        setHiddenPinError(null);
      } else {
        setHiddenPinError("Incorrect PIN.");
      }
    } catch (error) {
      setHiddenPinError(error instanceof Error ? error.message : "Unable to verify PIN.");
    }
  };
  const recentDownloads = reactExports.useMemo(() => downloads.slice(0, 3), [downloads]);
  const completedCount = reactExports.useMemo(
    () => downloads.filter((item) => item.status === "completed").length,
    [downloads]
  );
  const inProgressCount = reactExports.useMemo(
    () => downloads.filter((item) => ["queued", "downloading"].includes(item.status)).length,
    [downloads]
  );
  const activityFeed = reactExports.useMemo(() => {
    const sorted = [...downloads].sort((a, b) => {
      const aTime = new Date(a.updatedAt ?? a.createdAt).getTime();
      const bTime = new Date(b.updatedAt ?? b.createdAt).getTime();
      return bTime - aTime;
    });
    return sorted.slice(0, 5).map((item) => ({
      id: item.id,
      status: item.status,
      title: item.url,
      timestamp: item.updatedAt ?? item.createdAt
    }));
  }, [downloads]);
  const formatBytes = (bytes) => {
    if (!bytes || bytes <= 0) {
      return null;
    }
    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, index);
    return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
  };
  const formatDuration2 = (seconds) => {
    if (!seconds || seconds <= 0) {
      return null;
    }
    const total = Math.floor(seconds);
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor(total % 3600 / 60);
    const secs = total % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };
  const formatTotalDuration = (seconds) => {
    if (!seconds || seconds <= 0) {
      return null;
    }
    const hrs = Math.floor(seconds / 3600);
    if (hrs >= 1) {
      return `${hrs}h`;
    }
    return formatDuration2(seconds);
  };
  const formatBitrate = (bitrate) => {
    if (!bitrate || bitrate <= 0) {
      return null;
    }
    const kbps = bitrate / 1e3;
    if (kbps < 1e3) {
      return `${Math.round(kbps)} Kbps`;
    }
    const mbps = kbps / 1e3;
    return `${mbps.toFixed(mbps >= 10 ? 0 : 1)} Mbps`;
  };
  const formatResolutionLabel = (width, height) => {
    if (!width || !height) {
      return null;
    }
    const standards = [2160, 1440, 1080, 720, 480, 360, 240];
    const nearest = standards.reduce(
      (best, current) => Math.abs(height - current) < Math.abs(height - best) ? current : best
    );
    const label = Math.abs(height - nearest) <= 120 ? `${nearest}p` : `${height}p`;
    return `${width}x${height} (${label})`;
  };
  const formatMetadataLine = (video) => {
    const line = [
      formatDuration2(video.duration),
      formatBytes(video.file_size),
      formatResolutionLabel(video.width, video.height),
      video.container ? video.container.toUpperCase() : null,
      video.codec ? video.codec.toUpperCase() : null,
      formatBitrate(video.bitrate)
    ].filter(Boolean).join(" · ");
    return line || null;
  };
  const loadLibrary = reactExports.useCallback(async () => {
    try {
      const result = await window.api.libraryList(showHidden);
      if (result.ok) {
        setVideos(result.videos);
        setLibraryError(null);
      } else {
        setLibraryError("Unable to load library.");
      }
    } catch (err) {
      setLibraryError(err instanceof Error ? err.message : "Unable to load library.");
    }
  }, [showHidden]);
  reactExports.useEffect(() => {
    void loadLibrary();
  }, [completedCount, loadLibrary]);
  reactExports.useEffect(() => {
    let active = true;
    window.api.libraryStats().then((result) => {
      if (!active) {
        return;
      }
      if (result.ok && result.stats) {
        setStats(result.stats);
        setStatsError(null);
      } else {
        setStatsError(result.error ?? "Unable to load library stats.");
      }
    }).catch((error) => {
      if (active) {
        setStatsError(error instanceof Error ? error.message : "Unable to load library stats.");
      }
    });
    return () => {
      active = false;
    };
  }, [videos.length, completedCount]);
  reactExports.useEffect(() => {
    scanIdRef.current = scanId;
  }, [scanId]);
  reactExports.useEffect(() => {
    const unsubscribeProgress = window.api.onLibraryScanProgress((payload) => {
      if (scanIdRef.current && payload.scanId === scanIdRef.current) {
        setScanProgress(payload);
      }
    });
    const unsubscribeComplete = window.api.onLibraryScanComplete((payload) => {
      if (!scanIdRef.current || payload.scanId !== scanIdRef.current) {
        return;
      }
      setIsScanning(false);
      setScanId(null);
      setScanProgress(null);
      if (!payload.ok || !payload.result) {
        setLibraryError(payload.error ?? "Library scan failed.");
        return;
      }
      const summary = payload.result.canceled ? `Scan canceled · Found ${payload.result.found} files · Added ${payload.result.inserted}` : `Found ${payload.result.found} files · Added ${payload.result.inserted} · Updated ${payload.result.updated} · Errors ${payload.result.errors}`;
      setScanStatus(summary);
      void loadLibrary();
    });
    return () => {
      unsubscribeProgress();
      unsubscribeComplete();
    };
  }, [loadLibrary]);
  const containerOptions = reactExports.useMemo(() => {
    const containers = /* @__PURE__ */ new Set();
    for (const video of videos) {
      if (video.container) {
        containers.add(video.container.toLowerCase());
      }
    }
    return Array.from(containers).sort();
  }, [videos]);
  const filteredVideos = reactExports.useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    return videos.filter((video) => {
      if (containerFilter !== "all") {
        if (!video.container || video.container.toLowerCase() !== containerFilter) {
          return false;
        }
      }
      if (!query) {
        return true;
      }
      const haystack = [
        video.title,
        video.file_name,
        video.file_path
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [containerFilter, deferredSearchQuery, videos]);
  reactExports.useEffect(() => {
    const updateSize = () => {
      if (listRef.current) {
        setViewportHeight(listRef.current.clientHeight);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);
  reactExports.useEffect(() => {
    if (filteredVideos.length === 0) {
      setSelectedVideoId(null);
      return;
    }
    const stillVisible = selectedVideoId && filteredVideos.some((video) => video.id === selectedVideoId);
    if (!stillVisible) {
      setSelectedVideoId(filteredVideos[0].id);
    }
  }, [filteredVideos, selectedVideoId]);
  const selectedVideo = reactExports.useMemo(
    () => filteredVideos.find((video) => video.id === selectedVideoId) ?? null,
    [filteredVideos, selectedVideoId]
  );
  const handleScanLibrary = async () => {
    setIsScanning(true);
    setLibraryError(null);
    setScanStatus(null);
    setScanProgress(null);
    try {
      const selection = await window.api.librarySelectFolder();
      if (!selection.ok || !selection.path) {
        if (!selection.canceled) {
          setLibraryError(selection.error ?? "Unable to select a folder.");
        }
        setIsScanning(false);
        return;
      }
      const result = await window.api.libraryScanStart(selection.path);
      if (!result.ok || !result.scanId) {
        setLibraryError(result.error ?? "Unable to start library scan.");
        setIsScanning(false);
        return;
      }
      setScanId(result.scanId);
      scanIdRef.current = result.scanId;
    } catch (err) {
      setLibraryError(err instanceof Error ? err.message : "Library scan failed.");
      setIsScanning(false);
    }
  };
  const handleCancelScan = async () => {
    if (!scanId) {
      return;
    }
    try {
      const result = await window.api.libraryScanCancel(scanId);
      if (!result.ok) {
        setLibraryError(result.error ?? "Unable to cancel scan.");
      }
    } catch (err) {
      setLibraryError(err instanceof Error ? err.message : "Unable to cancel scan.");
    }
  };
  const handleIntegrityScan = async () => {
    setIsIntegrityScanning(true);
    setIntegrityStatus(null);
    setIntegrityError(null);
    setIntegrityResult(null);
    setConfirmIntegrityFix(false);
    try {
      const result = await window.api.libraryIntegrityScan();
      if (result.ok) {
        setIntegrityResult(result);
      } else {
        setIntegrityError(result.error ?? "Unable to run integrity scan.");
      }
    } catch (error) {
      setIntegrityError(error instanceof Error ? error.message : "Unable to run integrity scan.");
    } finally {
      setIsIntegrityScanning(false);
    }
  };
  const handleIntegrityFix = async () => {
    if (!integrityResult?.ok) {
      return;
    }
    const missingVideoIds = integrityResult.missingVideos?.map((item) => item.id) ?? [];
    const missingDownloadIds = integrityResult.missingDownloads?.map((item) => item.id) ?? [];
    if (missingVideoIds.length === 0 && missingDownloadIds.length === 0) {
      setIntegrityStatus("No missing entries to fix.");
      setConfirmIntegrityFix(false);
      return;
    }
    setIsIntegrityFixing(true);
    setIntegrityStatus(null);
    setIntegrityError(null);
    try {
      const result = await window.api.libraryIntegrityFix({ missingVideoIds, missingDownloadIds });
      if (result.ok) {
        setIntegrityStatus(
          `Removed ${result.removedVideos ?? 0} missing videos · Marked ${result.markedDownloads ?? 0} downloads.`
        );
        setIntegrityResult(null);
        setConfirmIntegrityFix(false);
        void loadLibrary();
      } else {
        setIntegrityError(result.error ?? "Unable to apply integrity fixes.");
      }
    } catch (error) {
      setIntegrityError(error instanceof Error ? error.message : "Unable to apply integrity fixes.");
    } finally {
      setIsIntegrityFixing(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "grid gap-4 lg:grid-cols-3", children: [
      { label: "Downloads completed", value: completedCount.toString(), note: "Ready for library scan" },
      { label: "Downloads active", value: inProgressCount.toString(), note: "Queued or running" },
      { label: "AI tags ready", value: "--", note: "No processed videos yet" }
    ].map((card) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: card.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-3xl font-semibold text-slate-900", children: card.value }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: card.note })
    ] }, card.label)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "grid gap-4 lg:grid-cols-4", children: [
      [
        {
          label: "Total videos",
          value: stats?.videoCount ?? 0,
          note: stats?.hiddenCount ? `${stats.hiddenCount} hidden` : "Visible by default"
        },
        {
          label: "Total duration",
          value: formatTotalDuration(stats?.totalDuration ?? 0) ?? "--",
          note: "Across all videos"
        },
        {
          label: "Library size",
          value: formatBytes(stats?.totalSize ?? 0) ?? "--",
          note: "Stored on disk"
        },
        {
          label: "Failed downloads",
          value: stats?.downloads.failed ?? 0,
          note: "Check queue for details"
        }
      ].map((card) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: card.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-2xl font-semibold text-slate-900", children: card.value }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: card.note })
      ] }, card.label)),
      statsError ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600", children: statsError }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "grid gap-6 lg:grid-cols-[1.2fr_0.8fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Library timeline" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Once scans run, you will see recently ingested videos, AI outputs, and processing activity here." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-4", children: [
          recentDownloads.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: ["Scan a folder to populate your collection", "Track metadata + thumbnails", "Attach AI tags & notes"].map(
            (item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-center gap-3 rounded-xl border border-dashed border-slate-200 px-4 py-3",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg", children: "-" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-600", children: item })
                ]
              },
              item
            )
          ) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: recentDownloads.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 px-4 py-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-semibold text-slate-900", children: item.url }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-slate-400", children: [
              item.status,
              " · ",
              new Date(item.createdAt).toLocaleString()
            ] })
          ] }, item.id)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Recent files" }),
            libraryError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-rose-600", children: libraryError }) : videos.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: "No completed files yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 space-y-2", children: videos.slice(0, 3).map((video) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-white px-3 py-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-semibold text-slate-900", children: video.title ?? video.file_name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 truncate text-xs text-slate-400", children: video.file_path }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: formatMetadataLine(video) ?? "Metadata pending" })
            ] }, video.id)) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-slate-900 p-6 text-white shadow-lg shadow-slate-900/20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold", children: "Activity feed" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-300", children: "Latest download and processing events." })
        ] }),
        activityFeed.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-slate-300", children: "No recent activity" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: activityFeed.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-semibold text-white", children: item.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-slate-300", children: [
            item.status,
            " · ",
            new Date(item.timestamp).toLocaleString()
          ] })
        ] }, item.id)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "mt-auto w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900",
            children: "Open activity log"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "grid gap-6 lg:grid-cols-[1fr_1.2fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Library catalog" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500", children: videos.length ? `${filteredVideos.length} / ${videos.length}` : "Empty" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => void handleScanLibrary(),
                className: "rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600",
                disabled: isScanning,
                children: isScanning ? "Scanning..." : "Scan folder"
              }
            ),
            isScanning && scanId ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => void handleCancelScan(),
                className: "rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600",
                children: "Cancel"
              }
            ) : null
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Select a video to inspect metadata and smart tags." }),
        scanStatus ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xs text-emerald-600", children: scanStatus }) : null,
        libraryError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-rose-600", children: libraryError }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400", children: "Library integrity" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Check for missing files and stale downloads." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => void handleIntegrityScan(),
                  className: "rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600",
                  disabled: isIntegrityScanning,
                  children: isIntegrityScanning ? "Scanning..." : "Run scan"
                }
              ),
              integrityResult?.summary && (integrityResult.summary.missingVideos > 0 || integrityResult.summary.missingDownloads > 0) ? confirmIntegrityFix ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => void handleIntegrityFix(),
                    className: "rounded-full bg-rose-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white",
                    disabled: isIntegrityFixing,
                    children: isIntegrityFixing ? "Fixing..." : "Confirm"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setConfirmIntegrityFix(false),
                    className: "rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600",
                    children: "Cancel"
                  }
                )
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setConfirmIntegrityFix(true),
                  className: "rounded-full border border-rose-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-600",
                  children: "Fix missing"
                }
              ) : null
            ] })
          ] }),
          integrityStatus ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-emerald-600", children: integrityStatus }) : null,
          integrityError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-rose-600", children: integrityError }) : null,
          integrityResult?.summary ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 text-[11px] text-slate-500", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                integrityResult.summary.missingVideos,
                " missing videos"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                integrityResult.summary.missingDownloads,
                " missing downloads"
              ] })
            ] }),
            integrityResult.missingVideos && integrityResult.missingVideos.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: integrityResult.missingVideos.slice(0, 3).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "truncate text-[11px] text-slate-400", children: [
              "Missing: ",
              item.title ?? item.file_name ?? item.file_path
            ] }, item.id)) }) : null,
            integrityResult.missingDownloads && integrityResult.missingDownloads.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: integrityResult.missingDownloads.slice(0, 3).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "truncate text-[11px] text-slate-400", children: [
              "Download missing: ",
              item.url
            ] }, item.id)) }) : null
          ] }) : null
        ] }),
        isScanning && scanProgress ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              scanProgress.processed,
              " / ",
              scanProgress.found,
              " processed"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "+",
              scanProgress.inserted,
              " · ",
              scanProgress.updated,
              " updated · ",
              scanProgress.errors,
              " errors"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "h-full rounded-full bg-slate-900 transition-all",
              style: {
                width: `${scanProgress.found > 0 ? Math.min(100, Math.round(scanProgress.processed / scanProgress.found * 100)) : 0}%`
              }
            }
          ) }),
          scanProgress.currentPath ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 truncate text-[11px] text-slate-400", children: scanProgress.currentPath }) : null
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid gap-3 lg:grid-cols-[1fr_180px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: searchQuery,
              onChange: (event) => setSearchQuery(event.target.value),
              placeholder: "Search title or path",
              className: "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 outline-none focus:border-slate-400"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: containerFilter,
              onChange: (event) => setContainerFilter(event.target.value),
              className: "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All formats" }),
                containerOptions.map((container) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: container, children: container.toUpperCase() }, container))
              ]
            }
          )
        ] }),
        privacySettings?.hiddenFolderEnabled ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  checked: showHidden,
                  onChange: (event) => {
                    const next = event.target.checked;
                    setShowHidden(next);
                    if (!next) {
                      setHiddenUnlocked(false);
                      setHiddenPin("");
                      setHiddenPinError(null);
                    }
                  },
                  disabled: (privacySettings?.pinSet ?? false) && !hiddenUnlocked,
                  className: "h-3.5 w-3.5 rounded border-slate-300 text-slate-900"
                }
              ),
              "Show hidden items"
            ] }),
            (privacySettings?.pinSet ?? false) && !hiddenUnlocked ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "password",
                  value: hiddenPin,
                  onChange: (event) => setHiddenPin(event.target.value),
                  placeholder: "PIN",
                  className: "w-32 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => void handleUnlockHidden(),
                  className: "rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600",
                  children: "Unlock"
                }
              )
            ] }) : null
          ] }),
          hiddenPinError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-rose-500", children: hiddenPinError }) : null
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 space-y-3", children: filteredVideos.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400", children: videos.length === 0 ? "No videos in the library yet." : "No videos match this filter." }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            ref: listRef,
            className: "max-h-[520px] overflow-y-auto pr-1",
            onScroll: (event) => {
              setScrollTop(event.currentTarget.scrollTop);
            },
            children: (() => {
              const itemHeight = 104;
              const overscan = 6;
              const totalHeight = filteredVideos.length * itemHeight;
              const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
              const endIndex = Math.min(
                filteredVideos.length,
                Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan
              );
              const visibleItems = filteredVideos.slice(startIndex, endIndex);
              const offsetY = startIndex * itemHeight;
              return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: totalHeight, position: "relative" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "absolute left-0 right-0 space-y-2",
                  style: { transform: `translateY(${offsetY}px)` },
                  children: visibleItems.map((video) => {
                    const isSelected = video.id === selectedVideoId;
                    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => setSelectedVideoId(video.id),
                        className: `h-[96px] w-full rounded-xl border px-4 py-3 text-left transition ${isSelected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"}`,
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-semibold", children: video.title ?? video.file_name ?? "Untitled" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `mt-1 truncate text-xs ${isSelected ? "text-slate-200" : "text-slate-400"}`, children: video.file_path }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `mt-1 text-xs ${isSelected ? "text-slate-200" : "text-slate-500"}`, children: formatMetadataLine(video) ?? "Metadata pending" }),
                          video.is_hidden ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "span",
                            {
                              className: `mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`,
                              children: "Hidden"
                            }
                          ) : null
                        ]
                      },
                      video.id
                    );
                  })
                }
              ) });
            })()
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Video details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Review file metadata, manage tags, and trigger smart tagging analysis." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5", children: selectedVideo ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          LibraryVideoDetails,
          {
            video: selectedVideo,
            formatMetadataLine,
            showPreview: privacySettings?.showThumbnails ?? true,
            privacyError,
            onRefresh: () => void loadLibrary()
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400", children: "Select a video from the catalog to see details." }) })
      ] })
    ] })
  ] });
}
function LibraryVideoDetails({
  video,
  formatMetadataLine,
  showPreview,
  privacyError,
  onRefresh
}) {
  const {
    tags,
    isIndexed,
    frameCount,
    suggestions,
    taxonomy,
    llmAvailable,
    isIndexing,
    isSuggesting,
    index,
    suggest,
    regenerate,
    acceptTag,
    rejectTag,
    addTag,
    removeTag,
    lockTag,
    unlockTag
  } = useVideoSmartTagging(video.id, video.file_path);
  const [actionStatus, setActionStatus] = reactExports.useState(null);
  const [actionError, setActionError] = reactExports.useState(null);
  const [isMutating, setIsMutating] = reactExports.useState(false);
  const [confirmDelete, setConfirmDelete] = reactExports.useState(false);
  const [summaryStatus, setSummaryStatus] = reactExports.useState(null);
  const [summaryError, setSummaryError] = reactExports.useState(null);
  const [isSummarizing, setIsSummarizing] = reactExports.useState(false);
  const [transcriptText, setTranscriptText] = reactExports.useState("");
  const [transcriptDraft, setTranscriptDraft] = reactExports.useState("");
  const [transcriptStatus, setTranscriptStatus] = reactExports.useState(null);
  const [transcriptError, setTranscriptError] = reactExports.useState(null);
  const [isTranscriptLoading, setIsTranscriptLoading] = reactExports.useState(false);
  const [isTranscriptSaving, setIsTranscriptSaving] = reactExports.useState(false);
  const [isTranscriptCleaning, setIsTranscriptCleaning] = reactExports.useState(false);
  const [captionStatus, setCaptionStatus] = reactExports.useState(null);
  const [captionError, setCaptionError] = reactExports.useState(null);
  const [isCaptionExporting, setIsCaptionExporting] = reactExports.useState(false);
  const [exportTarget, setExportTarget] = reactExports.useState(null);
  const [exportTranscript, setExportTranscript] = reactExports.useState(true);
  const [exportSummary, setExportSummary] = reactExports.useState(false);
  const [exportCaptions, setExportCaptions] = reactExports.useState(true);
  const [exportMetadata, setExportMetadata] = reactExports.useState(false);
  const [exportStatus, setExportStatus] = reactExports.useState(null);
  const [exportError, setExportError] = reactExports.useState(null);
  const [isExporting, setIsExporting] = reactExports.useState(false);
  const isHidden = Boolean(video.is_hidden);
  reactExports.useEffect(() => {
    setActionStatus(null);
    setActionError(null);
    setConfirmDelete(false);
    setSummaryStatus(null);
    setSummaryError(null);
    setTranscriptStatus(null);
    setTranscriptError(null);
    setCaptionStatus(null);
    setCaptionError(null);
    setExportStatus(null);
    setExportError(null);
  }, [video.id]);
  reactExports.useEffect(() => {
    let active = true;
    setIsTranscriptLoading(true);
    window.api.libraryGetTranscript(video.id).then((result) => {
      if (!active) {
        return;
      }
      if (result.ok) {
        const text = result.transcript ?? "";
        setTranscriptText(text);
        setTranscriptDraft(text);
        setTranscriptError(null);
      } else {
        setTranscriptError(result.error ?? "Unable to load transcript.");
      }
    }).catch((error) => {
      if (active) {
        setTranscriptError(error instanceof Error ? error.message : "Unable to load transcript.");
      }
    }).finally(() => {
      if (active) {
        setIsTranscriptLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [video.id]);
  const handleToggleHidden = async () => {
    setIsMutating(true);
    setActionStatus(null);
    setActionError(null);
    try {
      const result = await window.api.librarySetHidden({
        videoId: video.id,
        hidden: !isHidden
      });
      if (result.ok) {
        setActionStatus(isHidden ? "Removed from hidden items." : "Marked as hidden.");
        onRefresh();
      } else {
        setActionError(result.error ?? "Unable to update hidden status.");
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to update hidden status.");
    } finally {
      setIsMutating(false);
    }
  };
  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setIsMutating(true);
    setActionStatus(null);
    setActionError(null);
    try {
      const result = await window.api.libraryDeleteVideo({ videoId: video.id });
      if (result.ok) {
        setActionStatus("Video deleted from library.");
        onRefresh();
      } else {
        setActionError(result.error ?? "Unable to delete video.");
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to delete video.");
    } finally {
      setIsMutating(false);
      setConfirmDelete(false);
    }
  };
  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummaryStatus(null);
    setSummaryError(null);
    try {
      const result = await window.api.llmSummarizeVideo(video.id);
      if (result.ok) {
        setSummaryStatus("Summary generated.");
        onRefresh();
      } else {
        setSummaryError(result.error ?? "Unable to generate summary.");
      }
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : "Unable to generate summary.");
    } finally {
      setIsSummarizing(false);
    }
  };
  const handleSaveTranscript = async () => {
    setTranscriptStatus(null);
    setTranscriptError(null);
    setIsTranscriptSaving(true);
    try {
      const result = await window.api.libraryUpdateTranscript({
        videoId: video.id,
        transcript: transcriptDraft
      });
      if (result.ok) {
        setTranscriptText(transcriptDraft);
        setTranscriptStatus("Transcript saved.");
      } else {
        setTranscriptError(result.error ?? "Unable to save transcript.");
      }
    } catch (error) {
      setTranscriptError(error instanceof Error ? error.message : "Unable to save transcript.");
    } finally {
      setIsTranscriptSaving(false);
    }
  };
  const handleCleanupTranscript = async () => {
    setIsTranscriptCleaning(true);
    setTranscriptStatus(null);
    setTranscriptError(null);
    try {
      const result = await window.api.llmCleanupTranscript(video.id);
      if (result.ok && result.transcript !== void 0) {
        setTranscriptDraft(result.transcript);
        setTranscriptStatus("Transcript cleaned. Review and save.");
      } else {
        setTranscriptError(result.error ?? "Unable to clean transcript.");
      }
    } catch (error) {
      setTranscriptError(error instanceof Error ? error.message : "Unable to clean transcript.");
    } finally {
      setIsTranscriptCleaning(false);
    }
  };
  const handleExportCaptions = async () => {
    setIsCaptionExporting(true);
    setCaptionStatus(null);
    setCaptionError(null);
    try {
      const result = await window.api.libraryExportCaptions({ videoId: video.id });
      if (result.ok && result.path) {
        setCaptionStatus("Captions exported.");
        await window.api.revealInFolder(result.path);
      } else {
        setCaptionError(result.error ?? "Unable to export captions.");
      }
    } catch (error) {
      setCaptionError(error instanceof Error ? error.message : "Unable to export captions.");
    } finally {
      setIsCaptionExporting(false);
    }
  };
  const handleSelectExportFolder = async () => {
    try {
      const result = await window.api.librarySelectExportFolder();
      if (result.ok && result.path) {
        setExportTarget(result.path);
        setExportError(null);
      } else if (!result.canceled) {
        setExportError(result.error ?? "Unable to select export folder.");
      }
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Unable to select export folder.");
    }
  };
  const handleExportAssets = async () => {
    setIsExporting(true);
    setExportStatus(null);
    setExportError(null);
    try {
      const result = await window.api.libraryExportAssets({
        videoId: video.id,
        includeTranscript: exportTranscript,
        includeSummary: exportSummary,
        includeCaptions: exportCaptions,
        includeMetadata: exportMetadata,
        targetDir: exportTarget
      });
      if (result.ok) {
        setExportStatus(`Exported ${result.files?.length ?? 0} files.`);
      } else {
        setExportError(result.error ?? "Unable to export assets.");
      }
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Unable to export assets.");
    } finally {
      setIsExporting(false);
    }
  };
  const videoSrc = reactExports.useMemo(() => {
    try {
      return window.api.toFileUrl(video.file_path);
    } catch {
      return null;
    }
  }, [video.file_path]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Selected video" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm font-semibold text-slate-900", children: video.title ?? video.file_name ?? "Untitled" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 truncate text-xs text-slate-500", children: video.file_path }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-slate-600", children: formatMetadataLine(video) ?? "Metadata pending" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-slate-400", children: isIndexed ? `Indexed frames: ${frameCount ?? "unknown"}` : "Not indexed yet" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => void handleToggleHidden(),
            className: "rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600",
            disabled: isMutating,
            children: isHidden ? "Unhide" : "Hide"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => void handleDelete(),
            className: `rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${confirmDelete ? "bg-rose-600 text-white" : "border border-rose-200 text-rose-600"}`,
            disabled: isMutating,
            children: confirmDelete ? "Confirm delete" : "Delete"
          }
        ),
        confirmDelete ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setConfirmDelete(false),
            className: "rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600",
            children: "Cancel"
          }
        ) : null
      ] }),
      actionStatus ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-emerald-600", children: actionStatus }) : null,
      actionError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-rose-600", children: actionError }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Player" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3", children: !showPreview ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-48 flex-col items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-center text-xs text-slate-300", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-slate-100", children: "Preview hidden" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Enable thumbnails in privacy settings to show previews." }),
        privacyError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-rose-400", children: privacyError }) : null
      ] }) : videoSrc ? /* @__PURE__ */ jsxRuntimeExports.jsx(VideoPlayer, { videoId: video.id, src: videoSrc }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-48 items-center justify-center rounded-lg bg-slate-900 text-xs text-slate-300", children: "Preview unavailable" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-slate-500", children: "If playback fails, confirm the file exists and has read permissions." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      VideoTagManager,
      {
        videoId: video.id,
        videoTitle: video.title ?? void 0,
        tags,
        taxonomy,
        suggestions,
        isIndexed,
        isIndexing,
        isSuggesting,
        llmAvailable,
        onIndex: () => void index(),
        onSuggest: (useLLM) => void suggest(useLLM, video.title ?? void 0),
        onAcceptTag: (tagName) => void acceptTag(tagName),
        onRejectTag: (tagName) => void rejectTag(tagName),
        onAddTag: (tagName, lock) => void addTag(tagName, lock),
        onRemoveTag: (tagName, force) => void removeTag(tagName, force),
        onLockTag: (tagName) => void lockTag(tagName),
        onUnlockTag: (tagName) => void unlockTag(tagName),
        onRegenerate: () => void regenerate()
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Transcript" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-700", children: transcriptText ? "Edit or clean the transcript." : "No transcript attached yet." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleCleanupTranscript(),
              className: "rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600",
              disabled: isTranscriptCleaning || isTranscriptLoading,
              children: isTranscriptCleaning ? "Cleaning..." : "AI cleanup"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleExportCaptions(),
              className: "rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600",
              disabled: isCaptionExporting || isTranscriptLoading,
              children: isCaptionExporting ? "Exporting..." : "Export VTT"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleSaveTranscript(),
              className: "rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white",
              disabled: isTranscriptSaving || isTranscriptLoading,
              children: isTranscriptSaving ? "Saving..." : "Save transcript"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          value: transcriptDraft,
          onChange: (event) => setTranscriptDraft(event.target.value),
          placeholder: isTranscriptLoading ? "Loading transcript..." : "Transcript will appear here.",
          className: "min-h-[140px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
        }
      ) }),
      transcriptStatus ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-emerald-600", children: transcriptStatus }) : null,
      transcriptError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-rose-600", children: transcriptError }) : null,
      captionStatus ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-emerald-600", children: captionStatus }) : null,
      captionError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-rose-600", children: captionError }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Export + share" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-700", children: "Bundle transcripts, captions, and metadata for sharing." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => void handleSelectExportFolder(),
            className: "rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600",
            children: exportTarget ? "Change folder" : "Choose folder"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-slate-500", children: exportTarget ?? "Default: video folder" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 grid gap-2 text-[11px] text-slate-500 sm:grid-cols-2", children: [
        { label: "Transcript (.txt)", value: exportTranscript, setter: setExportTranscript },
        { label: "Summary (.summary.txt)", value: exportSummary, setter: setExportSummary },
        { label: "Captions (.vtt)", value: exportCaptions, setter: setExportCaptions },
        { label: "Metadata (.json)", value: exportMetadata, setter: setExportMetadata }
      ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "checkbox",
            checked: item.value,
            onChange: (event) => item.setter(event.target.checked),
            className: "h-3.5 w-3.5 rounded border-slate-300 text-slate-900"
          }
        ),
        item.label
      ] }, item.label)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => void handleExportAssets(),
          disabled: isExporting,
          className: "mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-70",
          children: isExporting ? "Exporting..." : "Export selected assets"
        }
      ),
      exportStatus ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-emerald-600", children: exportStatus }) : null,
      exportError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-rose-600", children: exportError }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "AI summary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-700", children: video.summary ? "Summary ready." : "Generate a quick summary from the transcript." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => void handleSummarize(),
            className: "rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white",
            disabled: isSummarizing,
            children: isSummarizing ? "Summarizing..." : video.summary ? "Regenerate" : "Generate"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-600", children: video.summary ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap", children: video.summary }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: "No summary generated yet." }) }),
      summaryStatus ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-emerald-600", children: summaryStatus }) : null,
      summaryError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-rose-600", children: summaryError }) : null
    ] })
  ] });
}
function Tooltip({
  content,
  children,
  position = "top",
  delay = 300,
  maxWidth = 280,
  disabled = false
}) {
  const [isVisible, setIsVisible] = reactExports.useState(false);
  const [coords, setCoords] = reactExports.useState({ x: 0, y: 0 });
  const triggerRef = reactExports.useRef(null);
  const tooltipRef = reactExports.useRef(null);
  const timeoutRef = reactExports.useRef(null);
  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };
  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };
  reactExports.useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const tooltip = tooltipRef.current.getBoundingClientRect();
    const padding = 8;
    let x2 = 0;
    let y2 = 0;
    switch (position) {
      case "top":
        x2 = trigger.left + trigger.width / 2 - tooltip.width / 2;
        y2 = trigger.top - tooltip.height - padding;
        break;
      case "bottom":
        x2 = trigger.left + trigger.width / 2 - tooltip.width / 2;
        y2 = trigger.bottom + padding;
        break;
      case "left":
        x2 = trigger.left - tooltip.width - padding;
        y2 = trigger.top + trigger.height / 2 - tooltip.height / 2;
        break;
      case "right":
        x2 = trigger.right + padding;
        y2 = trigger.top + trigger.height / 2 - tooltip.height / 2;
        break;
    }
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    if (x2 < padding) x2 = padding;
    if (x2 + tooltip.width > viewportWidth - padding) x2 = viewportWidth - tooltip.width - padding;
    if (y2 < padding) y2 = padding;
    if (y2 + tooltip.height > viewportHeight - padding) y2 = viewportHeight - tooltip.height - padding;
    setCoords({ x: x2, y: y2 });
  }, [isVisible, position]);
  reactExports.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  const arrowPosition = {
    top: "bottom-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-800",
    bottom: "top-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-800",
    left: "right-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-800",
    right: "left-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-800"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        ref: triggerRef,
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip,
        className: "inline-block",
        children
      }
    ),
    isVisible && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        ref: tooltipRef,
        style: {
          position: "fixed",
          left: coords.x,
          top: coords.y,
          maxWidth,
          zIndex: 9999
        },
        className: "pointer-events-none",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative rounded-lg bg-slate-800 px-3 py-2 text-sm text-white shadow-lg", children: [
          content,
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: `absolute h-0 w-0 border-[6px] ${arrowPosition[position]}`
            }
          )
        ] })
      }
    )
  ] });
}
function InfoTooltip({ content, position = "top" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { content, position, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1.5 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500 hover:bg-slate-300", children: "?" }) });
}
function TooltipHeading({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-1 font-semibold text-white", children });
}
function TooltipText({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-300", children });
}
function TooltipList({ items, type = "neutral" }) {
  const bulletColor = {
    pros: "text-emerald-400",
    cons: "text-red-400",
    neutral: "text-slate-400"
  };
  const bulletChar = {
    pros: "+",
    cons: "-",
    neutral: "•"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-1 space-y-0.5", children: items.map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-1.5 text-slate-300", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `${bulletColor[type]} font-mono`, children: bulletChar[type] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item })
  ] }, i)) });
}
const RESOLUTION_PRESETS = {
  "4k": { width: 3840, height: 2160, label: "4K Ultra HD" },
  "1440p": { width: 2560, height: 1440, label: "2K QHD" },
  "1080p": { width: 1920, height: 1080, label: "Full HD" },
  "720p": { width: 1280, height: 720, label: "HD" },
  "480p": { width: 854, height: 480, label: "SD" },
  "360p": { width: 640, height: 360, label: "Low" },
  "custom": null,
  "source": null
};
const SCALING_ALGORITHMS = [
  {
    id: "lanczos",
    label: "Lanczos",
    description: "Highest quality, best for downscaling. Slower but produces sharpest results with minimal artifacts.",
    quality: "best"
  },
  {
    id: "bicubic",
    label: "Bicubic",
    description: "Good balance of quality and speed. Produces smooth gradients and works well for most content.",
    quality: "good"
  },
  {
    id: "bilinear",
    label: "Bilinear",
    description: "Fast and produces acceptable results. Good for previews or when speed is priority.",
    quality: "fast"
  },
  {
    id: "spline",
    label: "Spline",
    description: "Similar to bicubic with slightly different characteristics. Good for upscaling.",
    quality: "good"
  },
  {
    id: "neighbor",
    label: "Nearest Neighbor",
    description: "Fastest but lowest quality. Preserves hard edges, good for pixel art or retro content.",
    quality: "fastest"
  }
];
const CROP_OPTIONS = [
  { id: "none", label: "No Crop", description: "Keep original frame, no cropping applied." },
  { id: "auto", label: "Auto (Remove Black Bars)", description: "Automatically detect and remove black bars/letterboxing." },
  { id: "16:9", label: "16:9 Widescreen", description: "Standard widescreen format for modern displays and YouTube.", aspectRatio: 16 / 9 },
  { id: "4:3", label: "4:3 Classic", description: "Classic TV/monitor aspect ratio.", aspectRatio: 4 / 3 },
  { id: "1:1", label: "1:1 Square", description: "Square format, ideal for Instagram posts.", aspectRatio: 1 },
  { id: "9:16", label: "9:16 Vertical", description: "Vertical video for TikTok, Instagram Reels, YouTube Shorts.", aspectRatio: 9 / 16 },
  { id: "21:9", label: "21:9 Ultrawide", description: "Cinematic ultrawide format.", aspectRatio: 21 / 9 },
  { id: "custom", label: "Custom", description: "Specify exact crop dimensions manually." }
];
const VIDEO_CODECS = [
  {
    id: "h264",
    label: "H.264 (AVC)",
    description: "Most compatible codec. Plays on virtually every device and platform.",
    pros: ["Universal compatibility", "Fast encoding", "Hardware acceleration everywhere"],
    cons: ["Larger files than H.265", "Less efficient compression"],
    fileExtensions: ["mp4", "mkv", "mov"],
    hwAccelSupport: ["videotoolbox", "nvenc", "amf", "qsv"]
  },
  {
    id: "h265",
    label: "H.265 (HEVC)",
    description: "50% smaller files than H.264 at same quality. Good for archiving.",
    pros: ["Excellent compression", "Great for 4K content", "Smaller file sizes"],
    cons: ["Slower encoding", "Some older devices lack support", "Patent licensing issues"],
    fileExtensions: ["mp4", "mkv", "mov"],
    hwAccelSupport: ["videotoolbox", "nvenc", "amf", "qsv"]
  },
  {
    id: "vp9",
    label: "VP9",
    description: "Google's open codec. Used by YouTube. Royalty-free alternative to H.265.",
    pros: ["Royalty-free", "Good compression", "YouTube native"],
    cons: ["Slower encoding", "Limited hardware support", "Less compatible than H.264"],
    fileExtensions: ["webm", "mkv"],
    hwAccelSupport: []
  },
  {
    id: "av1",
    label: "AV1",
    description: "Next-gen codec with best compression. Very slow to encode but smallest files.",
    pros: ["Best compression available", "Royalty-free", "Future-proof"],
    cons: ["Very slow encoding", "Limited device support", "High CPU usage"],
    fileExtensions: ["mp4", "mkv", "webm"],
    hwAccelSupport: ["nvenc"]
    // Only newest NVIDIA cards
  },
  {
    id: "prores",
    label: "ProRes",
    description: "Apple's professional editing codec. Large files but no quality loss.",
    pros: ["Professional quality", "Fast editing", "No generation loss"],
    cons: ["Very large files", "macOS/Apple ecosystem", "Not for final delivery"],
    fileExtensions: ["mov"],
    hwAccelSupport: ["videotoolbox"]
  },
  {
    id: "copy",
    label: "Copy (No Re-encode)",
    description: "Copy video stream without re-encoding. Fastest, no quality loss.",
    pros: ["Instant processing", "No quality loss", "No CPU usage"],
    cons: ["Cannot change codec/quality", "Limited editing options"],
    fileExtensions: ["mp4", "mkv", "mov"],
    hwAccelSupport: []
  }
];
const ENCODING_SPEEDS = [
  { id: "ultrafast", label: "Ultra Fast", description: "Fastest encoding, lowest compression efficiency. Good for quick previews.", speedRating: 10, qualityRating: 3, estimatedTime: "~10x faster" },
  { id: "superfast", label: "Super Fast", description: "Very fast with slightly better quality than ultrafast.", speedRating: 9, qualityRating: 4, estimatedTime: "~8x faster" },
  { id: "veryfast", label: "Very Fast", description: "Fast encoding, acceptable quality. Good for streaming.", speedRating: 8, qualityRating: 5, estimatedTime: "~5x faster" },
  { id: "faster", label: "Faster", description: "Good balance for quick exports.", speedRating: 7, qualityRating: 6, estimatedTime: "~3x faster" },
  { id: "fast", label: "Fast", description: "Slightly faster than medium with minimal quality loss.", speedRating: 6, qualityRating: 7, estimatedTime: "~2x faster" },
  { id: "medium", label: "Medium (Recommended)", description: "Default balanced preset. Best tradeoff between speed and quality.", speedRating: 5, qualityRating: 8, estimatedTime: "baseline" },
  { id: "slow", label: "Slow", description: "Better compression, smaller files. Good for final exports.", speedRating: 4, qualityRating: 8.5, estimatedTime: "~2x slower" },
  { id: "slower", label: "Slower", description: "High quality compression. Recommended for archiving.", speedRating: 3, qualityRating: 9, estimatedTime: "~4x slower" },
  { id: "veryslow", label: "Very Slow", description: "Maximum practical quality. Best for important content.", speedRating: 2, qualityRating: 9.5, estimatedTime: "~8x slower" },
  { id: "placebo", label: "Placebo", description: "Diminishing returns. Only marginally better than veryslow.", speedRating: 1, qualityRating: 10, estimatedTime: "~20x slower" }
];
const H264_PROFILES = [
  {
    id: "baseline",
    label: "Baseline",
    description: "Maximum compatibility. Works on all devices including very old ones.",
    compatibility: "maximum",
    features: ["No B-frames", "No CABAC", "Basic features only"]
  },
  {
    id: "main",
    label: "Main",
    description: "Good compatibility with better compression than Baseline.",
    compatibility: "high",
    features: ["B-frames", "CABAC entropy coding", "Interlaced support"]
  },
  {
    id: "high",
    label: "High (Recommended)",
    description: "Best quality/compression. Works on most modern devices.",
    compatibility: "medium",
    features: ["8x8 transform", "Custom quant matrices", "Best compression"]
  },
  {
    id: "high10",
    label: "High 10-bit",
    description: "10-bit color depth for HDR content and color grading.",
    compatibility: "low",
    features: ["10-bit color", "HDR support", "Better gradients"]
  }
];
const H265_PROFILES = [
  {
    id: "main",
    label: "Main",
    description: "Standard 8-bit profile. Good compatibility.",
    compatibility: "high",
    features: ["8-bit color", "Standard compression"]
  },
  {
    id: "main10",
    label: "Main 10 (Recommended)",
    description: "10-bit color for better quality and HDR support.",
    compatibility: "medium",
    features: ["10-bit color", "HDR support", "Better banding reduction"]
  }
];
const CRF_GUIDE = [
  { value: 0, label: "Lossless", description: "Mathematically lossless. Massive files.", useCase: "Source archival, editing masters", fileSize: "Huge (10x+)" },
  { value: 14, label: "Visually Lossless", description: "Indistinguishable from source to human eye.", useCase: "Professional archival, masters", fileSize: "Very Large (3-5x)" },
  { value: 17, label: "Excellent", description: "Extremely high quality, minimal compression artifacts.", useCase: "High-quality archives, 4K content", fileSize: "Large (2-3x)" },
  { value: 18, label: "Very High", description: "Excellent quality, nearly transparent.", useCase: "Personal archives, quality-focused", fileSize: "Large (1.5-2x)" },
  { value: 20, label: "High (Recommended)", description: "Great quality with good file size. Sweet spot.", useCase: "General use, sharing, streaming", fileSize: "Medium" },
  { value: 23, label: "Good", description: "Good quality, noticeable on close inspection.", useCase: "Web video, social media", fileSize: "Smaller" },
  { value: 26, label: "Acceptable", description: "Visible artifacts in complex scenes.", useCase: "Previews, drafts", fileSize: "Small" },
  { value: 28, label: "Low", description: "Obvious quality loss. Use for drafts only.", useCase: "Quick previews, low bandwidth", fileSize: "Very Small" },
  { value: 32, label: "Very Low", description: "Heavy compression artifacts. Not recommended.", useCase: "Extreme size constraints", fileSize: "Tiny" },
  { value: 51, label: "Minimum", description: "Maximum compression. Extremely poor quality.", useCase: "Testing only", fileSize: "Smallest possible" }
];
const CONTAINER_FORMATS = [
  {
    id: "mp4",
    label: "MP4",
    description: "Most widely supported format. Works everywhere.",
    supportedCodecs: ["h264", "h265", "av1"],
    features: ["Streaming support", "Fast-start (moov atom)", "Chapters", "Subtitles (limited)"],
    compatibility: "Universal - all devices, browsers, platforms"
  },
  {
    id: "mkv",
    label: "MKV (Matroska)",
    description: "Flexible container supporting nearly all codecs. Great for archiving.",
    supportedCodecs: ["h264", "h265", "vp9", "av1"],
    features: ["Multiple audio tracks", "Multiple subtitles", "Chapters", "Attachments"],
    compatibility: "Most media players, limited browser support"
  },
  {
    id: "webm",
    label: "WebM",
    description: "Web-optimized format. Great for browsers.",
    supportedCodecs: ["vp9", "av1"],
    features: ["Browser native", "Streaming optimized", "Royalty-free"],
    compatibility: "Modern browsers, some media players"
  },
  {
    id: "mov",
    label: "MOV (QuickTime)",
    description: "Apple's format. Best for macOS/iOS editing workflows.",
    supportedCodecs: ["h264", "h265", "prores"],
    features: ["Pro editing support", "Timecode", "ProRes support"],
    compatibility: "Apple ecosystem, professional editors"
  }
];
const HW_ACCELERATORS = [
  {
    id: "none",
    label: "Software (CPU)",
    vendor: "Any",
    description: "Uses CPU for encoding. Slowest but highest quality and most compatible.",
    platform: "all",
    qualityNote: "Best quality, reference encoder"
  },
  {
    id: "videotoolbox",
    label: "VideoToolbox",
    vendor: "Apple",
    description: "Apple's hardware encoder for Mac. Uses Apple Silicon or Intel Quick Sync.",
    platform: "macos",
    qualityNote: "Good quality on Apple Silicon, very fast"
  },
  {
    id: "nvenc",
    label: "NVENC",
    vendor: "NVIDIA",
    description: "NVIDIA GPU encoding. Very fast with good quality.",
    platform: "all",
    qualityNote: "Good quality on RTX cards, slightly below software"
  },
  {
    id: "amf",
    label: "AMF/VCE",
    vendor: "AMD",
    description: "AMD GPU encoding for Radeon graphics cards.",
    platform: "all",
    qualityNote: "Decent quality, improving with newer cards"
  },
  {
    id: "qsv",
    label: "Quick Sync",
    vendor: "Intel",
    description: "Intel integrated GPU encoding. Available on most Intel CPUs.",
    platform: "all",
    qualityNote: "Good quality on newer Intel chips"
  }
];
const AUDIO_CODECS = [
  { id: "aac", label: "AAC", description: "Best compatibility. Standard for MP4.", defaultBitrate: 192, bitrateRange: [64, 320] },
  { id: "mp3", label: "MP3", description: "Legacy format. Universal but less efficient.", defaultBitrate: 192, bitrateRange: [64, 320] },
  { id: "opus", label: "Opus", description: "Best quality per bitrate. Great for low bitrates.", defaultBitrate: 128, bitrateRange: [32, 256] },
  { id: "flac", label: "FLAC", description: "Lossless compression. Large files.", defaultBitrate: 0, bitrateRange: [0, 0] },
  { id: "copy", label: "Copy", description: "Keep original audio without re-encoding.", defaultBitrate: 0, bitrateRange: [0, 0] },
  { id: "none", label: "No Audio", description: "Remove audio track entirely.", defaultBitrate: 0, bitrateRange: [0, 0] }
];
const DEFAULT_FILTERS = {
  deinterlace: false,
  denoise: "none",
  sharpen: "none",
  brightness: 0,
  contrast: 1,
  saturation: 1,
  gamma: 1,
  speed: 1
};
const DEFAULT_ENCODING_CONFIG = {
  resolution: "source",
  scalingAlgorithm: "lanczos",
  cropMode: "none",
  videoCodec: "h264",
  encodingSpeed: "medium",
  profile: "high",
  crf: 20,
  bitrateMode: "crf",
  container: "mp4",
  fastStart: true,
  hwAccel: "none",
  audioCodec: "aac",
  audioBitrate: 192,
  audioChannels: "stereo",
  audioSampleRate: 48e3,
  normalizeAudio: false,
  filters: DEFAULT_FILTERS,
  frameRate: "source"
};
const ENCODING_PRESETS = [
  {
    id: "web-optimized",
    name: "Web Optimized",
    description: "Best for websites and general sharing. Good quality, fast loading.",
    category: "compatibility",
    config: {
      resolution: "1080p",
      videoCodec: "h264",
      encodingSpeed: "medium",
      profile: "high",
      crf: 22,
      container: "mp4",
      fastStart: true,
      audioCodec: "aac",
      audioBitrate: 192
    }
  },
  {
    id: "youtube-4k",
    name: "YouTube 4K",
    description: "Optimized for YouTube. High bitrate for upload processing.",
    category: "social",
    config: {
      resolution: "4k",
      videoCodec: "h264",
      encodingSpeed: "slow",
      profile: "high",
      crf: 18,
      container: "mp4",
      fastStart: true,
      audioCodec: "aac",
      audioBitrate: 256
    }
  },
  {
    id: "youtube-1080p",
    name: "YouTube 1080p",
    description: "Standard YouTube upload. Balances quality and upload time.",
    category: "social",
    config: {
      resolution: "1080p",
      videoCodec: "h264",
      encodingSpeed: "medium",
      profile: "high",
      crf: 20,
      container: "mp4",
      fastStart: true,
      audioCodec: "aac",
      audioBitrate: 192
    }
  },
  {
    id: "tiktok-vertical",
    name: "TikTok / Reels",
    description: "Vertical 9:16 format for TikTok, Instagram Reels, YouTube Shorts.",
    category: "social",
    config: {
      resolution: "1080p",
      cropMode: "9:16",
      videoCodec: "h264",
      encodingSpeed: "fast",
      profile: "high",
      crf: 22,
      container: "mp4",
      fastStart: true,
      audioCodec: "aac",
      audioBitrate: 192
    }
  },
  {
    id: "instagram-square",
    name: "Instagram Square",
    description: "Square 1:1 format for Instagram feed posts.",
    category: "social",
    config: {
      resolution: "1080p",
      cropMode: "1:1",
      videoCodec: "h264",
      encodingSpeed: "fast",
      profile: "high",
      crf: 22,
      container: "mp4",
      fastStart: true,
      audioCodec: "aac",
      audioBitrate: 192
    }
  },
  {
    id: "archive-quality",
    name: "Archive (Best Quality)",
    description: "Maximum quality for long-term storage. Larger files.",
    category: "archive",
    config: {
      resolution: "source",
      videoCodec: "h265",
      encodingSpeed: "slower",
      profile: "main10",
      crf: 18,
      container: "mkv",
      audioCodec: "flac",
      normalizeAudio: false
    }
  },
  {
    id: "archive-efficient",
    name: "Archive (Space Efficient)",
    description: "Good quality with efficient compression. Saves storage.",
    category: "archive",
    config: {
      resolution: "source",
      videoCodec: "h265",
      encodingSpeed: "slow",
      profile: "main10",
      crf: 22,
      container: "mkv",
      audioCodec: "aac",
      audioBitrate: 192
    }
  },
  {
    id: "mobile-friendly",
    name: "Mobile Friendly",
    description: "Smaller files for mobile viewing. Saves bandwidth.",
    category: "compatibility",
    config: {
      resolution: "720p",
      videoCodec: "h264",
      encodingSpeed: "fast",
      profile: "main",
      crf: 24,
      container: "mp4",
      fastStart: true,
      audioCodec: "aac",
      audioBitrate: 128
    }
  },
  {
    id: "quick-preview",
    name: "Quick Preview",
    description: "Ultra-fast encoding for quick previews. Lower quality.",
    category: "fast",
    config: {
      resolution: "720p",
      videoCodec: "h264",
      encodingSpeed: "ultrafast",
      profile: "baseline",
      crf: 26,
      container: "mp4",
      fastStart: true,
      audioCodec: "aac",
      audioBitrate: 128
    }
  },
  {
    id: "editing-proxy",
    name: "Editing Proxy",
    description: "Low-res proxy for video editing. Link to original for export.",
    category: "fast",
    config: {
      resolution: "720p",
      videoCodec: "h264",
      encodingSpeed: "veryfast",
      profile: "high",
      crf: 23,
      container: "mp4",
      fastStart: true,
      audioCodec: "aac",
      audioBitrate: 128
    }
  },
  {
    id: "discord",
    name: "Discord (8MB)",
    description: "Optimized for Discord free tier 8MB limit.",
    category: "social",
    config: {
      resolution: "720p",
      videoCodec: "h264",
      encodingSpeed: "medium",
      profile: "high",
      bitrateMode: "vbr",
      targetBitrate: 1e3,
      maxBitrate: 1500,
      container: "mp4",
      fastStart: true,
      audioCodec: "aac",
      audioBitrate: 96
    }
  }
];
const RECOMMENDED = {
  codec: "h264",
  profile: "high",
  scaling: "lanczos",
  container: "mp4",
  audioCodec: "aac",
  crf: 20,
  encodingSpeed: "medium",
  resolution: "1080p"
};
function isCodecContainerCompatible(codec, container) {
  const codecInfo = VIDEO_CODECS.find((c) => c.id === codec);
  if (!codecInfo) return true;
  return codecInfo.fileExtensions.includes(container);
}
function getIncompatibilityWarnings(config) {
  const warnings = [];
  if (!isCodecContainerCompatible(config.videoCodec, config.container)) {
    const containerLabel = CONTAINER_FORMATS.find((c) => c.id === config.container)?.label || config.container;
    const codecLabel = VIDEO_CODECS.find((c) => c.id === config.videoCodec)?.label || config.videoCodec;
    warnings.push(`${codecLabel} is not compatible with ${containerLabel} container. Video may not play correctly.`);
  }
  if (config.videoCodec === "vp9" && config.container !== "webm" && config.container !== "mkv") {
    warnings.push("VP9 works best with WebM or MKV containers.");
  }
  if (config.videoCodec === "prores" && config.container !== "mov") {
    warnings.push("ProRes requires MOV container.");
  }
  if (config.audioCodec === "opus" && config.container === "mp4") {
    warnings.push("Opus audio in MP4 may have limited player support.");
  }
  if (config.hwAccel !== "none" && config.videoCodec === "av1" && config.hwAccel !== "nvenc") {
    warnings.push("AV1 hardware encoding is only available on NVIDIA RTX 40-series GPUs.");
  }
  if (config.resolution === "4k" && config.profile === "baseline") {
    warnings.push("Baseline profile at 4K may cause compatibility issues with some players.");
  }
  return warnings;
}
function estimateFileSize(config, durationSeconds, sourceBitrate) {
  if (!durationSeconds || durationSeconds <= 0) {
    return { min: 0, max: 0, display: "N/A" };
  }
  if (config.videoCodec === "copy") {
    if (sourceBitrate) {
      const sizeMB2 = sourceBitrate * durationSeconds / 8 / 1024;
      if (sizeMB2 > 1024) {
        return { min: sizeMB2, max: sizeMB2, display: `~${(sizeMB2 / 1024).toFixed(1)} GB (same as source)` };
      }
      return { min: sizeMB2, max: sizeMB2, display: `~${Math.round(sizeMB2)} MB (same as source)` };
    }
    return { min: 0, max: 0, display: "Same as source" };
  }
  const resolutionMultipliers = {
    "4k": 4,
    "1440p": 2.5,
    "1080p": 1,
    "720p": 0.5,
    "480p": 0.25,
    "360p": 0.15,
    source: 1,
    custom: 1
  };
  const resMult = resolutionMultipliers[config.resolution] || 1;
  const crfBase = Math.pow(2, (23 - config.crf) / 6) * 5e3;
  let baseBitrate = crfBase * resMult;
  const codecMultipliers = {
    h264: 1,
    h265: 0.6,
    vp9: 0.65,
    av1: 0.5,
    prores: 10,
    copy: 1
  };
  baseBitrate *= codecMultipliers[config.videoCodec] || 1;
  const audioBitrate = config.audioCodec === "none" ? 0 : config.audioBitrate;
  const totalBitrate = baseBitrate + audioBitrate;
  const sizeKB = totalBitrate * durationSeconds / 8;
  const sizeMB = sizeKB / 1024;
  const min = sizeMB * 0.7;
  const max = sizeMB * 1.3;
  let display;
  if (max > 1024) {
    display = `${(min / 1024).toFixed(1)} - ${(max / 1024).toFixed(1)} GB`;
  } else if (max > 100) {
    display = `${Math.round(min)} - ${Math.round(max)} MB`;
  } else {
    display = `${min.toFixed(1)} - ${max.toFixed(1)} MB`;
  }
  return { min, max, display };
}
function estimateEncodingTime(config, durationSeconds) {
  if (!durationSeconds || durationSeconds <= 0) {
    return "N/A";
  }
  let baseSpeed = 1.5;
  const speedMultipliers = {
    ultrafast: 10,
    superfast: 8,
    veryfast: 5,
    faster: 3,
    fast: 2,
    medium: 1,
    slow: 0.5,
    slower: 0.25,
    veryslow: 0.125,
    placebo: 0.05
  };
  baseSpeed *= speedMultipliers[config.encodingSpeed] || 1;
  if (config.hwAccel !== "none") {
    baseSpeed *= 5;
  }
  const resolutionMultipliers = {
    "4k": 0.25,
    "1440p": 0.5,
    "1080p": 1,
    "720p": 2,
    "480p": 3,
    "360p": 4,
    source: 1,
    custom: 1
  };
  baseSpeed *= resolutionMultipliers[config.resolution] || 1;
  const codecMultipliers = {
    h264: 1,
    h265: 0.5,
    vp9: 0.4,
    av1: 0.1,
    prores: 3,
    copy: 100
    // Instant
  };
  baseSpeed *= codecMultipliers[config.videoCodec] || 1;
  const encodingSeconds = durationSeconds / baseSpeed;
  if (encodingSeconds < 60) {
    return `~${Math.max(1, Math.round(encodingSeconds))}s`;
  } else if (encodingSeconds < 3600) {
    return `~${Math.round(encodingSeconds / 60)}m`;
  } else {
    const hours = Math.floor(encodingSeconds / 3600);
    const mins = Math.round(encodingSeconds % 3600 / 60);
    return `~${hours}h ${mins}m`;
  }
}
function getPresetDifferences(config, presetId) {
  if (!presetId) return [];
  const preset = ENCODING_PRESETS.find((p2) => p2.id === presetId);
  if (!preset) return [];
  const differences = [];
  const presetConfig = { ...DEFAULT_ENCODING_CONFIG, ...preset.config };
  if (config.resolution !== presetConfig.resolution) {
    differences.push(`Resolution: ${config.resolution} (was ${presetConfig.resolution})`);
  }
  if (config.videoCodec !== presetConfig.videoCodec) {
    differences.push(`Codec: ${config.videoCodec} (was ${presetConfig.videoCodec})`);
  }
  if (config.crf !== presetConfig.crf) {
    differences.push(`CRF: ${config.crf} (was ${presetConfig.crf})`);
  }
  if (config.encodingSpeed !== presetConfig.encodingSpeed) {
    differences.push(`Speed: ${config.encodingSpeed} (was ${presetConfig.encodingSpeed})`);
  }
  if (config.container !== presetConfig.container) {
    differences.push(`Container: ${config.container} (was ${presetConfig.container})`);
  }
  if (config.audioCodec !== presetConfig.audioCodec) {
    differences.push(`Audio: ${config.audioCodec} (was ${presetConfig.audioCodec})`);
  }
  if (config.hwAccel !== presetConfig.hwAccel) {
    differences.push(`HW Accel: ${config.hwAccel} (was ${presetConfig.hwAccel})`);
  }
  return differences;
}
function RecommendedBadge() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1.5 inline-flex items-center rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700", children: "Recommended" });
}
function getValidProfile(codec, currentProfile) {
  if (codec === "h264") {
    return H264_PROFILES.some((p2) => p2.id === currentProfile) ? currentProfile : "high";
  }
  if (codec === "h265") {
    return H265_PROFILES.some((p2) => p2.id === currentProfile) ? currentProfile : "main10";
  }
  return currentProfile;
}
function VideoEncodingSettings({
  config,
  onChange,
  sourceInfo,
  availableHWAccel = ["none", "videotoolbox"],
  cpuCapabilities
}) {
  const [activeTab, setActiveTab] = reactExports.useState("presets");
  const [uiMode, setUIMode] = reactExports.useState("simple");
  const [appliedPreset, setAppliedPreset] = reactExports.useState(null);
  const updateConfig = reactExports.useCallback((key, value) => {
    let newConfig = { ...config, [key]: value };
    if (key === "videoCodec") {
      const validProfile = getValidProfile(value, config.profile);
      newConfig = { ...newConfig, profile: validProfile };
      const codecInfo = VIDEO_CODECS.find((c) => c.id === value);
      if (codecInfo && !codecInfo.fileExtensions.includes(config.container)) {
        newConfig = { ...newConfig, container: codecInfo.fileExtensions[0] };
      }
    }
    onChange(newConfig);
  }, [config, onChange]);
  const updateFilters = reactExports.useCallback((key, value) => {
    onChange({ ...config, filters: { ...config.filters, [key]: value } });
  }, [config, onChange]);
  const applyPreset = reactExports.useCallback((presetId) => {
    const preset = ENCODING_PRESETS.find((p2) => p2.id === presetId);
    if (preset) {
      onChange({ ...DEFAULT_ENCODING_CONFIG, ...preset.config });
      setAppliedPreset(presetId);
    }
  }, [onChange]);
  const availableProfiles = reactExports.useMemo(() => {
    if (config.videoCodec === "h264") return H264_PROFILES;
    if (config.videoCodec === "h265") return H265_PROFILES;
    return [];
  }, [config.videoCodec]);
  const compatibleContainers = reactExports.useMemo(() => {
    const codec = VIDEO_CODECS.find((c) => c.id === config.videoCodec);
    if (!codec) return CONTAINER_FORMATS;
    return CONTAINER_FORMATS.filter((f2) => codec.fileExtensions.includes(f2.id));
  }, [config.videoCodec]);
  const crfInfo = reactExports.useMemo(() => {
    const sorted = [...CRF_GUIDE].sort((a, b) => Math.abs(a.value - config.crf) - Math.abs(b.value - config.crf));
    return sorted[0];
  }, [config.crf]);
  const warnings = reactExports.useMemo(() => getIncompatibilityWarnings(config), [config]);
  const fileSizeEstimate = reactExports.useMemo(
    () => estimateFileSize(config, sourceInfo?.duration || 0, sourceInfo?.bitrate),
    [config, sourceInfo?.duration, sourceInfo?.bitrate]
  );
  const encodingTimeEstimate = reactExports.useMemo(
    () => estimateEncodingTime(config, sourceInfo?.duration || 0),
    [config, sourceInfo?.duration]
  );
  const presetDifferences = reactExports.useMemo(
    () => getPresetDifferences(config, appliedPreset),
    [config, appliedPreset]
  );
  const simpleTabs = ["presets", "video", "output"];
  const tabs = uiMode === "simple" ? [
    { id: "presets", label: "Presets" },
    { id: "video", label: "Quality" },
    { id: "output", label: "Output" }
  ] : [
    { id: "presets", label: "Presets" },
    { id: "video", label: "Video" },
    { id: "audio", label: "Audio" },
    { id: "filters", label: "Filters" },
    { id: "output", label: "Output" }
  ];
  const handleModeChange = reactExports.useCallback((newMode) => {
    setUIMode(newMode);
    if (newMode === "simple" && !simpleTabs.includes(activeTab)) {
      setActiveTab("video");
    }
  }, [activeTab]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-white", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 px-4 py-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-slate-700", children: "Mode:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex rounded-lg bg-slate-100 p-0.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => handleModeChange("simple"),
              className: `rounded-md px-3 py-1 text-xs font-medium transition ${uiMode === "simple" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`,
              children: "Simple"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => handleModeChange("advanced"),
              className: `rounded-md px-3 py-1 text-xs font-medium transition ${uiMode === "advanced" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`,
              children: "Advanced"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          InfoTooltip,
          {
            content: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "UI Mode" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "Simple mode shows essential settings only. Advanced mode reveals all options for fine-grained control." })
            ] })
          }
        )
      ] }),
      warnings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Tooltip,
        {
          content: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Compatibility Warnings" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipList, { items: warnings, type: "cons" })
          ] }),
          position: "bottom",
          maxWidth: 400,
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex cursor-help items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }),
            warnings.length,
            " warning",
            warnings.length > 1 ? "s" : ""
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 border-b border-slate-100 px-4", children: tabs.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => setActiveTab(tab.id),
        className: `
              relative px-4 py-3 text-sm font-medium transition
              ${activeTab === tab.id ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}
            `,
        children: [
          tab.label,
          activeTab === tab.id && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-slate-900" })
        ]
      },
      tab.id
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
      activeTab === "presets" && /* @__PURE__ */ jsxRuntimeExports.jsx(
        PresetsTab,
        {
          onApplyPreset: applyPreset,
          appliedPreset,
          presetDifferences
        }
      ),
      activeTab === "video" && /* @__PURE__ */ jsxRuntimeExports.jsx(
        VideoTab,
        {
          config,
          updateConfig,
          sourceInfo,
          availableProfiles,
          availableHWAccel,
          cpuCapabilities,
          crfInfo,
          uiMode
        }
      ),
      activeTab === "audio" && uiMode === "advanced" && /* @__PURE__ */ jsxRuntimeExports.jsx(AudioTab, { config, updateConfig }),
      activeTab === "filters" && uiMode === "advanced" && /* @__PURE__ */ jsxRuntimeExports.jsx(
        FiltersTab,
        {
          filters: config.filters,
          updateFilters
        }
      ),
      activeTab === "output" && /* @__PURE__ */ jsxRuntimeExports.jsx(
        OutputTab,
        {
          config,
          updateConfig,
          compatibleContainers,
          uiMode
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SummaryPanel,
      {
        config,
        sourceInfo,
        fileSizeEstimate,
        encodingTimeEstimate,
        warnings
      }
    )
  ] });
}
function SummaryPanel({
  config,
  sourceInfo,
  fileSizeEstimate,
  encodingTimeEstimate,
  warnings
}) {
  const codecLabel = VIDEO_CODECS.find((c) => c.id === config.videoCodec)?.label || config.videoCodec;
  CONTAINER_FORMATS.find((c) => c.id === config.container)?.label || config.container;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-slate-100 bg-slate-50 px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-x-6 gap-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "Output" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded bg-slate-200 px-2 py-0.5 text-sm font-medium text-slate-700", children: [
        config.resolution === "source" ? "Source" : config.resolution,
        " • ",
        codecLabel,
        " • .",
        config.container
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "Quality" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-slate-700", children: [
        "CRF ",
        config.crf
      ] })
    ] }),
    sourceInfo?.duration && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "Est. Size" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-slate-700", children: fileSizeEstimate.display })
    ] }),
    sourceInfo?.duration && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "Est. Time" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-700", children: encodingTimeEstimate })
    ] }),
    config.hwAccel !== "none" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "Encoder" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700", children: HW_ACCELERATORS.find((h) => h.id === config.hwAccel)?.label || config.hwAccel })
    ] })
  ] }) });
}
function PresetsTab({
  onApplyPreset,
  appliedPreset,
  presetDifferences
}) {
  const categories = [
    { id: "social", label: "Social Media", icon: "📱" },
    { id: "compatibility", label: "Compatibility", icon: "🌐" },
    { id: "archive", label: "Archive", icon: "💾" },
    { id: "fast", label: "Fast Export", icon: "⚡" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-600", children: "Choose a preset to quickly configure encoding settings, then customize in other tabs if needed." }),
    appliedPreset && presetDifferences.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-amber-200 bg-amber-50 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4 text-amber-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium text-amber-800", children: [
          'Preset "',
          ENCODING_PRESETS.find((p2) => p2.id === appliedPreset)?.name,
          '" has been modified:'
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-2 space-y-1", children: presetDifferences.map((diff, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "text-xs text-amber-700", children: [
        "• ",
        diff
      ] }, i)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => onApplyPreset(appliedPreset),
          className: "mt-2 text-xs font-medium text-amber-700 underline hover:text-amber-900",
          children: "Reset to original preset"
        }
      )
    ] }),
    categories.map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: cat.icon }),
        cat.label
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: ENCODING_PRESETS.filter((p2) => p2.category === cat.id).map((preset) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => onApplyPreset(preset.id),
          className: `rounded-lg border p-3 text-left transition ${appliedPreset === preset.id ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-slate-900", children: preset.name }),
              appliedPreset === preset.id && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white", children: "Active" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: preset.description })
          ]
        },
        preset.id
      )) })
    ] }, cat.id))
  ] });
}
function VideoTab({
  config,
  updateConfig,
  sourceInfo,
  availableProfiles,
  availableHWAccel,
  cpuCapabilities,
  crfInfo,
  uiMode
}) {
  const [showAdvanced, setShowAdvanced] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    sourceInfo && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "Source" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-sm text-slate-700", children: [
        sourceInfo.width,
        "×",
        sourceInfo.height,
        " • ",
        sourceInfo.codec,
        " • ",
        sourceInfo.frameRate,
        "fps • ",
        Math.round(sourceInfo.bitrate / 1e3),
        "Mbps"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      SettingGroup,
      {
        label: "Output Resolution",
        tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Output Resolution" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "The final dimensions of your video. Downscaling can significantly reduce file size while maintaining perceived quality. Upscaling is generally not recommended as it doesn't add detail." })
        ] }),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 gap-2", children: Object.keys(RESOLUTION_PRESETS).map((key) => {
            const res = RESOLUTION_PRESETS[key];
            const isRecommended = key === RECOMMENDED.resolution;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => updateConfig("resolution", key),
                className: `relative rounded-lg border px-3 py-2 text-sm transition ${config.resolution === key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700 hover:border-slate-300"}`,
                children: [
                  key === "source" ? "Source" : key === "custom" ? "Custom" : key,
                  res && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-1 text-xs opacity-60", children: [
                    res.width,
                    "×",
                    res.height
                  ] }),
                  isRecommended && config.resolution !== key && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white", children: "★" })
                ]
              },
              key
            );
          }) }),
          config.resolution === "custom" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "number",
                  min: "16",
                  max: "7680",
                  value: config.customWidth || "",
                  onChange: (e) => {
                    const val = parseInt(e.target.value);
                    updateConfig("customWidth", val > 0 && val <= 7680 ? val : void 0);
                  },
                  placeholder: "Width",
                  className: "w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400", children: "×" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "number",
                  min: "16",
                  max: "4320",
                  value: config.customHeight || "",
                  onChange: (e) => {
                    const val = parseInt(e.target.value);
                    updateConfig("customHeight", val > 0 && val <= 4320 ? val : void 0);
                  },
                  placeholder: "Height",
                  className: "w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                }
              )
            ] }),
            config.customWidth && config.customWidth % 2 !== 0 || config.customHeight && config.customHeight % 2 !== 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-amber-600", children: "Dimensions should be even numbers for best compatibility" }) : null
          ] })
        ]
      }
    ),
    config.videoCodec !== "copy" && /* @__PURE__ */ jsxRuntimeExports.jsx(
      SettingGroup,
      {
        label: "Quality (CRF)",
        tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Constant Rate Factor (CRF)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "CRF is the recommended quality control mode. Lower values = higher quality and larger files. The encoder adjusts bitrate to maintain consistent quality." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 space-y-1 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-emerald-400", children: "0-17: Visually lossless (archival)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-blue-400", children: "18-22: High quality (recommended)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-amber-400", children: "23-28: Good quality (smaller files)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400", children: "29+: Visible quality loss" })
          ] })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 flex h-2 overflow-hidden rounded-full", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-[33%] bg-emerald-400" }),
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-[10%] bg-blue-400" }),
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-[12%] bg-amber-400" }),
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-[45%] bg-red-400" }),
                  " "
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "range",
                    min: "0",
                    max: "51",
                    value: config.crf,
                    onChange: (e) => updateConfig("crf", parseInt(e.target.value)),
                    className: "relative z-10 h-2 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-slate-900 [&::-webkit-slider-thumb]:shadow-lg"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-12 text-right font-mono text-lg font-bold text-slate-900", children: config.crf })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex text-[10px] font-medium uppercase tracking-wide", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-[33%] text-emerald-600", children: "Lossless" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-[10%] text-blue-600", children: "High" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-[12%] text-amber-600", children: "Good" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-[45%] text-right text-red-600", children: "Low" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-lg bg-slate-50 p-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-slate-900", children: crfInfo.label }),
                config.crf === RECOMMENDED.crf && /* @__PURE__ */ jsxRuntimeExports.jsx(RecommendedBadge, {})
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: crfInfo.description })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: "Est. file size" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-slate-700", children: crfInfo.fileSize })
            ] })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SettingGroup,
      {
        label: "Video Codec",
        tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Video Codec" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "The compression algorithm used to encode your video. Different codecs offer different tradeoffs between file size, quality, and compatibility." })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: VIDEO_CODECS.map((codec) => {
          const isRecommended = codec.id === RECOMMENDED.codec;
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            Tooltip,
            {
              content: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: codec.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: codec.description }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 grid grid-cols-2 gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-emerald-400", children: "Pros" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipList, { items: codec.pros, type: "pros" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-red-400", children: "Cons" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipList, { items: codec.cons, type: "cons" })
                  ] })
                ] })
              ] }),
              position: "bottom",
              maxWidth: 400,
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => updateConfig("videoCodec", codec.id),
                  className: `relative w-full rounded-lg border px-3 py-2 text-sm transition ${config.videoCodec === codec.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700 hover:border-slate-300"}`,
                  children: [
                    codec.label,
                    isRecommended && config.videoCodec !== codec.id && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white", children: "★" })
                  ]
                }
              )
            },
            codec.id
          );
        }) })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      SettingGroup,
      {
        label: "Hardware Acceleration",
        tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Hardware Acceleration" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "Use GPU hardware to speed up encoding. Much faster but may produce slightly lower quality than software encoding." })
        ] }),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: HW_ACCELERATORS.filter((hw) => availableHWAccel.includes(hw.id)).map((hw) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            Tooltip,
            {
              content: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: hw.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: hw.description }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-amber-400", children: hw.qualityNote })
              ] }),
              position: "bottom",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => updateConfig("hwAccel", hw.id),
                  className: `w-full rounded-lg border px-3 py-2 text-sm transition ${config.hwAccel === hw.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700 hover:border-slate-300"}`,
                  children: [
                    hw.label,
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `block text-xs ${config.hwAccel === hw.id ? "text-slate-300" : "text-slate-400"}`, children: hw.vendor })
                  ]
                }
              )
            },
            hw.id
          )) }),
          config.hwAccel === "none" && cpuCapabilities && (() => {
            const isAppleSilicon = cpuCapabilities.cpuModel?.toLowerCase().includes("apple");
            const hasAnyOptimization = cpuCapabilities.avx512 || cpuCapabilities.avx2 || cpuCapabilities.avx || isAppleSilicon;
            if (!hasAnyOptimization) return null;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-500", children: "CPU optimizations:" }),
              cpuCapabilities.avx512 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Tooltip,
                {
                  content: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "AVX-512 Active" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "Your CPU supports AVX-512 instructions, enabling faster software encoding with x265, SVT-AV1, and other encoders." }),
                    cpuCapabilities.cpuModel && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-400", children: cpuCapabilities.cpuModel })
                  ] }),
                  position: "bottom",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-3 w-3", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }),
                    "AVX-512"
                  ] })
                }
              ),
              cpuCapabilities.avx2 && !cpuCapabilities.avx512 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Tooltip,
                {
                  content: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "AVX2 Active" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "Your CPU supports AVX2 instructions for optimized software encoding." }),
                    cpuCapabilities.cpuModel && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-400", children: cpuCapabilities.cpuModel })
                  ] }),
                  position: "bottom",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-3 w-3", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }),
                    "AVX2"
                  ] })
                }
              ),
              cpuCapabilities.avx && !cpuCapabilities.avx2 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600", children: "AVX" }),
              isAppleSilicon && !cpuCapabilities.avx && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Tooltip,
                {
                  content: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "ARM NEON Active" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "Apple Silicon uses ARM NEON SIMD for optimized software encoding." }),
                    cpuCapabilities.cpuModel && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-400", children: cpuCapabilities.cpuModel })
                  ] }),
                  position: "bottom",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-3 w-3", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }),
                    "ARM NEON"
                  ] })
                }
              )
            ] });
          })()
        ]
      }
    ),
    uiMode === "advanced" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingGroup,
        {
          label: "Scaling Algorithm",
          tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Scaling Algorithm" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "The mathematical method used to resize the video. Better algorithms produce sharper results but take longer to process." })
          ] }),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              value: config.scalingAlgorithm,
              onChange: (e) => updateConfig("scalingAlgorithm", e.target.value),
              className: "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm",
              children: SCALING_ALGORITHMS.map((alg) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: alg.id, children: [
                alg.label,
                " ",
                alg.id === RECOMMENDED.scaling ? "(Recommended)" : "",
                " - ",
                alg.description.split(".")[0]
              ] }, alg.id))
            }
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingGroup,
        {
          label: "Crop / Aspect Ratio",
          tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Crop / Aspect Ratio" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "Crop the video to a specific aspect ratio. Useful for converting between formats (e.g., landscape to vertical for TikTok)." })
          ] }),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 gap-2", children: CROP_OPTIONS.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            Tooltip,
            {
              content: /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: opt.description }),
              position: "bottom",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => updateConfig("cropMode", opt.id),
                  className: `w-full rounded-lg border px-3 py-2 text-sm transition ${config.cropMode === opt.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700 hover:border-slate-300"}`,
                  children: opt.label
                }
              )
            },
            opt.id
          )) })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        SettingGroup,
        {
          label: "Encoding Speed",
          tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Encoding Speed (Preset)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "Controls how much time the encoder spends optimizing compression. Slower = smaller files at same quality, but much longer encoding time." })
          ] }),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "select",
              {
                value: config.encodingSpeed,
                onChange: (e) => updateConfig("encodingSpeed", e.target.value),
                className: "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm",
                children: ENCODING_SPEEDS.map((speed) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: speed.id, children: [
                  speed.label,
                  " ",
                  speed.id === RECOMMENDED.encodingSpeed ? "(Recommended)" : "",
                  " (",
                  speed.estimatedTime,
                  ")"
                ] }, speed.id))
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: ENCODING_SPEEDS.find((s) => s.id === config.encodingSpeed)?.description })
          ]
        }
      ),
      availableProfiles.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingGroup,
        {
          label: "Profile",
          tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Codec Profile" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "Profiles define which codec features are used. Higher profiles enable better compression but may not play on older devices." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              TooltipList,
              {
                items: [
                  "Baseline: Maximum compatibility (old phones, set-top boxes)",
                  "Main: Good compatibility with better compression",
                  "High: Best compression, works on most modern devices"
                ],
                type: "neutral"
              }
            )
          ] }),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2", children: availableProfiles.map((profile) => {
            const isRecommended = profile.id === RECOMMENDED.profile;
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              Tooltip,
              {
                content: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: profile.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: profile.description }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipList, { items: profile.features, type: "neutral" })
                ] }),
                position: "bottom",
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => updateConfig("profile", profile.id),
                    className: `relative w-full rounded-lg border px-3 py-2 text-sm transition ${config.profile === profile.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700 hover:border-slate-300"}`,
                    children: [
                      profile.label,
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `ml-1 text-xs ${config.profile === profile.id ? "text-slate-300" : "text-slate-400"}`, children: [
                        "(",
                        profile.compatibility,
                        " compat.)"
                      ] }),
                      isRecommended && config.profile !== profile.id && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white", children: "★" })
                    ]
                  }
                )
              },
              profile.id
            );
          }) })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => setShowAdvanced(!showAdvanced),
          className: "text-sm font-medium text-slate-600 hover:text-slate-900",
          children: showAdvanced ? "− Hide Extra Options" : "+ Show Extra Options"
        }
      ),
      showAdvanced && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 border-t border-slate-100 pt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SettingGroup,
          {
            label: "Frame Rate",
            tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Frame Rate" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "Changing frame rate affects smoothness and file size. Reducing from 60fps to 30fps roughly halves file size." })
            ] }),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 gap-2", children: ["source", "24", "30", "60"].map((fps) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => updateConfig("frameRate", fps),
                className: `rounded-lg border px-3 py-2 text-sm transition ${config.frameRate === fps ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700 hover:border-slate-300"}`,
                children: fps === "source" ? "Source" : `${fps}fps`
              },
              fps
            )) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          SettingGroup,
          {
            label: "Bitrate Mode",
            tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Bitrate Mode" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "CRF (recommended) adjusts bitrate to maintain quality. CBR uses constant bitrate (for streaming). VBR varies bitrate within limits." })
            ] }),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: ["crf", "vbr", "cbr"].map((mode) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => updateConfig("bitrateMode", mode),
                  className: `rounded-lg border px-3 py-2 text-sm uppercase transition ${config.bitrateMode === mode ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700 hover:border-slate-300"}`,
                  children: [
                    mode,
                    mode === "crf" && /* @__PURE__ */ jsxRuntimeExports.jsx(RecommendedBadge, {})
                  ]
                },
                mode
              )) }),
              (config.bitrateMode === "cbr" || config.bitrateMode === "vbr") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-slate-500", children: "Target Bitrate (kbps)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "number",
                      value: config.targetBitrate || "",
                      onChange: (e) => updateConfig("targetBitrate", parseInt(e.target.value) || void 0),
                      placeholder: "5000",
                      className: "mt-1 w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    }
                  )
                ] }),
                config.bitrateMode === "vbr" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-slate-500", children: "Max Bitrate (kbps)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "number",
                      value: config.maxBitrate || "",
                      onChange: (e) => updateConfig("maxBitrate", parseInt(e.target.value) || void 0),
                      placeholder: "8000",
                      className: "mt-1 w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    }
                  )
                ] })
              ] })
            ]
          }
        )
      ] })
    ] })
  ] });
}
function AudioTab({
  config,
  updateConfig
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SettingGroup,
      {
        label: "Audio Codec",
        tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Audio Codec" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "AAC is recommended for maximum compatibility. Opus offers better quality at low bitrates. FLAC is lossless for archiving." })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: AUDIO_CODECS.map((codec) => {
          const isRecommended = codec.id === RECOMMENDED.audioCodec;
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            Tooltip,
            {
              content: /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: codec.description }),
              position: "bottom",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => updateConfig("audioCodec", codec.id),
                  className: `relative w-full rounded-lg border px-3 py-2 text-sm transition ${config.audioCodec === codec.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700 hover:border-slate-300"}`,
                  children: [
                    codec.label,
                    isRecommended && config.audioCodec !== codec.id && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white", children: "★" })
                  ]
                }
              )
            },
            codec.id
          );
        }) })
      }
    ),
    config.audioCodec !== "copy" && config.audioCodec !== "none" && config.audioCodec !== "flac" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      SettingGroup,
      {
        label: "Audio Bitrate",
        tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Audio Bitrate" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "Higher bitrate = better audio quality. 192kbps is transparent for most listeners. 128kbps is fine for speech." })
        ] }),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "range",
                min: "64",
                max: "320",
                step: "32",
                value: config.audioBitrate,
                onChange: (e) => updateConfig("audioBitrate", parseInt(e.target.value)),
                className: "h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "w-16 text-right font-mono text-sm font-medium text-slate-900", children: [
              config.audioBitrate,
              "kbps"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex justify-between text-xs text-slate-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Lower quality" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Higher quality" })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SettingGroup,
      {
        label: "Channels",
        tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Audio Channels" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "Stereo is standard for most content. Mono halves file size for voice-only content." })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 gap-2", children: ["stereo", "mono", "5.1", "copy"].map((ch2) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => updateConfig("audioChannels", ch2),
            className: `rounded-lg border px-3 py-2 text-sm capitalize transition ${config.audioChannels === ch2 ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700 hover:border-slate-300"}`,
            children: ch2
          },
          ch2
        )) })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SettingGroup,
      {
        label: "Normalize Audio",
        tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Audio Normalization" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "Automatically adjusts volume to a consistent level. Useful for videos with varying audio levels." })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: config.normalizeAudio,
              onChange: (e) => updateConfig("normalizeAudio", e.target.checked),
              className: "h-5 w-5 rounded border-slate-300"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-700", children: "Enable loudness normalization (EBU R128)" })
        ] })
      }
    )
  ] });
}
function FiltersTab({
  filters,
  updateFilters
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SettingGroup,
      {
        label: "Deinterlace",
        tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Deinterlacing" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "Removes interlacing artifacts from old TV/video content. Only enable if you see horizontal lines or combing." })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: filters.deinterlace,
              onChange: (e) => updateFilters("deinterlace", e.target.checked),
              className: "h-5 w-5 rounded border-slate-300"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-700", children: "Enable deinterlacing (yadif filter)" })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SettingGroup,
      {
        label: "Denoise",
        tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Noise Reduction" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "Reduces grain and noise in video. Can improve compression but may remove fine detail. Use sparingly." })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 gap-2", children: ["none", "light", "medium", "heavy"].map((level) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => updateFilters("denoise", level),
            className: `rounded-lg border px-3 py-2 text-sm capitalize transition ${filters.denoise === level ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700 hover:border-slate-300"}`,
            children: level
          },
          level
        )) })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SettingGroup,
      {
        label: "Sharpen",
        tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Sharpening" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "Enhances edge definition. Useful after scaling down or for soft source material. Over-sharpening creates halos." })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 gap-2", children: ["none", "light", "medium", "strong"].map((level) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => updateFilters("sharpen", level),
            className: `rounded-lg border px-3 py-2 text-sm capitalize transition ${filters.sharpen === level ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700 hover:border-slate-300"}`,
            children: level
          },
          level
        )) })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SettingGroup,
      {
        label: "Color Adjustments",
        tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Color Correction" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "Adjust brightness, contrast, saturation, and gamma. Use reset to return to original values." })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SliderSetting,
            {
              label: "Brightness",
              value: filters.brightness,
              min: -1,
              max: 1,
              step: 0.05,
              defaultValue: 0,
              onChange: (v2) => updateFilters("brightness", v2)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SliderSetting,
            {
              label: "Contrast",
              value: filters.contrast,
              min: 0.5,
              max: 2,
              step: 0.05,
              defaultValue: 1,
              onChange: (v2) => updateFilters("contrast", v2)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SliderSetting,
            {
              label: "Saturation",
              value: filters.saturation,
              min: 0,
              max: 2,
              step: 0.05,
              defaultValue: 1,
              onChange: (v2) => updateFilters("saturation", v2)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SliderSetting,
            {
              label: "Gamma",
              value: filters.gamma,
              min: 0.5,
              max: 2,
              step: 0.05,
              defaultValue: 1,
              onChange: (v2) => updateFilters("gamma", v2)
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SettingGroup,
      {
        label: "Playback Speed",
        tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Speed Adjustment" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "Change video playback speed. Audio pitch is preserved. 0.5x = half speed, 2x = double speed." })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SliderSetting,
          {
            label: "Speed",
            value: filters.speed,
            min: 0.25,
            max: 4,
            step: 0.25,
            defaultValue: 1,
            onChange: (v2) => updateFilters("speed", v2),
            formatValue: (v2) => `${v2}x`
          }
        )
      }
    )
  ] });
}
function OutputTab({
  config,
  updateConfig,
  compatibleContainers,
  uiMode
}) {
  const containerWarning = reactExports.useMemo(() => {
    if (!isCodecContainerCompatible(config.videoCodec, config.container)) {
      const codecLabel = VIDEO_CODECS.find((c) => c.id === config.videoCodec)?.label || config.videoCodec;
      return `${codecLabel} may not work correctly in .${config.container} files. Consider using a compatible container.`;
    }
    return null;
  }, [config.videoCodec, config.container]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    containerWarning && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-amber-800", children: containerWarning })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SettingGroup,
      {
        label: "Container Format",
        tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Container Format" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "The file format that wraps the video and audio streams. MP4 is most compatible. MKV supports more features." })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2", children: compatibleContainers.map((container) => {
          const isRecommended = container.id === RECOMMENDED.container;
          const isIncompatible = !isCodecContainerCompatible(config.videoCodec, container.id);
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            Tooltip,
            {
              content: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: container.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: container.description }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipList, { items: container.features, type: "neutral" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-blue-400", children: container.compatibility }),
                isIncompatible && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-red-400", children: [
                  "Not recommended with ",
                  config.videoCodec
                ] })
              ] }),
              position: "bottom",
              maxWidth: 300,
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => updateConfig("container", container.id),
                  className: `relative w-full rounded-lg border px-3 py-2 text-sm transition ${config.container === container.id ? isIncompatible ? "border-amber-500 bg-amber-500 text-white" : "border-slate-900 bg-slate-900 text-white" : isIncompatible ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-700 hover:border-slate-300"}`,
                  children: [
                    ".",
                    container.id,
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `ml-1 text-xs ${config.container === container.id ? "text-slate-300" : "text-slate-400"}`, children: container.label }),
                    isRecommended && config.container !== container.id && !isIncompatible && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white", children: "★" }),
                    isIncompatible && config.container !== container.id && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white", children: "!" })
                  ]
                }
              )
            },
            container.id
          );
        }) })
      }
    ),
    config.container === "mp4" && /* @__PURE__ */ jsxRuntimeExports.jsx(
      SettingGroup,
      {
        label: "Web Optimization",
        tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Fast Start (moov atom)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "Moves metadata to the beginning of the file, allowing videos to start playing before fully downloaded. Essential for web streaming." })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: config.fastStart,
              onChange: (e) => updateConfig("fastStart", e.target.checked),
              className: "h-5 w-5 rounded border-slate-300"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-700", children: "Enable fast start for web streaming" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(RecommendedBadge, {})
        ] })
      }
    ),
    uiMode === "simple" && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      SettingGroup,
      {
        label: "Audio",
        tooltip: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipHeading, { children: "Audio Settings" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipText, { children: "Configure audio codec and quality. AAC is recommended for maximum compatibility." })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              value: config.audioCodec,
              onChange: (e) => updateConfig("audioCodec", e.target.value),
              className: "rounded-lg border border-slate-200 px-3 py-2 text-sm",
              children: AUDIO_CODECS.map((codec) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: codec.id, children: [
                codec.label,
                " ",
                codec.id === RECOMMENDED.audioCodec ? "(Recommended)" : ""
              ] }, codec.id))
            }
          ),
          config.audioCodec !== "copy" && config.audioCodec !== "none" && config.audioCodec !== "flac" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-500", children: "Quality:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                value: config.audioBitrate,
                onChange: (e) => updateConfig("audioBitrate", parseInt(e.target.value)),
                className: "rounded-lg border border-slate-200 px-2 py-1 text-sm",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "128", children: "128 kbps (Good)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "192", children: "192 kbps (High)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "256", children: "256 kbps (Very High)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "320", children: "320 kbps (Maximum)" })
                ]
              }
            )
          ] })
        ] })
      }
    ) })
  ] });
}
function SettingGroup({
  label,
  tooltip,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-slate-900", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(InfoTooltip, { content: tooltip })
    ] }),
    children
  ] });
}
function SliderSetting({
  label,
  value,
  min,
  max,
  step,
  defaultValue,
  onChange,
  formatValue
}) {
  const displayValue = formatValue ? formatValue(value) : value.toFixed(2);
  const isDefault = Math.abs(value - defaultValue) < 1e-3;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-24 text-sm text-slate-600", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type: "range",
        min,
        max,
        step,
        value,
        onChange: (e) => onChange(parseFloat(e.target.value)),
        className: "h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-14 text-right font-mono text-sm text-slate-900", children: displayValue }),
    !isDefault && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: () => onChange(defaultValue),
        className: "text-xs text-slate-400 hover:text-slate-600",
        children: "Reset"
      }
    )
  ] });
}
function Processing() {
  const [transcodeInput, setTranscodeInput] = reactExports.useState(null);
  const [transcriptionInput, setTranscriptionInput] = reactExports.useState(null);
  const [presets, setPresets] = reactExports.useState([]);
  const [presetId, setPresetId] = reactExports.useState("source-copy");
  const [transcodeJobs, setTranscodeJobs] = reactExports.useState([]);
  const [transcriptionJobs, setTranscriptionJobs] = reactExports.useState([]);
  const [error, setError] = reactExports.useState(null);
  const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
  const [modelPath, setModelPath] = reactExports.useState(null);
  const [isCanceling, setIsCanceling] = reactExports.useState(false);
  const [batchInputs, setBatchInputs] = reactExports.useState([]);
  const [batchStatus, setBatchStatus] = reactExports.useState(null);
  const [isBatchQueueing, setIsBatchQueueing] = reactExports.useState(false);
  const [detailsJobId, setDetailsJobId] = reactExports.useState(null);
  const [detailsJob, setDetailsJob] = reactExports.useState(null);
  const [detailsError, setDetailsError] = reactExports.useState(null);
  const [isDetailsLoading, setIsDetailsLoading] = reactExports.useState(false);
  const [detailsNotice, setDetailsNotice] = reactExports.useState(null);
  const detailsJobIdRef = reactExports.useRef(null);
  const [advancedInput, setAdvancedInput] = reactExports.useState(null);
  const [advancedConfig, setAdvancedConfig] = reactExports.useState(DEFAULT_ENCODING_CONFIG);
  const [availableHWAccel, setAvailableHWAccel] = reactExports.useState(["none"]);
  const [cpuCapabilities, setCpuCapabilities] = reactExports.useState(null);
  const [isAdvancedSubmitting, setIsAdvancedSubmitting] = reactExports.useState(false);
  const [advancedError, setAdvancedError] = reactExports.useState(null);
  const [showAdvancedPanel, setShowAdvancedPanel] = reactExports.useState(false);
  const [ffmpegPreview, setFfmpegPreview] = reactExports.useState(null);
  const [sourceInfo, setSourceInfo] = reactExports.useState(void 0);
  const [isProbing, setIsProbing] = reactExports.useState(false);
  const [aiVideoPath, setAiVideoPath] = reactExports.useState(null);
  const [isAiProcessing, setIsAiProcessing] = reactExports.useState(false);
  const [aiResult, setAiResult] = reactExports.useState(null);
  const [llmAvailable, setLlmAvailable] = reactExports.useState(false);
  const [aiFrameCount, setAiFrameCount] = reactExports.useState(8);
  const selectedPreset = reactExports.useMemo(
    () => presets.find((preset) => preset.id === presetId) ?? null,
    [presetId, presets]
  );
  reactExports.useEffect(() => {
    let active = true;
    let intervalId = null;
    const loadJobs = async () => {
      try {
        const [transcodeResult, transcriptionResult] = await Promise.all([
          window.api.processingList("transcode"),
          window.api.processingList("transcription")
        ]);
        if (!active) {
          return;
        }
        if (transcodeResult.ok) {
          setTranscodeJobs(transcodeResult.jobs);
          setError(null);
        } else {
          setError("Unable to load processing jobs.");
        }
        if (transcriptionResult.ok) {
          setTranscriptionJobs(transcriptionResult.jobs);
        }
        if (detailsJobIdRef.current) {
          const detailResult = await window.api.processingDetails(detailsJobIdRef.current);
          if (active) {
            if (detailResult.ok && detailResult.job) {
              setDetailsJob(detailResult.job);
              setDetailsError(null);
            } else if (detailResult.error) {
              setDetailsError(detailResult.error);
            }
          }
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load processing jobs.");
        }
      }
    };
    void loadJobs();
    window.api.processingPresets().then((result) => {
      if (active && result.ok) {
        setPresets(result.presets);
        if (result.presets.length > 0 && !result.presets.some((preset) => preset.id === presetId)) {
          setPresetId(result.presets[0].id);
        }
      }
    }).catch(() => {
      if (active) {
        setPresets([]);
      }
    });
    window.api.getWhisperModel().then((result) => {
      if (active && result.ok && result.path) {
        setModelPath(result.path);
      }
    }).catch(() => {
      if (active) {
        setModelPath(null);
      }
    });
    intervalId = setInterval(loadJobs, 5e3);
    return () => {
      active = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);
  reactExports.useEffect(() => {
    const unsubscribe = window.api.onProcessingEvent((event) => {
      const patchJob = (job) => {
        if (job.id !== event.jobId) {
          return job;
        }
        const updated = { ...job };
        if (event.kind === "progress" && event.progress != null) {
          updated.progress = event.progress;
        }
        if (event.kind === "log" && event.logTail != null) {
          updated.log_tail = event.logTail;
        }
        if (event.kind === "status") {
          if (event.status) {
            updated.status = event.status;
          }
          if (event.error != null) {
            updated.error_message = event.error;
          }
        }
        if (event.kind === "result" && event.result) {
          updated.result_json = event.result;
        }
        if (event.updatedAt) {
          updated.updated_at = event.updatedAt;
        }
        return updated;
      };
      if (event.jobType === "transcode") {
        setTranscodeJobs((prev) => prev.map(patchJob));
      } else if (event.jobType === "transcription") {
        setTranscriptionJobs((prev) => prev.map(patchJob));
      }
      if (detailsJobIdRef.current === event.jobId) {
        setDetailsJob((prev) => {
          if (!prev) {
            return prev;
          }
          const updated = { ...prev };
          if (event.kind === "progress" && event.progress != null) {
            updated.progress = event.progress;
          }
          if (event.kind === "log" && event.logTail != null) {
            updated.log_tail = event.logTail;
          }
          if (event.kind === "status") {
            if (event.status) {
              updated.status = event.status;
            }
            if (event.error != null) {
              updated.error_message = event.error;
            }
          }
          if (event.kind === "result" && event.result) {
            updated.result_json = event.result;
          }
          if (event.updatedAt) {
            updated.updated_at = event.updatedAt;
          }
          return updated;
        });
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);
  reactExports.useEffect(() => {
    detailsJobIdRef.current = detailsJobId;
  }, [detailsJobId]);
  reactExports.useEffect(() => {
    window.api.processingDetectHWAccel().then((result) => {
      if (result.ok && result.available) {
        setAvailableHWAccel(result.available);
        if (result.recommended && result.recommended !== "none") {
          setAdvancedConfig((prev) => ({ ...prev, hwAccel: result.recommended }));
        }
        if (result.cpuCapabilities) {
          setCpuCapabilities(result.cpuCapabilities);
        }
      }
    }).catch(() => {
      setAvailableHWAccel(["none"]);
    });
    window.api.smartTagging.llmAvailable().then((result) => {
      setLlmAvailable(result.available);
    }).catch(() => {
      setLlmAvailable(false);
    });
  }, []);
  reactExports.useEffect(() => {
    if (!advancedInput) {
      setFfmpegPreview(null);
      return;
    }
    const timeoutId = setTimeout(() => {
      window.api.processingPreviewCommand({ inputPath: advancedInput, config: advancedConfig }).then((result) => {
        if (result.ok && result.command) {
          setFfmpegPreview(result.command);
        } else {
          console.warn("Preview command failed:", result.error);
          setFfmpegPreview(null);
        }
      }).catch((err) => {
        console.error("Preview command error:", err);
        setFfmpegPreview(null);
      });
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [advancedInput, advancedConfig]);
  const handleAdvancedSelectInput = async () => {
    try {
      const result = await window.api.processingSelectInput();
      if (result.ok && result.path) {
        setAdvancedInput(result.path);
        setAdvancedError(null);
        setSourceInfo(void 0);
        setIsProbing(true);
        try {
          const probeResult = await window.api.processingProbeVideo(result.path);
          if (probeResult.ok && probeResult.metadata) {
            const m2 = probeResult.metadata;
            if (m2.duration && m2.width && m2.height) {
              setSourceInfo({
                duration: m2.duration,
                width: m2.width,
                height: m2.height,
                frameRate: m2.frameRate ?? 30,
                bitrate: m2.bitrate ?? 0,
                codec: m2.codec ?? "unknown"
              });
            }
          }
        } catch {
        } finally {
          setIsProbing(false);
        }
      } else if (!result.canceled) {
        setAdvancedError(result.error ?? "Unable to select file.");
      }
    } catch (err) {
      setAdvancedError(err instanceof Error ? err.message : "Unable to select file.");
    }
  };
  const handleAdvancedTranscode = async () => {
    if (!advancedInput) {
      setAdvancedError("Select a file to encode.");
      return;
    }
    setIsAdvancedSubmitting(true);
    setAdvancedError(null);
    try {
      const result = await window.api.processingAdvancedTranscode({
        inputPath: advancedInput,
        config: advancedConfig
      });
      if (!result.ok) {
        setAdvancedError(result.error ?? "Unable to queue encoding job.");
        return;
      }
      setAdvancedInput(null);
      setSourceInfo(void 0);
      setShowAdvancedPanel(false);
    } catch (err) {
      setAdvancedError(err instanceof Error ? err.message : "Unable to queue encoding job.");
    } finally {
      setIsAdvancedSubmitting(false);
    }
  };
  const handleConfigChange = reactExports.useCallback((newConfig) => {
    setAdvancedConfig(newConfig);
  }, []);
  const handleAiSelectVideo = async () => {
    try {
      const result = await window.api.processingSelectInput();
      if (result.ok && result.path) {
        setAiVideoPath(result.path);
        setAiResult(null);
      }
    } catch (err) {
      setAiResult({ error: err instanceof Error ? err.message : "Failed to select file" });
    }
  };
  const handleAiAnalyze = async () => {
    if (!aiVideoPath) {
      setAiResult({ error: "Select a video file first" });
      return;
    }
    setIsAiProcessing(true);
    setAiResult(null);
    try {
      const result = await window.api.processingAnalyzeVision({
        videoPath: aiVideoPath,
        maxFrames: aiFrameCount
      });
      if (!result.ok) {
        setAiResult({ error: result.error ?? "Vision analysis failed" });
        return;
      }
      setAiResult({
        analysis: result.analysis,
        tags: result.tags,
        framesAnalyzed: result.framesAnalyzed
      });
    } catch (err) {
      setAiResult({ error: err instanceof Error ? err.message : "AI analysis failed" });
    } finally {
      setIsAiProcessing(false);
    }
  };
  const handleSelectInput = async (setter) => {
    try {
      const result = await window.api.processingSelectInput();
      if (result.ok && result.path) {
        setter(result.path);
        setError(null);
      } else if (!result.canceled) {
        setError(result.error ?? "Unable to select file.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to select file.");
    }
  };
  const handleTranscode = async () => {
    if (!transcodeInput) {
      setError("Select a file to transcode.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await window.api.processingTranscode({ inputPath: transcodeInput, presetId });
      if (!result.ok) {
        setError(result.error ?? "Unable to queue transcode.");
        return;
      }
      setTranscodeInput(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to queue transcode.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSelectModel = async () => {
    try {
      const result = await window.api.selectWhisperModel();
      if (result.ok && result.path) {
        setModelPath(result.path);
        setError(null);
      } else if (!result.canceled) {
        setError(result.error ?? "Unable to select model.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to select model.");
    }
  };
  const handleTranscribe = async () => {
    if (!transcriptionInput) {
      setError("Select a file to transcribe.");
      return;
    }
    if (!modelPath) {
      setError("Select a whisper model.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await window.api.processingTranscribe({ inputPath: transcriptionInput, modelPath });
      if (!result.ok) {
        setError(result.error ?? "Unable to queue transcription.");
        return;
      }
      setTranscriptionInput(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to queue transcription.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleCancelJob = async (jobId) => {
    setIsCanceling(true);
    try {
      const result = await window.api.processingCancel(jobId);
      if (!result.ok) {
        setError(result.error ?? "Unable to cancel job.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel job.");
    } finally {
      setIsCanceling(false);
    }
  };
  const handleOpenDetails = async (jobId) => {
    setDetailsJobId(jobId);
    setIsDetailsLoading(true);
    setDetailsError(null);
    try {
      const result = await window.api.processingDetails(jobId);
      if (result.ok && result.job) {
        setDetailsJob(result.job);
      } else {
        setDetailsError(result.error ?? "Unable to load job details.");
      }
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : "Unable to load job details.");
    } finally {
      setIsDetailsLoading(false);
    }
  };
  const handleCloseDetails = () => {
    setDetailsJobId(null);
    setDetailsJob(null);
    setDetailsError(null);
    setDetailsNotice(null);
  };
  const handleCopyLog = async () => {
    if (!detailsJob?.log_tail) {
      setDetailsNotice("No logs to copy.");
      return;
    }
    try {
      const result = await window.api.copyToClipboard(detailsJob.log_tail);
      setDetailsNotice(result.ok ? "Log copied to clipboard." : result.error ?? "Unable to copy log.");
    } catch (err) {
      setDetailsNotice(err instanceof Error ? err.message : "Unable to copy log.");
    }
  };
  const handleRevealOutput = async () => {
    if (!detailsJob?.output_path) {
      setDetailsNotice("No output path available.");
      return;
    }
    try {
      const result = await window.api.revealInFolder(detailsJob.output_path);
      if (!result.ok) {
        setDetailsNotice(result.error ?? "Unable to reveal output.");
      }
    } catch (err) {
      setDetailsNotice(err instanceof Error ? err.message : "Unable to reveal output.");
    }
  };
  const formatLogSnippet = (logTail) => {
    if (!logTail) {
      return null;
    }
    const lines = logTail.trim().split("\n");
    return lines[lines.length - 1] ?? null;
  };
  const renderOutputMetadata = (details) => {
    if (!details.result_json) {
      return null;
    }
    const metadata = details.result_json.metadata;
    const transcriptLength = details.result_json.transcriptLength;
    const outputSize = details.result_json.outputSize;
    if (!metadata && transcriptLength == null && outputSize == null) {
      return null;
    }
    const formatBytes = (bytes) => {
      if (!bytes || bytes <= 0) {
        return "n/a";
      }
      const units = ["B", "KB", "MB", "GB", "TB"];
      const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
      const value = bytes / Math.pow(1024, index);
      return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
    };
    const formatDuration2 = (seconds) => {
      if (!seconds || seconds <= 0) {
        return "n/a";
      }
      const total = Math.floor(seconds);
      const hrs = Math.floor(total / 3600);
      const mins = Math.floor(total % 3600 / 60);
      const secs = total % 60;
      if (hrs > 0) {
        return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      }
      return `${mins}:${String(secs).padStart(2, "0")}`;
    };
    const formatBitrate = (value) => {
      if (!value || value <= 0) {
        return "n/a";
      }
      const kbps = value / 1e3;
      if (kbps < 1e3) {
        return `${Math.round(kbps)} Kbps`;
      }
      const mbps = kbps / 1e3;
      return `${mbps.toFixed(mbps >= 10 ? 0 : 1)} Mbps`;
    };
    const formatMetaValue = (key, value) => {
      if (value == null) {
        return "n/a";
      }
      if (key === "fileSize") {
        return formatBytes(value);
      }
      if (key === "bitrate") {
        return formatBitrate(value);
      }
      if (key === "duration") {
        return formatDuration2(value);
      }
      return String(value);
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-xs text-slate-600", children: [
      metadata ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-slate-100 bg-slate-50 px-3 py-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] uppercase tracking-[0.3em] text-slate-400", children: "Output metadata" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 grid gap-1", children: Object.entries(metadata).map(([key, value]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold", children: [
            key,
            ":"
          ] }),
          " ",
          formatMetaValue(key, value)
        ] }, key)) })
      ] }) : null,
      transcriptLength != null || outputSize != null ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-slate-100 bg-slate-50 px-3 py-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] uppercase tracking-[0.3em] text-slate-400", children: "Transcript stats" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Characters:" }),
          " ",
          transcriptLength ?? "n/a"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Output size:" }),
          " ",
          formatBytes(outputSize)
        ] })
      ] }) : null
    ] });
  };
  const handleSelectBatch = async () => {
    setBatchStatus(null);
    try {
      const result = await window.api.processingSelectBatch();
      if (result.ok && result.paths) {
        setBatchInputs(result.paths);
      } else if (!result.canceled) {
        setError(result.error ?? "Unable to select files.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to select files.");
    }
  };
  const handleQueueBatch = async () => {
    if (batchInputs.length === 0) {
      setBatchStatus("Select at least one file.");
      return;
    }
    setIsBatchQueueing(true);
    setBatchStatus(null);
    let queued = 0;
    let failed = 0;
    try {
      for (const inputPath of batchInputs) {
        const result = await window.api.processingTranscode({ inputPath, presetId });
        if (result.ok) {
          queued += 1;
        } else {
          failed += 1;
        }
      }
      setBatchStatus(`Queued ${queued} jobs${failed ? ` · ${failed} failed` : ""}`);
      if (failed === 0) {
        setBatchInputs([]);
      }
    } catch (err) {
      setBatchStatus(err instanceof Error ? err.message : "Unable to queue batch.");
    } finally {
      setIsBatchQueueing(false);
    }
  };
  const statusTone = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "running":
        return "bg-slate-900 text-white";
      case "failed":
        return "bg-rose-100 text-rose-700";
      case "cancelled":
        return "bg-slate-100 text-slate-500";
      case "queued":
      default:
        return "bg-amber-100 text-amber-700";
    }
  };
  const formatErrorMessage = (job) => {
    if (!job.error_message) {
      return null;
    }
    if (job.status === "cancelled") {
      return "Canceled by user.";
    }
    if (job.error_message === "missing_input") {
      return "Missing input file.";
    }
    if (job.error_message === "missing_model") {
      return "Missing transcription model.";
    }
    return job.error_message;
  };
  const renderProgress = (job) => {
    if (job.progress == null) {
      if (job.status === "running") {
        return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-[11px] text-slate-400", children: "Progress: estimating..." });
      }
      return null;
    }
    const value = Math.max(0, Math.min(100, Math.round(job.progress)));
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-[11px] text-slate-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Progress" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          value,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-full overflow-hidden rounded-full bg-slate-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full rounded-full bg-slate-900", style: { width: `${value}%` } }) })
    ] });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "grid gap-4 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Transcode a file" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Run ffmpeg presets on local files. Output files are created alongside the source." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Input file" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 truncate", children: transcodeInput ?? "No file selected" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => void handleSelectInput(setTranscodeInput),
                className: "mt-3 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500",
                children: "Choose file"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-semibold text-slate-700", children: [
            "Preset",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "select",
              {
                value: presetId,
                onChange: (event) => setPresetId(event.target.value),
                className: "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600",
                children: presets.map((preset) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: preset.id, children: preset.label }, preset.id))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Preset details" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-600", children: selectedPreset?.description ?? "Select a preset to see details." }),
            selectedPreset?.outputExtension ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs text-slate-500", children: [
              "Output extension: ",
              selectedPreset.outputExtension
            ] }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleTranscode(),
              disabled: isSubmitting,
              className: "w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70",
              children: isSubmitting ? "Queueing..." : "Queue transcode"
            }
          ),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-rose-600", children: error }) : null
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Processing queue" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Recent transcode jobs and their status." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 space-y-3", children: transcodeJobs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400", children: "No processing jobs yet" }) : transcodeJobs.map((job) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-semibold text-slate-900", children: job.input_path ?? "Unknown input" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 truncate text-xs text-slate-400", children: job.output_path ?? "Output pending" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(job.status)}`, children: job.status }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: new Date(job.created_at).toLocaleString() })
          ] }),
          renderProgress(job),
          formatErrorMessage(job) ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-rose-600", children: formatErrorMessage(job) }) : null,
          formatLogSnippet(job.log_tail) ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 truncate text-[11px] text-slate-400", children: formatLogSnippet(job.log_tail) }) : null,
          ["queued", "running"].includes(job.status) ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleCancelJob(job.id),
              disabled: isCanceling,
              className: "mt-3 rounded-full border border-rose-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-600",
              children: isCanceling ? "Canceling..." : "Cancel"
            }
          ) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleOpenDetails(job.id),
              className: "mt-3 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600",
              children: "Details"
            }
          )
        ] }, job.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Transcribe audio" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Whisper transcription jobs attach transcripts to library items." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Input file" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 truncate", children: transcriptionInput ?? "No file selected" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => void handleSelectInput(setTranscriptionInput),
                className: "mt-3 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500",
                children: "Choose file"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Model" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 truncate", children: modelPath ?? "No model selected" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => void handleSelectModel(),
                className: "mt-3 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500",
                children: "Choose model"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleTranscribe(),
              disabled: isSubmitting,
              className: "w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70",
              children: isSubmitting ? "Queueing..." : "Queue transcription"
            }
          ),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-rose-600", children: error }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 space-y-3", children: transcriptionJobs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400", children: "No transcription jobs yet" }) : transcriptionJobs.map((job) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-semibold text-slate-900", children: job.input_path ?? "Unknown input" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 truncate text-xs text-slate-400", children: job.output_path ?? "Output pending" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(job.status)}`, children: job.status }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: new Date(job.created_at).toLocaleString() })
          ] }),
          renderProgress(job),
          formatErrorMessage(job) ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-rose-600", children: formatErrorMessage(job) }) : null,
          formatLogSnippet(job.log_tail) ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 truncate text-[11px] text-slate-400", children: formatLogSnippet(job.log_tail) }) : null,
          ["queued", "running"].includes(job.status) ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleCancelJob(job.id),
              disabled: isCanceling,
              className: "mt-3 rounded-full border border-rose-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-600",
              children: isCanceling ? "Canceling..." : "Cancel"
            }
          ) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleOpenDetails(job.id),
              className: "mt-3 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600",
              children: "Details"
            }
          )
        ] }, job.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-slate-200/70 bg-slate-900 p-6 text-white shadow-lg shadow-slate-900/20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Automation" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-3 text-xl font-semibold", children: "Create a processing batch" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-300", children: "Queue multiple files with the selected preset." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleSelectBatch(),
              className: "rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white",
              children: "Select files"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => setBatchInputs([]),
              className: "rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80",
              disabled: batchInputs.length === 0,
              children: "Clear"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleQueueBatch(),
              className: "rounded-full bg-white px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900",
              disabled: isBatchQueueing || batchInputs.length === 0,
              children: isBatchQueueing ? "Queueing..." : "Queue batch"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: batchInputs.length === 0 ? "No files selected." : `${batchInputs.length} file${batchInputs.length === 1 ? "" : "s"} selected` }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs text-slate-400", children: [
          "Preset: ",
          selectedPreset?.label ?? "Source Copy"
        ] }),
        batchInputs.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 max-h-28 space-y-1 overflow-y-auto text-xs text-slate-400", children: [
          batchInputs.slice(0, 6).map((path) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate", children: path }, path)),
          batchInputs.length > 6 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-slate-500", children: [
            "+",
            batchInputs.length - 6,
            " more"
          ] }) : null
        ] }) : null,
        batchStatus ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            className: `mt-3 text-xs ${batchStatus.toLowerCase().includes("fail") ? "text-rose-300" : "text-emerald-300"}`,
            children: batchStatus
          }
        ) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-slate-200/70 bg-white shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => setShowAdvancedPanel(!showAdvancedPanel),
          className: "flex w-full items-center justify-between p-6",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-left", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Advanced Encoding" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Full control over video codec, quality, resolution, filters, and hardware acceleration." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              availableHWAccel.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700", children: "HW Accel Available" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "svg",
                {
                  className: `h-5 w-5 text-slate-400 transition-transform ${showAdvancedPanel ? "rotate-180" : ""}`,
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" })
                }
              )
            ] })
          ]
        }
      ),
      showAdvancedPanel && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-slate-100 p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Input file" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 truncate text-sm text-slate-600", children: advancedInput ?? "No file selected" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleAdvancedSelectInput(),
              className: "mt-3 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500",
              children: "Choose file"
            }
          )
        ] }),
        isProbing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center gap-2 text-sm text-slate-500", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "h-4 w-4 animate-spin", viewBox: "0 0 24 24", fill: "none", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })
          ] }),
          "Analyzing video..."
        ] }),
        sourceInfo && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Source:" }),
          " ",
          sourceInfo.width,
          "×",
          sourceInfo.height,
          " • ",
          sourceInfo.codec.toUpperCase(),
          " • ",
          Math.round(sourceInfo.frameRate),
          "fps • ",
          Math.floor(sourceInfo.duration / 60),
          ":",
          String(Math.floor(sourceInfo.duration % 60)).padStart(2, "0"),
          sourceInfo.bitrate > 0 && ` • ${(sourceInfo.bitrate / 1e6).toFixed(1)} Mbps`
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          VideoEncodingSettings,
          {
            config: advancedConfig,
            onChange: handleConfigChange,
            sourceInfo,
            availableHWAccel,
            cpuCapabilities
          }
        ),
        ffmpegPreview && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "FFmpeg command preview" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("pre", { className: "mt-2 max-h-24 overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-[11px] text-slate-600", children: [
            "ffmpeg ",
            ffmpegPreview.join(" ")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleAdvancedTranscode(),
              disabled: isAdvancedSubmitting || !advancedInput,
              className: "flex-1 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70",
              children: isAdvancedSubmitting ? "Queueing..." : "Start Encoding"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                setAdvancedConfig(DEFAULT_ENCODING_CONFIG);
                setAdvancedInput(null);
                setSourceInfo(void 0);
              },
              className: "rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600",
              children: "Reset"
            }
          )
        ] }),
        advancedError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-sm text-rose-600", children: advancedError })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-slate-200/70 bg-gradient-to-br from-violet-50 to-indigo-50 p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start justify-between gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "AI Video Analysis" }),
          llmAvailable ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700", children: "LLM Connected" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700", children: "LLM Not Configured" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Analyze the entire video with AI vision. Frames are extracted and sent directly to the LLM for comprehensive analysis." })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-white/50 bg-white/70 px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Video file" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 truncate text-sm text-slate-600", children: aiVideoPath ?? "No file selected" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleAiSelectVideo(),
              className: "mt-3 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500",
              children: "Choose file"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-white/50 bg-white/70 px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Frames to analyze" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-violet-600", children: aiFrameCount })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "range",
              min: 4,
              max: 20,
              step: 2,
              value: aiFrameCount,
              onChange: (e) => setAiFrameCount(Number(e.target.value)),
              className: "mt-2 w-full accent-violet-600"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] text-slate-400", children: "More frames = more comprehensive analysis but higher cost/time" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleAiAnalyze(),
              disabled: isAiProcessing || !aiVideoPath || !llmAvailable,
              className: "flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 disabled:cursor-not-allowed disabled:opacity-50",
              children: isAiProcessing ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center justify-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "h-4 w-4 animate-spin", viewBox: "0 0 24 24", fill: "none", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })
                ] }),
                "Analyzing ",
                aiFrameCount,
                " frames..."
              ] }) : `Analyze with AI (${aiFrameCount} frames)`
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                setAiVideoPath(null);
                setAiResult(null);
              },
              className: "rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600",
              children: "Clear"
            }
          )
        ] }),
        !llmAvailable && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-600", children: "Configure an LLM provider in Settings to enable AI analysis." }),
        aiResult?.error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-rose-200 bg-rose-50 px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-rose-600", children: aiResult.error }) }),
        aiResult?.analysis && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-violet-200 bg-white px-4 py-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium uppercase tracking-[0.3em] text-violet-600", children: "Analysis" }),
              aiResult.framesAnalyzed && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] text-slate-400", children: [
                aiResult.framesAnalyzed,
                " frames analyzed"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap text-sm text-slate-700", children: aiResult.analysis }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: async () => {
                  if (aiResult.analysis) {
                    await window.api.copyToClipboard(aiResult.analysis);
                  }
                },
                className: "mt-3 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-600",
                children: "Copy analysis"
              }
            )
          ] }),
          aiResult.tags && aiResult.tags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium uppercase tracking-[0.3em] text-emerald-600", children: "Suggested Tags" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: aiResult.tags.map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: "rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm",
                children: tag
              },
              tag
            )) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: async () => {
                  if (aiResult.tags) {
                    await window.api.copyToClipboard(aiResult.tags.join(", "));
                  }
                },
                className: "mt-3 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600",
                children: "Copy tags"
              }
            )
          ] })
        ] })
      ] })
    ] }),
    detailsJobId ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 z-50 flex", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "absolute inset-0 bg-black/40",
          onClick: handleCloseDetails,
          "aria-label": "Close details"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "relative ml-auto h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Job details" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "mt-2 text-lg font-semibold text-slate-900", children: [
              detailsJob?.type ?? "Processing",
              " · ",
              detailsJob?.status ?? ""
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: handleCloseDetails,
              className: "rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600",
              children: "Close"
            }
          )
        ] }),
        isDetailsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-sm text-slate-500", children: "Loading details..." }) : detailsError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-sm text-rose-600", children: detailsError }) : detailsJob ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-4 text-sm text-slate-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-slate-50 px-4 py-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Paths" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-slate-500", children: "Input" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 break-words text-sm text-slate-700", children: detailsJob.input_path ?? "n/a" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xs text-slate-500", children: "Output" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 break-words text-sm text-slate-700", children: detailsJob.output_path ?? "n/a" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => void handleRevealOutput(),
                className: "rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600",
                disabled: !detailsJob.output_path,
                children: "Reveal output"
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-slate-50 px-4 py-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(detailsJob.status)}`, children: detailsJob.status }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-slate-500", children: [
                "Created ",
                new Date(detailsJob.created_at).toLocaleString()
              ] }),
              detailsJob.updated_at ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-slate-500", children: [
                "Updated ",
                new Date(detailsJob.updated_at).toLocaleString()
              ] }) : null
            ] }),
            detailsJob.progress != null ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3", children: renderProgress(detailsJob) }) : null,
            formatErrorMessage(detailsJob) ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xs text-rose-600", children: formatErrorMessage(detailsJob) }) : null
          ] }),
          renderOutputMetadata(detailsJob),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-slate-50 px-4 py-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Log tail" }),
            detailsJob.log_tail ? /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-[11px] text-slate-700", children: detailsJob.log_tail }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-slate-500", children: "No logs captured yet." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => void handleCopyLog(),
                className: "rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600",
                disabled: !detailsJob.log_tail,
                children: "Copy log"
              }
            ) })
          ] }),
          detailsNotice ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: detailsNotice }) : null
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-sm text-slate-500", children: "No job selected." })
      ] })
    ] }) : null
  ] });
}
const settings = [
  {
    title: "General",
    description: "Theme, language, and default workspace locations."
  },
  {
    title: "Downloads",
    description: "Default formats, concurrency, and post-processing."
  },
  {
    title: "AI + Tagging",
    description: "LLM providers, prompts, and confidence thresholds."
  },
  {
    title: "Authentication",
    description: "Cookie sessions for premium or restricted platforms."
  },
  {
    title: "Privacy",
    description: "Sensitive content handling, local-only modes, and logging."
  }
];
const DEFAULT_LMSTUDIO_URL = "http://localhost:1234/v1";
const DEFAULT_LMSTUDIO_MODEL = "auto";
const DEFAULT_OPENROUTER_MODEL = "anthropic/claude-3.5-sonnet";
const AUTH_PLATFORMS = ["youtube", "tiktok", "instagram", "twitter", "reddit", "vimeo", "other"];
function Settings() {
  const [binaries, setBinaries] = reactExports.useState([]);
  const [binaryError, setBinaryError] = reactExports.useState(null);
  const [binaryStatus, setBinaryStatus] = reactExports.useState(null);
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const [isRepairing, setIsRepairing] = reactExports.useState(false);
  const [llmSettings, setLlmSettings] = reactExports.useState(null);
  const [llmProvider, setLlmProvider] = reactExports.useState("lmstudio");
  const [openrouterModel, setOpenrouterModel] = reactExports.useState("");
  const [openrouterApiKey, setOpenrouterApiKey] = reactExports.useState("");
  const [lmstudioBaseUrl, setLmstudioBaseUrl] = reactExports.useState("");
  const [lmstudioModel, setLmstudioModel] = reactExports.useState("");
  const [llmStatus, setLlmStatus] = reactExports.useState(null);
  const [llmError, setLlmError] = reactExports.useState(null);
  const [isLlmSaving, setIsLlmSaving] = reactExports.useState(false);
  const [isLlmTesting, setIsLlmTesting] = reactExports.useState(false);
  const [authSessions, setAuthSessions] = reactExports.useState([]);
  const [authPlatform, setAuthPlatform] = reactExports.useState("youtube");
  const [authAccountName, setAuthAccountName] = reactExports.useState("");
  const [authCookiePath, setAuthCookiePath] = reactExports.useState("");
  const [authStatus, setAuthStatus] = reactExports.useState(null);
  const [authError, setAuthError] = reactExports.useState(null);
  const [authWarning, setAuthWarning] = reactExports.useState(null);
  const [isAuthLoading, setIsAuthLoading] = reactExports.useState(false);
  const [isAuthSelecting, setIsAuthSelecting] = reactExports.useState(false);
  const [isAuthImporting, setIsAuthImporting] = reactExports.useState(false);
  const [downloadSettings, setDownloadSettings] = reactExports.useState(null);
  const [downloadProxy, setDownloadProxy] = reactExports.useState("");
  const [downloadRateLimit, setDownloadRateLimit] = reactExports.useState("");
  const [downloadRateLimitMs, setDownloadRateLimitMs] = reactExports.useState("0");
  const [downloadDedupeEnabled, setDownloadDedupeEnabled] = reactExports.useState(true);
  const [downloadStatus, setDownloadStatus] = reactExports.useState(null);
  const [downloadError, setDownloadError] = reactExports.useState(null);
  const [isDownloadSaving, setIsDownloadSaving] = reactExports.useState(false);
  const [uiSettings, setUiSettings] = reactExports.useState(null);
  const [uiTheme, setUiTheme] = reactExports.useState("light");
  const [uiStatus, setUiStatus] = reactExports.useState(null);
  const [uiError, setUiError] = reactExports.useState(null);
  const [isUiSaving, setIsUiSaving] = reactExports.useState(false);
  const [privacySettings, setPrivacySettings] = reactExports.useState(null);
  const [privacyDraft, setPrivacyDraft] = reactExports.useState(null);
  const [privacyStatus, setPrivacyStatus] = reactExports.useState(null);
  const [privacyError, setPrivacyError] = reactExports.useState(null);
  const [isPrivacySaving, setIsPrivacySaving] = reactExports.useState(false);
  const [privacyPin, setPrivacyPin] = reactExports.useState("");
  const [privacyPinConfirm, setPrivacyPinConfirm] = reactExports.useState("");
  const [privacyPinStatus, setPrivacyPinStatus] = reactExports.useState(null);
  const [privacyPinError, setPrivacyPinError] = reactExports.useState(null);
  const [isPrivacyPinSaving, setIsPrivacyPinSaving] = reactExports.useState(false);
  const [isPrivacyPinClearing, setIsPrivacyPinClearing] = reactExports.useState(false);
  const [watchFolder, setWatchFolder] = reactExports.useState(null);
  const [watchFolderStatus, setWatchFolderStatus] = reactExports.useState(null);
  const [watchFolderError, setWatchFolderError] = reactExports.useState(null);
  const [appLockEnabled, setAppLockEnabled] = reactExports.useState(false);
  const [appPasswordSet, setAppPasswordSet] = reactExports.useState(false);
  const [appLockPassword, setAppLockPassword] = reactExports.useState("");
  const [appLockConfirmPassword, setAppLockConfirmPassword] = reactExports.useState("");
  const [appLockCurrentPassword, setAppLockCurrentPassword] = reactExports.useState("");
  const [appLockStatus, setAppLockStatus] = reactExports.useState(null);
  const [appLockError, setAppLockError] = reactExports.useState(null);
  const [isAppLockSaving, setIsAppLockSaving] = reactExports.useState(false);
  const [isWatchFolderSaving, setIsWatchFolderSaving] = reactExports.useState(false);
  const [isWatchFolderSelecting, setIsWatchFolderSelecting] = reactExports.useState(false);
  const [isWatchFolderScanning, setIsWatchFolderScanning] = reactExports.useState(false);
  const appearanceRef = reactExports.useRef(null);
  const downloadRef = reactExports.useRef(null);
  const llmRef = reactExports.useRef(null);
  const authRef = reactExports.useRef(null);
  const privacyRef = reactExports.useRef(null);
  const formatDateTime = (value) => {
    if (!value) {
      return "Not available";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleString();
  };
  const loadBinaries = async () => {
    setIsLoading(true);
    try {
      const result = await window.api.systemBinaries();
      if (!result.ok) {
        setBinaryError("Unable to check binaries.");
        return;
      }
      const rows = result.binaries.map((binary) => {
        if (!binary.exists) {
          return {
            name: binary.name,
            status: "missing",
            detail: "Missing binary",
            path: binary.path
          };
        }
        if (!binary.executable) {
          return {
            name: binary.name,
            status: "error",
            detail: "Not executable",
            path: binary.path
          };
        }
        return {
          name: binary.name,
          status: binary.version ? "ok" : "error",
          detail: binary.version ?? (binary.error ?? "Unknown"),
          path: binary.path
        };
      });
      setBinaries(rows);
      setBinaryError(null);
      setBinaryStatus(null);
    } catch (err) {
      setBinaryError(err instanceof Error ? err.message : "Unable to check binaries.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleRepairBinaries = async () => {
    setIsRepairing(true);
    setBinaryError(null);
    setBinaryStatus(null);
    try {
      const result = await window.api.systemRepairBinaries();
      if (!result.ok) {
        setBinaryError(result.error ?? "Unable to repair binaries.");
      } else {
        const repaired = result.repaired?.length ?? 0;
        const missing = result.missing?.length ?? 0;
        const errors = result.errors ?? [];
        await loadBinaries();
        setBinaryStatus(`Repaired ${repaired} binaries${missing ? ` · ${missing} missing` : ""}.`);
        if (errors.length > 0) {
          const names = errors.map((entry) => entry.name).join(", ");
          setBinaryError(`Repair completed with ${errors.length} error(s): ${names}`);
        }
      }
    } catch (err) {
      setBinaryError(err instanceof Error ? err.message : "Unable to repair binaries.");
    } finally {
      setIsRepairing(false);
    }
  };
  const handleOpenBinariesFolder = async () => {
    try {
      const result = await window.api.systemOpenBinariesFolder();
      if (!result.ok) {
        setBinaryError(result.error ?? "Unable to open binaries folder.");
      }
    } catch (err) {
      setBinaryError(err instanceof Error ? err.message : "Unable to open binaries folder.");
    }
  };
  const handleConfigure = (target) => {
    target.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const syncLlmState = (settings2) => {
    setLlmSettings(settings2);
    setLlmProvider(settings2.provider);
    setOpenrouterModel(settings2.openrouter.model ?? "");
    setLmstudioBaseUrl(settings2.lmstudio.baseUrl);
    setLmstudioModel(settings2.lmstudio.model ?? "");
  };
  const loadLlmSettings = async () => {
    try {
      const result = await window.api.llmGetSettings();
      if (result.ok && result.settings) {
        syncLlmState(result.settings);
        setLlmError(null);
      } else {
        setLlmError(result.error ?? "Unable to load LLM settings.");
      }
    } catch (err) {
      setLlmError(err instanceof Error ? err.message : "Unable to load LLM settings.");
    }
  };
  const handleSaveLlmSettings = async () => {
    setIsLlmSaving(true);
    setLlmStatus(null);
    setLlmError(null);
    const payload = {
      provider: llmProvider,
      openrouterModel: openrouterModel.trim() || DEFAULT_OPENROUTER_MODEL,
      lmstudioBaseUrl: lmstudioBaseUrl.trim() || DEFAULT_LMSTUDIO_URL,
      lmstudioModel: lmstudioModel.trim() || DEFAULT_LMSTUDIO_MODEL
    };
    if (openrouterApiKey.trim()) {
      payload.openrouterApiKey = openrouterApiKey.trim();
    }
    try {
      const result = await window.api.llmUpdateSettings(payload);
      if (result.ok && result.settings) {
        syncLlmState(result.settings);
        setOpenrouterApiKey("");
        setLlmStatus("Settings saved.");
      } else {
        setLlmError(result.error ?? "Unable to save LLM settings.");
      }
    } catch (err) {
      setLlmError(err instanceof Error ? err.message : "Unable to save LLM settings.");
    } finally {
      setIsLlmSaving(false);
    }
  };
  const handleTestConnection = async () => {
    setIsLlmTesting(true);
    setLlmStatus(null);
    setLlmError(null);
    try {
      const result = await window.api.llmTestConnection(llmProvider);
      if (!result.ok) {
        setLlmError(result.error ?? "Unable to test connection.");
      } else if (result.available) {
        setLlmStatus("Connection successful.");
      } else {
        setLlmError(result.error ?? "Provider unavailable.");
      }
    } catch (err) {
      setLlmError(err instanceof Error ? err.message : "Unable to test connection.");
    } finally {
      setIsLlmTesting(false);
    }
  };
  const loadAuthSessions = async () => {
    setIsAuthLoading(true);
    try {
      const result = await window.api.authListSessions();
      if (result.ok && result.sessions) {
        setAuthSessions(result.sessions);
        setAuthError(null);
      } else {
        setAuthError(result.error ?? "Unable to load sessions.");
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Unable to load sessions.");
    } finally {
      setIsAuthLoading(false);
    }
  };
  const handleSelectCookieFile = async () => {
    setIsAuthSelecting(true);
    setAuthStatus(null);
    setAuthError(null);
    setAuthWarning(null);
    try {
      const result = await window.api.authSelectCookieFile();
      if (result.ok && result.path) {
        setAuthCookiePath(result.path);
      } else if (!result.canceled) {
        setAuthError(result.error ?? "Unable to select cookie file.");
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Unable to select cookie file.");
    } finally {
      setIsAuthSelecting(false);
    }
  };
  const handleImportCookies = async () => {
    setIsAuthImporting(true);
    setAuthStatus(null);
    setAuthError(null);
    setAuthWarning(null);
    const platform = authPlatform.trim();
    if (!platform) {
      setAuthError("Platform is required.");
      setIsAuthImporting(false);
      return;
    }
    if (!authCookiePath) {
      setAuthError("Select a cookie file first.");
      setIsAuthImporting(false);
      return;
    }
    try {
      const result = await window.api.authImportCookies({
        platform,
        filePath: authCookiePath,
        accountName: authAccountName.trim() || null
      });
      if (result.ok) {
        setAuthStatus(
          `Imported ${result.cookieCount ?? 0} cookies for ${platform}.`
        );
        if (result.storage === "plain") {
          setAuthWarning("Secure storage is unavailable. Cookies were saved in plain text.");
        }
        setAuthCookiePath("");
        setAuthAccountName("");
        await loadAuthSessions();
      } else {
        setAuthError(result.error ?? "Unable to import cookies.");
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Unable to import cookies.");
    } finally {
      setIsAuthImporting(false);
    }
  };
  const handleSetActiveSession = async (sessionId) => {
    setAuthStatus(null);
    setAuthError(null);
    setAuthWarning(null);
    try {
      const result = await window.api.authSetActive(sessionId);
      if (result.ok) {
        setAuthStatus("Session activated.");
        await loadAuthSessions();
      } else {
        setAuthError(result.error ?? "Unable to activate session.");
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Unable to activate session.");
    }
  };
  const handleDeleteSession = async (sessionId) => {
    setAuthStatus(null);
    setAuthError(null);
    setAuthWarning(null);
    try {
      const result = await window.api.authDeleteSession(sessionId);
      if (result.ok) {
        setAuthStatus("Session deleted.");
        await loadAuthSessions();
      } else {
        setAuthError(result.error ?? "Unable to delete session.");
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Unable to delete session.");
    }
  };
  const loadDownloadSettings = async () => {
    try {
      const result = await window.api.downloadGetSettings();
      if (result.ok && result.settings) {
        setDownloadSettings(result.settings);
        setDownloadProxy(result.settings.proxy ?? "");
        setDownloadRateLimit(result.settings.rateLimit ?? "");
        setDownloadRateLimitMs(result.settings.rateLimitMs ? result.settings.rateLimitMs.toString() : "0");
        setDownloadDedupeEnabled(result.settings.dedupeEnabled);
        setDownloadError(null);
      } else {
        setDownloadError(result.error ?? "Unable to load download settings.");
      }
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Unable to load download settings.");
    }
  };
  const handleSaveDownloadSettings = async () => {
    setIsDownloadSaving(true);
    setDownloadStatus(null);
    setDownloadError(null);
    try {
      const nextProxy = downloadProxy.trim();
      const parsedDelay = Number(downloadRateLimitMs);
      const result = await window.api.downloadUpdateSettings({
        proxy: nextProxy ? nextProxy : null,
        rateLimit: downloadRateLimit.trim() ? downloadRateLimit.trim() : null,
        rateLimitMs: Number.isFinite(parsedDelay) ? parsedDelay : 0,
        dedupeEnabled: downloadDedupeEnabled
      });
      if (result.ok && result.settings) {
        setDownloadSettings(result.settings);
        setDownloadProxy(result.settings.proxy ?? "");
        setDownloadRateLimit(result.settings.rateLimit ?? "");
        setDownloadRateLimitMs(result.settings.rateLimitMs ? result.settings.rateLimitMs.toString() : "0");
        setDownloadDedupeEnabled(result.settings.dedupeEnabled);
        setDownloadStatus("Download settings saved.");
      } else {
        setDownloadError(result.error ?? "Unable to update download settings.");
      }
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Unable to update download settings.");
    } finally {
      setIsDownloadSaving(false);
    }
  };
  const loadUiSettings = async () => {
    try {
      const result = await window.api.uiGetSettings();
      if (result.ok && result.settings) {
        setUiSettings(result.settings);
        setUiTheme(result.settings.theme);
        setUiError(null);
      } else {
        setUiError(result.error ?? "Unable to load appearance settings.");
      }
    } catch (err) {
      setUiError(err instanceof Error ? err.message : "Unable to load appearance settings.");
    }
  };
  const handleSaveUiSettings = async () => {
    setIsUiSaving(true);
    setUiStatus(null);
    setUiError(null);
    try {
      const result = await window.api.uiUpdateSettings({ theme: uiTheme });
      if (result.ok && result.settings) {
        setUiSettings(result.settings);
        setUiTheme(result.settings.theme);
        document.documentElement.classList.toggle("theme-dark", result.settings.theme === "dark");
        setUiStatus("Appearance updated.");
      } else {
        setUiError(result.error ?? "Unable to update appearance settings.");
      }
    } catch (err) {
      setUiError(err instanceof Error ? err.message : "Unable to update appearance settings.");
    } finally {
      setIsUiSaving(false);
    }
  };
  const loadPrivacySettings = async () => {
    try {
      const result = await window.api.privacyGetSettings();
      if (result.ok && result.settings) {
        setPrivacySettings(result.settings);
        setPrivacyDraft(result.settings);
        setPrivacyError(null);
      } else {
        setPrivacyError(result.error ?? "Unable to load privacy settings.");
      }
    } catch (err) {
      setPrivacyError(err instanceof Error ? err.message : "Unable to load privacy settings.");
    }
  };
  const handleSavePrivacy = async () => {
    if (!privacyDraft) {
      return;
    }
    setIsPrivacySaving(true);
    setPrivacyStatus(null);
    setPrivacyError(null);
    try {
      const { pinSet, ...payload } = privacyDraft;
      const result = await window.api.privacyUpdateSettings(payload);
      if (result.ok && result.settings) {
        setPrivacySettings(result.settings);
        setPrivacyDraft(result.settings);
        setPrivacyStatus("Privacy settings saved.");
      } else {
        setPrivacyError(result.error ?? "Unable to save privacy settings.");
      }
    } catch (err) {
      setPrivacyError(err instanceof Error ? err.message : "Unable to save privacy settings.");
    } finally {
      setIsPrivacySaving(false);
    }
  };
  const handleSetPrivacyPin = async () => {
    setPrivacyPinStatus(null);
    setPrivacyPinError(null);
    if (!privacyPin.trim() || !privacyPinConfirm.trim()) {
      setPrivacyPinError("Enter and confirm a PIN.");
      return;
    }
    if (privacyPin.trim() !== privacyPinConfirm.trim()) {
      setPrivacyPinError("PIN entries do not match.");
      return;
    }
    setIsPrivacyPinSaving(true);
    try {
      const result = await window.api.privacySetPin(privacyPin.trim());
      if (result.ok) {
        setPrivacyPinStatus("PIN saved.");
        setPrivacyPin("");
        setPrivacyPinConfirm("");
        await loadPrivacySettings();
      } else {
        setPrivacyPinError(result.error ?? "Unable to save PIN.");
      }
    } catch (error) {
      setPrivacyPinError(error instanceof Error ? error.message : "Unable to save PIN.");
    } finally {
      setIsPrivacyPinSaving(false);
    }
  };
  const handleClearPrivacyPin = async () => {
    setPrivacyPinStatus(null);
    setPrivacyPinError(null);
    setIsPrivacyPinClearing(true);
    try {
      const result = await window.api.privacyClearPin();
      if (result.ok) {
        setPrivacyPinStatus("PIN cleared.");
        await loadPrivacySettings();
      } else {
        setPrivacyPinError(result.error ?? "Unable to clear PIN.");
      }
    } catch (error) {
      setPrivacyPinError(error instanceof Error ? error.message : "Unable to clear PIN.");
    } finally {
      setIsPrivacyPinClearing(false);
    }
  };
  const loadWatchFolderSettings = async () => {
    try {
      const result = await window.api.watchFolderGetSettings();
      if (result.ok && result.settings) {
        setWatchFolder(result.settings);
        setWatchFolderError(null);
      } else {
        setWatchFolderError(result.error ?? "Unable to load watch folder settings.");
      }
    } catch (error) {
      setWatchFolderError(error instanceof Error ? error.message : "Unable to load watch folder settings.");
    }
  };
  const handleSelectWatchFolder = async () => {
    setIsWatchFolderSelecting(true);
    setWatchFolderStatus(null);
    setWatchFolderError(null);
    try {
      const result = await window.api.watchFolderSelectPath();
      if (result.ok && result.path) {
        await handleUpdateWatchFolder({ path: result.path });
      } else if (!result.canceled) {
        setWatchFolderError(result.error ?? "Unable to select folder.");
      }
    } catch (error) {
      setWatchFolderError(error instanceof Error ? error.message : "Unable to select folder.");
    } finally {
      setIsWatchFolderSelecting(false);
    }
  };
  const handleUpdateWatchFolder = async (payload) => {
    setIsWatchFolderSaving(true);
    setWatchFolderStatus(null);
    setWatchFolderError(null);
    try {
      const result = await window.api.watchFolderUpdateSettings(payload);
      if (result.ok && result.settings) {
        setWatchFolder(result.settings);
        setWatchFolderStatus("Watch folder updated.");
      } else {
        setWatchFolderError(result.error ?? "Unable to update watch folder.");
      }
    } catch (error) {
      setWatchFolderError(error instanceof Error ? error.message : "Unable to update watch folder.");
    } finally {
      setIsWatchFolderSaving(false);
    }
  };
  const handleScanWatchFolder = async () => {
    setIsWatchFolderScanning(true);
    setWatchFolderStatus(null);
    setWatchFolderError(null);
    try {
      const result = await window.api.watchFolderScanNow();
      if (result.ok) {
        setWatchFolderStatus("Scan completed.");
      } else {
        setWatchFolderError(result.error ?? "Unable to scan watch folder.");
      }
    } catch (error) {
      setWatchFolderError(error instanceof Error ? error.message : "Unable to scan watch folder.");
    } finally {
      setIsWatchFolderScanning(false);
    }
  };
  const loadAppLockSettings = async () => {
    try {
      const result = await window.api.appCheckPasswordSet();
      if (result.ok) {
        setAppPasswordSet(result.isSet ?? false);
        setAppLockEnabled(result.isEnabled ?? false);
      }
    } catch {
    }
  };
  const handleSetAppPassword = async () => {
    setAppLockStatus(null);
    setAppLockError(null);
    if (!appLockPassword) {
      setAppLockError("Please enter a password");
      return;
    }
    if (appLockPassword.length < 4) {
      setAppLockError("Password must be at least 4 characters");
      return;
    }
    if (appLockPassword !== appLockConfirmPassword) {
      setAppLockError("Passwords do not match");
      return;
    }
    setIsAppLockSaving(true);
    try {
      const result = await window.api.appSetPassword(appLockPassword);
      if (result.ok) {
        setAppLockStatus("Password set successfully");
        setAppPasswordSet(true);
        setAppLockEnabled(true);
        setAppLockPassword("");
        setAppLockConfirmPassword("");
      } else {
        setAppLockError(result.error ?? "Failed to set password");
      }
    } catch (err) {
      setAppLockError(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setIsAppLockSaving(false);
    }
  };
  const handleChangeAppPassword = async () => {
    setAppLockStatus(null);
    setAppLockError(null);
    if (!appLockCurrentPassword) {
      setAppLockError("Please enter your current password");
      return;
    }
    if (!appLockPassword || appLockPassword.length < 4) {
      setAppLockError("New password must be at least 4 characters");
      return;
    }
    if (appLockPassword !== appLockConfirmPassword) {
      setAppLockError("New passwords do not match");
      return;
    }
    setIsAppLockSaving(true);
    try {
      const result = await window.api.appChangePassword({
        currentPassword: appLockCurrentPassword,
        newPassword: appLockPassword
      });
      if (result.ok) {
        setAppLockStatus("Password changed successfully");
        setAppLockCurrentPassword("");
        setAppLockPassword("");
        setAppLockConfirmPassword("");
      } else {
        setAppLockError(result.error ?? "Failed to change password");
      }
    } catch (err) {
      setAppLockError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsAppLockSaving(false);
    }
  };
  const handleRemoveAppPassword = async () => {
    setAppLockStatus(null);
    setAppLockError(null);
    if (!appLockCurrentPassword) {
      setAppLockError("Please enter your current password");
      return;
    }
    setIsAppLockSaving(true);
    try {
      const result = await window.api.appRemovePassword(appLockCurrentPassword);
      if (result.ok) {
        setAppLockStatus("Password removed");
        setAppPasswordSet(false);
        setAppLockEnabled(false);
        setAppLockCurrentPassword("");
        setAppLockPassword("");
        setAppLockConfirmPassword("");
      } else {
        setAppLockError(result.error ?? "Failed to remove password");
      }
    } catch (err) {
      setAppLockError(err instanceof Error ? err.message : "Failed to remove password");
    } finally {
      setIsAppLockSaving(false);
    }
  };
  const handleToggleAppLock = async (enabled) => {
    try {
      const result = await window.api.appToggleLock(enabled);
      if (result.ok) {
        setAppLockEnabled(enabled);
        setAppLockStatus(enabled ? "App lock enabled" : "App lock disabled");
      } else {
        setAppLockError(result.error ?? "Failed to toggle app lock");
      }
    } catch (err) {
      setAppLockError(err instanceof Error ? err.message : "Failed to toggle app lock");
    }
  };
  reactExports.useEffect(() => {
    void loadBinaries();
    void loadLlmSettings();
    void loadAuthSessions();
    void loadDownloadSettings();
    void loadUiSettings();
    void loadPrivacySettings();
    void loadWatchFolderSettings();
    void loadAppLockSettings();
  }, []);
  reactExports.useEffect(() => {
    if (!privacyDraft?.hiddenFolderEnabled) {
      setPrivacyPin("");
      setPrivacyPinConfirm("");
      setPrivacyPinStatus(null);
      setPrivacyPinError(null);
    }
  }, [privacyDraft?.hiddenFolderEnabled]);
  const activeSession = authSessions.find((session) => session.isActive) ?? null;
  const activeSessionCount = authSessions.filter((session) => session.isActive).length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { ref: appearanceRef, className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Settings overview" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Configure how Drapp downloads, processes, and classifies your media." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { ref: downloadRef, className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Appearance" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Switch between light and dark themes." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => void handleSaveUiSettings(),
            className: "rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white",
            disabled: isUiSaving || !uiSettings,
            children: isUiSaving ? "Saving..." : "Save"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 flex flex-wrap items-center gap-3", children: ["light", "dark"].map((mode) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => setUiTheme(mode),
          className: `rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${uiTheme === mode ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600"}`,
          children: mode
        },
        mode
      )) }),
      uiStatus ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-emerald-600", children: uiStatus }) : null,
      uiError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-rose-600", children: uiError }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { ref: llmRef, className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Watch folder" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Drop URL lists in a folder to auto-queue downloads." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => void handleUpdateWatchFolder({ enabled: !(watchFolder?.enabled ?? false) }),
            className: `rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${watchFolder?.enabled ? "bg-emerald-600 text-white" : "border border-slate-200 text-slate-600"}`,
            disabled: isWatchFolderSaving || !watchFolder,
            children: watchFolder?.enabled ? "Enabled" : "Enable"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600", children: watchFolder?.path ?? "No folder selected" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => void handleSelectWatchFolder(),
            className: "rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600",
            disabled: isWatchFolderSelecting,
            children: isWatchFolderSelecting ? "Selecting..." : "Choose folder"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => void handleScanWatchFolder(),
            className: "rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600",
            disabled: isWatchFolderScanning || !watchFolder?.enabled,
            children: isWatchFolderScanning ? "Scanning..." : "Scan now"
          }
        )
      ] }),
      watchFolderStatus ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-emerald-600", children: watchFolderStatus }) : null,
      watchFolderError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-rose-600", children: watchFolderError }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { ref: authRef, className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Download controls" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Tweak proxy routing, rate limiting, and duplicate detection." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => void handleSaveDownloadSettings(),
            className: "rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white",
            disabled: isDownloadSaving || !downloadSettings,
            children: isDownloadSaving ? "Saving..." : "Save"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400", children: [
            "Proxy URL",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: downloadProxy,
                onChange: (event) => setDownloadProxy(event.target.value),
                placeholder: "http://user:pass@host:port",
                className: "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400", children: [
            "Bandwidth limit",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: downloadRateLimit,
                onChange: (event) => setDownloadRateLimit(event.target.value),
                placeholder: "2M or 500K",
                className: "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400", children: [
            "Delay between downloads (ms)",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                min: 0,
                value: downloadRateLimitMs,
                onChange: (event) => setDownloadRateLimitMs(event.target.value),
                placeholder: "0",
                className: "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400", children: [
            "Duplicate detection",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => setDownloadDedupeEnabled((value) => !value),
                className: `rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${downloadDedupeEnabled ? "bg-emerald-600 text-white" : "border border-slate-200 text-slate-600"}`,
                children: downloadDedupeEnabled ? "Enabled" : "Disabled"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: "Leave proxy or bandwidth blank to disable. Delay applies between completed downloads." })
      ] }),
      downloadStatus ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-emerald-600", children: downloadStatus }) : null,
      downloadError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-rose-600", children: downloadError }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "grid gap-4 lg:grid-cols-2", children: settings.map((section) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-base font-semibold text-slate-900", children: section.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: section.description }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => {
            if (section.title === "General") {
              handleConfigure(appearanceRef);
            } else if (section.title === "Downloads") {
              handleConfigure(downloadRef);
            } else if (section.title === "AI + Tagging") {
              handleConfigure(llmRef);
            } else if (section.title === "Authentication") {
              handleConfigure(authRef);
            } else if (section.title === "Privacy") {
              handleConfigure(privacyRef);
            }
          },
          className: "mt-4 rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500",
          children: "Configure"
        }
      )
    ] }, section.title)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { ref: privacyRef, className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Authentication sessions" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Import browser cookies to unlock premium or age-gated downloads." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => void loadAuthSessions(),
            className: "rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600",
            disabled: isAuthLoading,
            children: isAuthLoading ? "Refreshing..." : "Refresh"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 grid gap-4 lg:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-slate-50 px-4 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-slate-800", children: "Import cookies" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Supports Netscape cookie exports and JSON cookie dumps." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mt-4 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400", children: [
            "Platform",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                list: "auth-platforms",
                value: authPlatform,
                onChange: (event) => setAuthPlatform(event.target.value),
                placeholder: "youtube",
                className: "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("datalist", { id: "auth-platforms", children: AUTH_PLATFORMS.map((platform) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: platform }, platform)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mt-4 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400", children: [
            "Account label (optional)",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: authAccountName,
                onChange: (event) => setAuthAccountName(event.target.value),
                placeholder: "My account",
                className: "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.3em] text-slate-400", children: "Cookie file" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  value: authCookiePath,
                  readOnly: true,
                  placeholder: "No file selected",
                  className: "flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => void handleSelectCookieFile(),
                  className: "rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600",
                  disabled: isAuthSelecting,
                  children: isAuthSelecting ? "Selecting..." : "Browse"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => void handleImportCookies(),
                className: "rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white",
                disabled: isAuthImporting,
                children: isAuthImporting ? "Importing..." : "Import cookies"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => setAuthCookiePath(""),
                className: "rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600",
                disabled: !authCookiePath,
                children: "Clear"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-slate-50 px-4 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-slate-800", children: "Current session" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: activeSession ? `${activeSession.platform}${activeSession.accountName ? ` - ${activeSession.accountName}` : ""}` : "No active session" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-2 text-sm text-slate-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Last used" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2", children: formatDateTime(activeSession?.lastUsedAt) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Expires" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2", children: formatDateTime(activeSession?.expiresAt) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Active sessions" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2", children: activeSessionCount })
            ] })
          ] })
        ] })
      ] }),
      authStatus ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-sm text-emerald-600", children: authStatus }) : null,
      authError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-rose-600", children: authError }) : null,
      authWarning ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-amber-600", children: authWarning }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 space-y-3", children: [
        authSessions.map((session) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-semibold text-slate-900", children: [
                session.platform,
                session.accountName ? ` - ${session.accountName}` : ""
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-slate-400", children: [
                "Created ",
                formatDateTime(session.createdAt)
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: `rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${session.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`,
                  children: session.isActive ? "active" : "inactive"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => void handleSetActiveSession(session.id),
                  className: "rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600",
                  disabled: session.isActive,
                  children: "Activate"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => void handleDeleteSession(session.id),
                  className: "rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600",
                  children: "Delete"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap gap-4 text-xs text-slate-500", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "Last used: ",
              formatDateTime(session.lastUsedAt)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "Expires: ",
              formatDateTime(session.expiresAt)
            ] })
          ] })
        ] }, session.id)),
        authSessions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400", children: isAuthLoading ? "Loading sessions..." : "No sessions yet. Import cookies to get started." }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Privacy controls" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Decide what gets stored locally and how visible your media remains." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => void handleSavePrivacy(),
            className: "rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white",
            disabled: isPrivacySaving || !privacyDraft,
            children: isPrivacySaving ? "Saving..." : "Save privacy"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 grid gap-4 lg:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: privacyDraft?.historyEnabled ?? false,
              onChange: () => setPrivacyDraft(
                (current) => current ? { ...current, historyEnabled: !current.historyEnabled } : current
              ),
              disabled: !privacyDraft,
              className: "mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-semibold text-slate-900", children: "Save watch history" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-1 block text-xs text-slate-500", children: "Track resume position and recent activity." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: privacyDraft?.showThumbnails ?? false,
              onChange: () => setPrivacyDraft(
                (current) => current ? { ...current, showThumbnails: !current.showThumbnails } : current
              ),
              disabled: !privacyDraft,
              className: "mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-semibold text-slate-900", children: "Show thumbnails" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-1 block text-xs text-slate-500", children: "Hide previews when working in shared spaces." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: privacyDraft?.hiddenFolderEnabled ?? false,
              onChange: () => setPrivacyDraft(
                (current) => current ? { ...current, hiddenFolderEnabled: !current.hiddenFolderEnabled } : current
              ),
              disabled: !privacyDraft,
              className: "mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-semibold text-slate-900", children: "Enable hidden folders" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-1 block text-xs text-slate-500", children: "Hide selected folders behind a privacy toggle." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: privacyDraft?.secureDeleteEnabled ?? false,
              onChange: () => setPrivacyDraft(
                (current) => current ? { ...current, secureDeleteEnabled: !current.secureDeleteEnabled } : current
              ),
              disabled: !privacyDraft,
              className: "mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-semibold text-slate-900", children: "Secure delete" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-1 block text-xs text-slate-500", children: "Overwrite files before removing them from disk." })
          ] })
        ] })
      ] }),
      privacyDraft?.hiddenFolderEnabled ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-slate-900", children: "Privacy PIN" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: privacySettings?.pinSet ? "PIN is set." : "No PIN set yet." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleClearPrivacyPin(),
              className: "rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600",
              disabled: isPrivacyPinClearing,
              children: isPrivacyPinClearing ? "Clearing..." : "Clear PIN"
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid gap-3 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "password",
              value: privacyPin,
              onChange: (event) => setPrivacyPin(event.target.value),
              placeholder: "Enter new PIN",
              className: "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "password",
              value: privacyPinConfirm,
              onChange: (event) => setPrivacyPinConfirm(event.target.value),
              placeholder: "Confirm PIN",
              className: "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => void handleSetPrivacyPin(),
            className: "rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white",
            disabled: isPrivacyPinSaving,
            children: isPrivacyPinSaving ? "Saving..." : "Set PIN"
          }
        ) }),
        privacyPinStatus ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-emerald-600", children: privacyPinStatus }) : null,
        privacyPinError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-rose-600", children: privacyPinError }) : null
      ] }) : null,
      privacyStatus ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-sm text-emerald-600", children: privacyStatus }) : null,
      privacyError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-rose-600", children: privacyError }) : null,
      !privacyDraft && !privacyError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Loading privacy settings..." }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "App Lock" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Protect your library with a password on app launch." })
        ] }),
        appPasswordSet && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: appLockEnabled,
              onChange: (e) => void handleToggleAppLock(e.target.checked),
              className: "h-4 w-4 rounded border-slate-300 text-purple-600"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-600", children: "Enable lock" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex h-10 w-10 items-center justify-center rounded-full ${appPasswordSet ? "bg-emerald-100" : "bg-slate-200"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: `h-5 w-5 ${appPasswordSet ? "text-emerald-600" : "text-slate-400"}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-slate-900", children: appPasswordSet ? "Password is set" : "No password set" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: appPasswordSet ? appLockEnabled ? "App will ask for password on launch" : "Lock is disabled, password stored" : "Set a password to enable app lock" })
          ] })
        ] }),
        !appPasswordSet ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "password",
                value: appLockPassword,
                onChange: (e) => setAppLockPassword(e.target.value),
                placeholder: "Enter password (min 4 chars)",
                className: "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "password",
                value: appLockConfirmPassword,
                onChange: (e) => setAppLockConfirmPassword(e.target.value),
                placeholder: "Confirm password",
                className: "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleSetAppPassword(),
              disabled: isAppLockSaving,
              className: "rounded-full bg-purple-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-purple-700 disabled:opacity-50",
              children: isAppLockSaving ? "Setting..." : "Set Password"
            }
          ) })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-xs font-medium text-slate-600", children: "Change or remove password" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "password",
                value: appLockCurrentPassword,
                onChange: (e) => setAppLockCurrentPassword(e.target.value),
                placeholder: "Current password",
                className: "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "password",
                value: appLockPassword,
                onChange: (e) => setAppLockPassword(e.target.value),
                placeholder: "New password",
                className: "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "password",
                value: appLockConfirmPassword,
                onChange: (e) => setAppLockConfirmPassword(e.target.value),
                placeholder: "Confirm new",
                className: "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => void handleChangeAppPassword(),
                disabled: isAppLockSaving,
                className: "rounded-full bg-purple-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-purple-700 disabled:opacity-50",
                children: isAppLockSaving ? "Saving..." : "Change Password"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => void handleRemoveAppPassword(),
                disabled: isAppLockSaving,
                className: "rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-600 hover:bg-rose-50 disabled:opacity-50",
                children: "Remove Password"
              }
            )
          ] })
        ] }),
        appLockStatus ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xs text-emerald-600", children: appLockStatus }) : null,
        appLockError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xs text-rose-600", children: appLockError }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "LLM provider" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Configure OpenRouter or a local LM Studio endpoint for AI features." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleTestConnection(),
              className: "rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600",
              disabled: isLlmTesting,
              children: isLlmTesting ? "Testing..." : "Test connection"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleSaveLlmSettings(),
              className: "rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white",
              disabled: isLlmSaving,
              children: isLlmSaving ? "Saving..." : "Save settings"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 grid gap-4 lg:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-semibold text-slate-700", children: [
          "Provider",
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: llmProvider,
              onChange: (event) => setLlmProvider(event.target.value),
              className: "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "lmstudio", children: "LM Studio (local)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "openrouter", children: "OpenRouter (cloud)" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-600", children: llmSettings ? `${llmProvider === "lmstudio" ? "LM Studio" : "OpenRouter"} selected` : "Loading settings..." }),
          llmProvider === "openrouter" && llmSettings ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs text-slate-500", children: [
            "API key ",
            llmSettings.openrouter.apiKeySet ? "stored" : "not set"
          ] }) : null
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 grid gap-4 lg:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-slate-50 px-4 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-slate-800", children: "OpenRouter" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Cloud models. Your key is stored locally." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mt-4 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400", children: [
            "Default model",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: openrouterModel,
                onChange: (event) => setOpenrouterModel(event.target.value),
                placeholder: "anthropic/claude-3.5-sonnet",
                className: "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mt-4 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400", children: [
            "API key",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "password",
                value: openrouterApiKey,
                onChange: (event) => setOpenrouterApiKey(event.target.value),
                placeholder: llmSettings?.openrouter.apiKeySet ? "Key stored (enter to replace)" : "Enter key",
                className: "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-slate-50 px-4 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-slate-800", children: "LM Studio" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Local models running on your machine." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mt-4 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400", children: [
            "Base URL",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: lmstudioBaseUrl,
                onChange: (event) => setLmstudioBaseUrl(event.target.value),
                placeholder: "http://localhost:1234/v1",
                className: "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mt-4 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400", children: [
            "Model name",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: lmstudioModel,
                onChange: (event) => setLmstudioModel(event.target.value),
                placeholder: "auto",
                className: "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              }
            )
          ] })
        ] })
      ] }),
      llmStatus ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-sm text-emerald-600", children: llmStatus }) : null,
      llmError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-rose-600", children: llmError }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Binary health check" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Confirms bundled tools are present and executable." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleOpenBinariesFolder(),
              className: "rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600",
              children: "Open folder"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void handleRepairBinaries(),
              className: "rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600",
              disabled: isRepairing,
              children: isRepairing ? "Repairing..." : "Repair"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void loadBinaries(),
              className: "rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600",
              disabled: isLoading,
              children: isLoading ? "Checking..." : "Refresh"
            }
          )
        ] })
      ] }),
      binaryStatus ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-sm text-emerald-600", children: binaryStatus }) : null,
      binaryError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-rose-600", children: binaryError }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-3", children: [
        binaries.map((binary) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-slate-900", children: binary.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-400", children: binary.path })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: `rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${binary.status === "ok" ? "bg-emerald-100 text-emerald-700" : binary.status === "missing" ? "bg-slate-100 text-slate-500" : "bg-rose-100 text-rose-700"}`,
                children: binary.status
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-slate-500", children: binary.detail })
        ] }, binary.name)),
        binaries.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400", children: "No data yet. Refresh to check binaries." }) : null
      ] })
    ] })
  ] });
}
function formatDuration$1(seconds) {
  if (seconds == null || !Number.isFinite(seconds)) return "--:--";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor(seconds % 3600 / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
function formatResolution$1(width, height) {
  if (!width || !height) return "";
  if (height >= 2160) return "4K";
  if (height >= 1440) return "1440p";
  if (height >= 1080) return "1080p";
  if (height >= 720) return "720p";
  if (height >= 480) return "480p";
  return `${width}x${height}`;
}
const thumbnailCache = /* @__PURE__ */ new Map();
function VideoThumbnail({
  videoId,
  videoPath,
  duration,
  width,
  height,
  className = "",
  showDuration = true,
  showResolution = true,
  hoverPreview = true
}) {
  const [thumbnail, setThumbnail] = reactExports.useState(thumbnailCache.get(videoId) || null);
  const [isLoading, setIsLoading] = reactExports.useState(!thumbnailCache.has(videoId));
  const [error, setError] = reactExports.useState(false);
  const [isHovering, setIsHovering] = reactExports.useState(false);
  const [previewReady, setPreviewReady] = reactExports.useState(false);
  const videoRef = reactExports.useRef(null);
  const hoverTimeoutRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (thumbnailCache.has(videoId)) {
      setThumbnail(thumbnailCache.get(videoId));
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    window.api.processingGenerateThumbnail({ videoPath, videoId }).then((result) => {
      if (cancelled) return;
      if (result.ok && result.thumbnailBase64) {
        thumbnailCache.set(videoId, result.thumbnailBase64);
        setThumbnail(result.thumbnailBase64);
      } else {
        setError(true);
      }
    }).catch(() => {
      if (!cancelled) setError(true);
    }).finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [videoId, videoPath]);
  const handleMouseEnter = reactExports.useCallback(() => {
    if (!hoverPreview) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovering(true);
    }, 300);
  }, [hoverPreview]);
  const handleMouseLeave = reactExports.useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovering(false);
    setPreviewReady(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);
  reactExports.useEffect(() => {
    if (isHovering && videoRef.current && previewReady) {
      videoRef.current.play().catch(() => {
      });
    }
  }, [isHovering, previewReady]);
  const videoSrc = hoverPreview ? window.api.toFileUrl(videoPath) : null;
  const resolution = formatResolution$1(width, height);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `relative overflow-hidden bg-slate-900 ${className}`,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      children: [
        isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-slate-300" }) }),
        !isLoading && (error || !thumbnail) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "h-12 w-12 text-slate-700", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z" })
        ] }) }),
        thumbnail && !isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: thumbnail,
            alt: "",
            className: `h-full w-full object-cover transition-opacity duration-200 ${isHovering && previewReady ? "opacity-0" : "opacity-100"}`
          }
        ),
        hoverPreview && isHovering && videoSrc && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "video",
          {
            ref: videoRef,
            src: videoSrc,
            className: "absolute inset-0 h-full w-full object-cover",
            muted: true,
            loop: true,
            playsInline: true,
            onCanPlay: () => setPreviewReady(true),
            onError: () => setPreviewReady(false)
          }
        ),
        showDuration && duration != null && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white", children: formatDuration$1(duration) }),
        showResolution && resolution && height && height >= 720 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-2 top-2 rounded bg-purple-600/90 px-1.5 py-0.5 text-xs font-medium text-white", children: resolution }),
        !isHovering && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-full bg-white/20 p-3 backdrop-blur", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-6 w-6 text-white", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M8 5v14l11-7z" }) }) }) }),
        isHovering && previewReady && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-2 left-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white", children: "Preview" })
      ]
    }
  );
}
function formatDuration(seconds) {
  if (seconds == null || !Number.isFinite(seconds)) return "--:--";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor(seconds % 3600 / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
function formatFileSize(bytes) {
  if (bytes == null) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function formatResolution(width, height) {
  if (!width || !height) return "";
  if (height >= 2160) return "4K";
  if (height >= 1440) return "1440p";
  if (height >= 1080) return "1080p";
  if (height >= 720) return "720p";
  if (height >= 480) return "480p";
  return `${width}x${height}`;
}
function Watch() {
  const [videos, setVideos] = reactExports.useState([]);
  const [selectedVideo, setSelectedVideo] = reactExports.useState(null);
  const [isLoading, setIsLoading] = reactExports.useState(true);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [sortBy, setSortBy] = reactExports.useState("recent");
  const [viewMode, setViewMode] = reactExports.useState("grid");
  const searchInputRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    let active = true;
    setIsLoading(true);
    window.api.libraryList(false).then((result) => {
      if (active && result.ok) {
        setVideos(result.videos);
      }
    }).catch(() => {
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);
  reactExports.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && selectedVideo) {
        setSelectedVideo(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedVideo]);
  const filteredVideos = reactExports.useMemo(() => {
    let result = [...videos];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (v2) => v2.title?.toLowerCase().includes(query) || v2.file_name?.toLowerCase().includes(query) || v2.file_path.toLowerCase().includes(query)
      );
    }
    switch (sortBy) {
      case "title":
        result.sort((a, b) => (a.title || a.file_name || "").localeCompare(b.title || b.file_name || ""));
        break;
      case "duration":
        result.sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0));
        break;
      case "size":
        result.sort((a, b) => (b.file_size ?? 0) - (a.file_size ?? 0));
        break;
      case "recent":
      default:
        result.sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return (Number.isFinite(timeB) ? timeB : 0) - (Number.isFinite(timeA) ? timeA : 0);
        });
    }
    return result;
  }, [videos, searchQuery, sortBy]);
  const handleVideoSelect = reactExports.useCallback((video) => {
    setSelectedVideo(video);
  }, []);
  const handleClosePlayer = reactExports.useCallback(() => {
    setSelectedVideo(null);
  }, []);
  const getVideoSrc = reactExports.useCallback((filePath) => {
    try {
      return window.api.toFileUrl(filePath);
    } catch {
      return null;
    }
  }, []);
  if (selectedVideo) {
    const videoSrc = getVideoSrc(selectedVideo.file_path);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 z-50 bg-black", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-4 top-4 z-50 flex items-center gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: handleClosePlayer,
          className: "flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 19l-7-7m0 0l7-7m-7 7h18" }) }),
            "Back to Library"
          ]
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full items-center justify-center p-8 pt-16", children: videoSrc ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-7xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          VideoPlayer,
          {
            videoId: selectedVideo.id,
            src: videoSrc,
            title: selectedVideo.title || selectedVideo.file_name || "Untitled",
            onClose: handleClosePlayer
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold text-white", children: selectedVideo.title || selectedVideo.file_name || "Untitled" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-sm text-slate-400", children: [
            formatDuration(selectedVideo.duration),
            " · ",
            formatResolution(selectedVideo.width, selectedVideo.height),
            " · ",
            formatFileSize(selectedVideo.file_size)
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center text-slate-400", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-medium", children: "Unable to load video" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm", children: "The file may have been moved or deleted." })
      ] }) })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "svg",
          {
            className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            ref: searchInputRef,
            type: "text",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            placeholder: "Search videos... (⌘F)",
            className: "w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          }
        ),
        searchQuery && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setSearchQuery(""),
            className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          value: sortBy,
          onChange: (e) => setSortBy(e.target.value),
          className: "rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-purple-500 focus:outline-none",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "recent", children: "Recent" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "title", children: "Title" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "duration", children: "Duration" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "size", children: "Size" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex rounded-xl border border-slate-200 bg-white p-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setViewMode("grid"),
            className: `rounded-lg px-3 py-1.5 text-sm font-medium transition ${viewMode === "grid" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setViewMode("list"),
            className: `rounded-lg px-3 py-1.5 text-sm font-medium transition ${viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M4 6h16M4 12h16M4 18h16", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", fill: "none" }) })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-sm text-slate-500", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        filteredVideos.length,
        " videos"
      ] }),
      searchQuery && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        'matching "',
        searchQuery,
        '"'
      ] })
    ] }),
    isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-purple-600" }) }),
    !isLoading && filteredVideos.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-16 w-16 text-slate-300", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-lg font-medium text-slate-600", children: "No videos found" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-400", children: searchQuery ? "Try a different search term" : "Scan a folder in the Library tab to add videos" })
    ] }),
    !isLoading && viewMode === "grid" && filteredVideos.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: filteredVideos.map((video) => /* @__PURE__ */ jsxRuntimeExports.jsx(VideoCard, { video, onClick: () => handleVideoSelect(video) }, video.id)) }),
    !isLoading && viewMode === "list" && filteredVideos.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: filteredVideos.map((video) => /* @__PURE__ */ jsxRuntimeExports.jsx(VideoListItem, { video, onClick: () => handleVideoSelect(video) }, video.id)) })
  ] });
}
function VideoCard({ video, onClick }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      onClick,
      className: "group relative overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:border-slate-300 hover:shadow-lg",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          VideoThumbnail,
          {
            videoId: video.id,
            videoPath: video.file_path,
            duration: video.duration,
            width: video.width,
            height: video.height,
            className: "aspect-video",
            hoverPreview: true
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "truncate text-sm font-medium text-slate-900", children: video.title || video.file_name || "Untitled" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: formatFileSize(video.file_size) })
        ] })
      ]
    }
  );
}
function VideoListItem({ video, onClick }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      onClick,
      className: "group flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          VideoThumbnail,
          {
            videoId: video.id,
            videoPath: video.file_path,
            duration: video.duration,
            width: video.width,
            height: video.height,
            className: "h-16 w-28 flex-shrink-0 rounded-lg",
            showResolution: false,
            hoverPreview: false
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "truncate text-sm font-medium text-slate-900", children: video.title || video.file_name || "Untitled" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 truncate text-xs text-slate-500", children: video.file_path })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-shrink-0 items-center gap-4 text-xs text-slate-500", children: [
          video.height && video.height >= 720 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-purple-100 px-2 py-0.5 font-medium text-purple-700", children: formatResolution(video.width, video.height) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatFileSize(video.file_size) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 rounded-full bg-slate-100 p-2 text-slate-600 transition group-hover:bg-purple-100 group-hover:text-purple-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M8 5v14l11-7z" }) }) })
      ]
    }
  );
}
const pageTitles = {
  watch: {
    title: "Watch",
    subtitle: "Video player"
  },
  library: {
    title: "Library overview",
    subtitle: "Media intelligence"
  },
  downloads: {
    title: "Downloads command",
    subtitle: "Acquire + queue"
  },
  processing: {
    title: "Processing studio",
    subtitle: "Transcode + AI"
  },
  archive: {
    title: "Archive vault",
    subtitle: "AV1 encoding"
  },
  settings: {
    title: "System settings",
    subtitle: "Preferences"
  }
};
function App() {
  const [status, setStatus] = reactExports.useState("connecting");
  const [activePage, setActivePage] = reactExports.useState("watch");
  const [isLocked, setIsLocked] = reactExports.useState(true);
  const [lockCheckComplete, setLockCheckComplete] = reactExports.useState(false);
  const [showSetup, setShowSetup] = reactExports.useState(false);
  useSmartTaggingInit();
  reactExports.useEffect(() => {
    let active = true;
    window.api.appCheckPasswordSet().then((result) => {
      if (active) {
        if (result.ok) {
          if (result.isSet && result.isEnabled) {
            setIsLocked(true);
          } else if (!result.isSet) {
            setIsLocked(false);
          } else {
            setIsLocked(false);
          }
        } else {
          setIsLocked(false);
        }
        setLockCheckComplete(true);
      }
    }).catch(() => {
      if (active) {
        setIsLocked(false);
        setLockCheckComplete(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  reactExports.useEffect(() => {
    let active = true;
    window.api.ping().then((response) => {
      if (active) {
        setStatus(response === "pong" ? "online" : "degraded");
      }
    }).catch(() => {
      if (active) {
        setStatus("offline");
      }
    });
    return () => {
      active = false;
    };
  }, []);
  reactExports.useEffect(() => {
    const handleError = (event) => {
      void window.api.reportError({
        message: event.message,
        stack: event.error instanceof Error ? event.error.stack : void 0,
        source: event.filename
      });
    };
    const handleRejection = (event) => {
      const reason = event.reason;
      void window.api.reportError({
        message: reason instanceof Error ? reason.message : "Unhandled promise rejection",
        stack: reason instanceof Error ? reason.stack : void 0,
        source: "unhandledrejection"
      });
    };
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);
  reactExports.useEffect(() => {
    let active = true;
    window.api.uiGetSettings().then((result) => {
      if (!active || !result.ok || !result.settings) {
        return;
      }
      const theme = result.settings.theme === "dark" ? "dark" : "light";
      document.documentElement.classList.toggle("theme-dark", theme === "dark");
    }).catch(() => {
    });
    return () => {
      active = false;
    };
  }, []);
  reactExports.useEffect(() => {
    const handleKeydown = (event) => {
      if (!event.metaKey && !event.ctrlKey) {
        return;
      }
      const key = event.key;
      const nextPage = key === "1" ? "watch" : key === "2" ? "library" : key === "3" ? "downloads" : key === "4" ? "processing" : key === "5" ? "archive" : key === "6" ? "settings" : null;
      if (!nextPage) {
        return;
      }
      event.preventDefault();
      setActivePage(nextPage);
    };
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);
  const navItems = reactExports.useMemo(
    () => [
      { id: "watch", label: "Watch", icon: "▶", hint: "play" },
      { id: "library", label: "Library", icon: "LIB", hint: "scan" },
      { id: "downloads", label: "Downloads", icon: "DL", hint: "queue" },
      { id: "processing", label: "Processing", icon: "AI", hint: "jobs" },
      { id: "archive", label: "Archive", icon: "AV1", hint: "vault" },
      { id: "settings", label: "Settings", icon: "SET" }
    ],
    []
  );
  const current = pageTitles[activePage];
  if (!lockCheckComplete) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-screen items-center justify-center bg-slate-950", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" }) });
  }
  if (isLocked) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      LockScreen,
      {
        onUnlock: () => setIsLocked(false),
        isSetup: showSetup,
        onSetupComplete: () => setShowSetup(false)
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    MainLayout,
    {
      sidebar: /* @__PURE__ */ jsxRuntimeExports.jsx(Sidebar, { items: navItems, activeId: activePage, onSelect: (id2) => setActivePage(id2) }),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Header,
          {
            title: current.title,
            subtitle: current.subtitle,
            status,
            primaryAction: {
              label: activePage === "downloads" ? "New download" : "Run action",
              onClick: () => {
              }
            }
          }
        ),
        activePage === "watch" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Watch, {}) : null,
        activePage === "library" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Library, {}) : null,
        activePage === "downloads" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Downloads, {}) : null,
        activePage === "processing" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Processing, {}) : null,
        activePage === "archive" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Archive, {}) : null,
        activePage === "settings" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, {}) : null
      ]
    }
  );
}
const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found");
}
client.createRoot(root).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React$2.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {}) })
);
