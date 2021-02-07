(() => {
  'use strict';
  const e = {
    _catchError: function (e, n) {
      for (var t = !1, r = e; ; ) {
        var o,
          l = null === (o = n._parent) || void 0 === o ? void 0 : o._component;
        if (null == l) break;
        if (!l._processingException)
          try {
            var i = l.constructor;
            if (
              (null != (null == i ? void 0 : i.getDerivedStateFromError) &&
                (l.setState(i.getDerivedStateFromError(r)), (t = l._dirty)),
              null != l.componentDidCatch &&
                (l.componentDidCatch(r), (t = l._dirty)),
              t)
            )
              return void (l._pendingError = l);
          } catch (e) {
            r = e;
          }
      }
      throw e;
    },
  };
  function n(e, n) {
    var r;
    if ('undefined' == typeof Symbol || null == e[Symbol.iterator]) {
      if (
        Array.isArray(e) ||
        (r = (function (e, n) {
          if (e) {
            if ('string' == typeof e) return t(e, n);
            var r = Object.prototype.toString.call(e).slice(8, -1);
            return (
              'Object' === r && e.constructor && (r = e.constructor.name),
              'Map' === r || 'Set' === r
                ? Array.from(e)
                : 'Arguments' === r ||
                  /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)
                ? t(e, n)
                : void 0
            );
          }
        })(e)) ||
        (n && e && 'number' == typeof e.length)
      ) {
        r && (e = r);
        var o = 0,
          l = function () {};
        return {
          s: l,
          n: function () {
            return o >= e.length ? {done: !0} : {done: !1, value: e[o++]};
          },
          e: function (e) {
            throw e;
          },
          f: l,
        };
      }
      throw new TypeError(
        'Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
      );
    }
    var i,
      u = !0,
      a = !1;
    return {
      s: function () {
        r = e[Symbol.iterator]();
      },
      n: function () {
        var e = r.next();
        return (u = e.done), e;
      },
      e: function (e) {
        (a = !0), (i = e);
      },
      f: function () {
        try {
          u || null == r.return || r.return();
        } finally {
          if (a) throw i;
        }
      },
    };
  }
  function t(e, n) {
    (null == n || n > e.length) && (n = e.length);
    for (var t = 0, r = new Array(n); t < n; t++) r[t] = e[t];
    return r;
  }
  var r,
    o,
    l,
    i = 0,
    u = [],
    a = e._render,
    c = e.diffed,
    f = e._commit,
    d = e.unmount;
  function p(n, t) {
    var r;
    null === (r = e._hook) || void 0 === r || r.call(e, o, n, i || t),
      (i = 0),
      null == o.__hooks && (o.__hooks = {_list: [], _pendingEffects: []});
    var l = o.__hooks;
    return n >= l._list.length && l._list.push({}), l._list[n];
  }
  function s() {
    var t,
      r = n(u);
    try {
      for (r.s(); !(t = r.n()).done; ) {
        var o = t.value;
        if (o._parentRemoteNode)
          try {
            o.__hooks._pendingEffects.forEach(_),
              o.__hooks._pendingEffects.forEach(h),
              (o.__hooks._pendingEffects = []);
          } catch (l) {
            return (
              (o.__hooks._pendingEffects = []), e._catchError(l, o._vnode), !0
            );
          }
      }
    } catch (i) {
      r.e(i);
    } finally {
      r.f();
    }
    u = [];
  }
  (e._render = function (e) {
    a && a(e), (o = e._component), (r = 0);
    var n = o.__hooks;
    n &&
      (n._pendingEffects.forEach(_),
      n._pendingEffects.forEach(h),
      (n._pendingEffects = []));
  }),
    (e.diffed = function (n) {
      var t;
      null == c || c(n);
      var r = n._component;
      (null == r || null === (t = r.__hooks) || void 0 === t
        ? void 0
        : t._pendingEffects.length) &&
        ((1 !== u.push(r) && l === e.requestAnimationFrame) ||
          ((l = e.requestAnimationFrame) || y)(s));
    }),
    (e._commit = function (t, r) {
      var o = r;
      r.some(function (t) {
        try {
          t._renderCallbacks.forEach(_),
            (t._renderCallbacks = t._renderCallbacks.filter(function (e) {
              return !('_value' in e) || h(e);
            }));
        } catch (a) {
          var l,
            i = n(r);
          try {
            for (i.s(); !(l = i.n()).done; ) {
              var u = l.value;
              u._renderCallbacks && (u._renderCallbacks = []);
            }
          } catch (c) {
            i.e(c);
          } finally {
            i.f();
          }
          (o = []), e._catchError(a, t._vnode);
        }
      }),
        null == f || f(t, o);
    }),
    (e.unmount = function (n) {
      null == d || d(n);
      var t = n._component;
      if (null == t ? void 0 : t.__hooks)
        try {
          t.__hooks._list.forEach(_);
        } catch (r) {
          e._catchError(r, t._vnode);
        }
    });
  var v = 'function' == typeof requestAnimationFrame;
  function y(e) {
    var n,
      t = function () {
        clearTimeout(r), v && cancelAnimationFrame(n), setTimeout(e);
      },
      r = setTimeout(t, 100);
    v && (n = requestAnimationFrame(t));
  }
  function _(e) {
    '_cleanup' in e && 'function' == typeof e._cleanup && e._cleanup();
  }
  function h(e) {
    e._cleanup = e._value();
  }
  function m(e, n) {
    return 'function' == typeof n ? n(e) : n;
  }
  function b(e, n) {
    var t;
    if ('undefined' == typeof Symbol || null == e[Symbol.iterator]) {
      if (
        Array.isArray(e) ||
        (t = (function (e, n) {
          if (e) {
            if ('string' == typeof e) return g(e, n);
            var t = Object.prototype.toString.call(e).slice(8, -1);
            return (
              'Object' === t && e.constructor && (t = e.constructor.name),
              'Map' === t || 'Set' === t
                ? Array.from(e)
                : 'Arguments' === t ||
                  /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)
                ? g(e, n)
                : void 0
            );
          }
        })(e)) ||
        (n && e && 'number' == typeof e.length)
      ) {
        t && (e = t);
        var r = 0,
          o = function () {};
        return {
          s: o,
          n: function () {
            return r >= e.length ? {done: !0} : {done: !1, value: e[r++]};
          },
          e: function (e) {
            throw e;
          },
          f: o,
        };
      }
      throw new TypeError(
        'Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
      );
    }
    var l,
      i = !0,
      u = !1;
    return {
      s: function () {
        t = e[Symbol.iterator]();
      },
      n: function () {
        var e = t.next();
        return (i = e.done), e;
      },
      e: function (e) {
        (u = !0), (l = e);
      },
      f: function () {
        try {
          i || null == t.return || t.return();
        } finally {
          if (u) throw l;
        }
      },
    };
  }
  function g(e, n) {
    (null == n || n > e.length) && (n = e.length);
    for (var t = 0, r = new Array(n); t < n; t++) r[t] = e[t];
    return r;
  }
  function S(e, n) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      n &&
        (r = r.filter(function (n) {
          return Object.getOwnPropertyDescriptor(e, n).enumerable;
        })),
        t.push.apply(t, r);
    }
    return t;
  }
  function O(e) {
    for (var n = 1; n < arguments.length; n++) {
      var t = null != arguments[n] ? arguments[n] : {};
      n % 2
        ? S(Object(t), !0).forEach(function (n) {
            w(e, n, t[n]);
          })
        : Object.getOwnPropertyDescriptors
        ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t))
        : S(Object(t)).forEach(function (n) {
            Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(t, n));
          });
    }
    return e;
  }
  function w(e, n, t) {
    return (
      n in e
        ? Object.defineProperty(e, n, {
            value: t,
            enumerable: !0,
            configurable: !0,
            writable: !0,
          })
        : (e[n] = t),
      e
    );
  }
  function j(e, n) {
    for (var t = 0; t < n.length; t++) {
      var r = n[t];
      (r.enumerable = r.enumerable || !1),
        (r.configurable = !0),
        'value' in r && (r.writable = !0),
        Object.defineProperty(e, r.key, r);
    }
  }
  var k = (function () {
    function e(n, t) {
      var r, o;
      !(function (e, n) {
        if (!(e instanceof n))
          throw new TypeError('Cannot call a class as a function');
      })(this, e),
        (this.props = n),
        (this.context = t),
        (o = void 0),
        (r = 'state') in this
          ? Object.defineProperty(this, r, {
              value: o,
              enumerable: !0,
              configurable: !0,
              writable: !0,
            })
          : (this[r] = o);
    }
    var n, t;
    return (
      (n = e),
      (t = [
        {
          key: 'setState',
          value: function (e, n) {
            var t,
              r = this,
              o = r.state,
              l = r._nextState;
            null != l && l !== o
              ? (t = l)
              : ((t = O({}, o)), (r._nextState = t));
            var i = 'function' == typeof e ? e(O({}, t), r.props) : e;
            i && Object.assign(t, i),
              null != i && r._vnode && (n && r._renderCallbacks.push(n), R(r));
          },
        },
        {
          key: 'forceUpdate',
          value: function (e) {
            var n = this;
            n._vnode &&
              ((n._force = !0), e && n._renderCallbacks.push(e), R(n));
          },
        },
        {
          key: 'render',
          value: function (e) {
            return e.children;
          },
        },
      ]) && j(n.prototype, t),
      e
    );
  })();
  function x(e, n) {
    if (null == n)
      return e._parent
        ? x(e._parent, e._parent._children.indexOf(e) + 1)
        : null;
    var t,
      r = b(e._children);
    try {
      for (r.s(); !(t = r.n()).done; ) {
        var o = t.value;
        if (null != (null == o ? void 0 : o._remoteNode)) return o._remoteNode;
      }
    } catch (l) {
      r.e(l);
    } finally {
      r.f();
    }
    return 'function' == typeof e.type ? x(e) : null;
  }
  function A(e) {
    var n = e._vnode,
      t = n._remoteNode,
      r = e._parentRemoteNode;
    if (r) {
      var o = [],
        l = O({}, n);
      l._original = l;
      var i = z(
        r,
        e._remoteRoot,
        n,
        l,
        e._globalContext,
        [],
        o,
        null == t ? x(n) : t,
      );
      G(o, n), i !== t && E(n);
    }
  }
  function E(e) {
    var n = e._parent,
      t = null == n ? void 0 : n._component;
    if (null != n && null != t) {
      (n._remoteNode = null), (t.base = void 0);
      var r,
        o = b(n._children);
      try {
        for (o.s(); !(r = o.n()).done; ) {
          var l = r.value;
          if (null != (null == l ? void 0 : l._remoteNode)) {
            var i = l._remoteNode;
            (n._remoteNode = i), (t.base = i);
            break;
          }
        }
      } catch (u) {
        o.e(u);
      } finally {
        o.f();
      }
      E(n);
    }
  }
  var C,
    P = [],
    N =
      'function' == typeof Promise
        ? Promise.prototype.then.bind(Promise.resolve())
        : setTimeout;
  function R(n) {
    var t,
      r = !1;
    n._dirty
      ? (r = C !== e.debounceRendering)
      : ((n._dirty = !0),
        P.push(n),
        (r = 0 === D._rerenderCount),
        (D._rerenderCount += 1)),
      r && (null !== (t = C = e.debounceRendering) && void 0 !== t ? t : N)(D);
  }
  function D() {
    for (var e; (D._rerenderCount = P.length); )
      (e = P.sort(function (e, n) {
        return e._vnode._depth - n._vnode._depth;
      })),
        (P = []),
        e.forEach(function (e) {
          e._dirty && A(e);
        });
  }
  function I(e) {
    return e.children;
  }
  function U(n, t, r, o, l) {
    var i,
      u = {
        type: n,
        props: t,
        key: r,
        ref: o,
        _children: null,
        _parent: null,
        _depth: 0,
        _remoteNode: null,
        _nextRemoteNode: void 0,
        _component: void 0,
        constructor: void 0,
        _original: l,
      };
    return (
      null == l && (u._original = u),
      null === (i = e.vnode) || void 0 === i || i.call(e, u),
      u
    );
  }
  D._rerenderCount = 0;
  var T,
    F = [];
  function W(e) {
    return (
      (function (e) {
        if (Array.isArray(e)) return q(e);
      })(e) ||
      (function (e) {
        if ('undefined' != typeof Symbol && Symbol.iterator in Object(e))
          return Array.from(e);
      })(e) ||
      $(e) ||
      (function () {
        throw new TypeError(
          'Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
        );
      })()
    );
  }
  function M(e, n) {
    var t;
    if ('undefined' == typeof Symbol || null == e[Symbol.iterator]) {
      if (
        Array.isArray(e) ||
        (t = $(e)) ||
        (n && e && 'number' == typeof e.length)
      ) {
        t && (e = t);
        var r = 0,
          o = function () {};
        return {
          s: o,
          n: function () {
            return r >= e.length ? {done: !0} : {done: !1, value: e[r++]};
          },
          e: function (e) {
            throw e;
          },
          f: o,
        };
      }
      throw new TypeError(
        'Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
      );
    }
    var l,
      i = !0,
      u = !1;
    return {
      s: function () {
        t = e[Symbol.iterator]();
      },
      n: function () {
        var e = t.next();
        return (i = e.done), e;
      },
      e: function (e) {
        (u = !0), (l = e);
      },
      f: function () {
        try {
          i || null == t.return || t.return();
        } finally {
          if (u) throw l;
        }
      },
    };
  }
  function $(e, n) {
    if (e) {
      if ('string' == typeof e) return q(e, n);
      var t = Object.prototype.toString.call(e).slice(8, -1);
      return (
        'Object' === t && e.constructor && (t = e.constructor.name),
        'Map' === t || 'Set' === t
          ? Array.from(e)
          : 'Arguments' === t ||
            /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)
          ? q(e, n)
          : void 0
      );
    }
  }
  function q(e, n) {
    (null == n || n > e.length) && (n = e.length);
    for (var t = 0, r = new Array(n); t < n; t++) r[t] = e[t];
    return r;
  }
  function V(e, n) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var r = Object.getOwnPropertySymbols(e);
      n &&
        (r = r.filter(function (n) {
          return Object.getOwnPropertyDescriptor(e, n).enumerable;
        })),
        t.push.apply(t, r);
    }
    return t;
  }
  function B(e) {
    for (var n = 1; n < arguments.length; n++) {
      var t = null != arguments[n] ? arguments[n] : {};
      n % 2
        ? V(Object(t), !0).forEach(function (n) {
            H(e, n, t[n]);
          })
        : Object.getOwnPropertyDescriptors
        ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t))
        : V(Object(t)).forEach(function (n) {
            Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(t, n));
          });
    }
    return e;
  }
  function H(e, n, t) {
    return (
      n in e
        ? Object.defineProperty(e, n, {
            value: t,
            enumerable: !0,
            configurable: !0,
            writable: !0,
          })
        : (e[n] = t),
      e
    );
  }
  function z(n, t, r, o, l, i, u, a) {
    var c,
      f = r.type;
    if (void 0 !== r.constructor) return null;
    null === (c = e._diff) || void 0 === c || c.call(e, r);
    try {
      var d;
      e: if ('function' == typeof f) {
        var p,
          s,
          v,
          y,
          _ = !1,
          h = null == o ? void 0 : o._component,
          m = r.props,
          b = f.contextType,
          g = b && l[b._id],
          S = b ? (g ? g.props.value : b._defaultValue) : l;
        h
          ? ((v = h),
            (r._component = v),
            (s = v._pendingError),
            (v._processingException = v._pendingError))
          : ('prototype' in f && f.prototype.render
              ? (v = new f(m, S))
              : (((v = new k(m, S)).constructor = f), (v.render = Q)),
            (r._component = v),
            g && g.sub(v),
            (v.props = m),
            v.state || (v.state = {}),
            (v.context = S),
            (v._globalContext = l),
            (v._remoteRoot = t),
            (v._dirty = !0),
            (v._renderCallbacks = []),
            (_ = !0)),
          null == v._nextState && (v._nextState = v.state),
          null != f.getDerivedStateFromProps &&
            (v._nextState === v.state && (v._nextState = B({}, v._nextState)),
            Object.assign(
              v._nextState,
              f.getDerivedStateFromProps(m, v._nextState),
            ));
        var O = v,
          w = O.props,
          j = O.state;
        if (_)
          null == f.getDerivedStateFromProps &&
            null != v.componentWillMount &&
            v.componentWillMount(),
            null != v.componentDidMount &&
              v._renderCallbacks.push(v.componentDidMount);
        else {
          if (
            (null == f.getDerivedStateFromProps &&
              m !== w &&
              null != v.componentWillReceiveProps &&
              v.componentWillReceiveProps(m, S),
            (!v._force &&
              null != v.shouldComponentUpdate &&
              !1 === v.shouldComponentUpdate(m, v._nextState, S)) ||
              r._original === (null == o ? void 0 : o._original))
          ) {
            (v.props = m),
              (v.state = v._nextState),
              r._original !== o._original && (v._dirty = !1),
              (v._vnode = r),
              (r._remoteNode = o._remoteNode),
              (r._children = o._children),
              v._renderCallbacks.length && u.push(v),
              L(r, a, n);
            break e;
          }
          null != v.componentWillUpdate &&
            v.componentWillUpdate(m, v._nextState, S),
            null != v.componentDidUpdate &&
              v._renderCallbacks.push(function () {
                v.componentDidUpdate(w, j, y);
              });
        }
        (v.context = S),
          (v.props = m),
          (v.state = v._nextState),
          null === (p = e._render) || void 0 === p || p.call(e, r),
          (v._dirty = !1),
          (v._vnode = r),
          (v._parentRemoteNode = n);
        var x = v.render(v.props, v.state, v.context),
          A = null == x || x.type !== I || null != x.key ? x : x.props.children;
        v.state = v._nextState;
        var E =
          null == v.getChildContext ? l : B(B({}, l), v.getChildContext());
        _ ||
          null == v.getSnapshotBeforeUpdate ||
          (y = v.getSnapshotBeforeUpdate(w, j)),
          X(n, t, Array.isArray(A) ? A : [A], r, o, E, i, u, a),
          (v.base = r._remoteNode),
          v._renderCallbacks.length && u.push(v),
          s && ((v._pendingError = null), (v._processingException = null)),
          (v._force = !1);
      } else
        null == i && r._original === (null == o ? void 0 : o._original)
          ? ((r._children = o._children), (r._remoteNode = o._remoteNode))
          : (r._remoteNode = (function (e, n, t, r, o, l, i) {
              var u = null == r ? void 0 : r.props,
                a = t.props,
                c = e,
                f = l;
              if (null != l) {
                var d,
                  p = M(l);
                try {
                  for (p.s(); !(d = p.n()).done; ) {
                    var s = d.value;
                    if (
                      null != s &&
                      ((null === t.type ? 2 === s.kind : s.type === t.type) ||
                        e === s)
                    ) {
                      (c = s), (l[l.indexOf(s)] = null);
                      break;
                    }
                  }
                } catch (y) {
                  p.e(y);
                } finally {
                  p.f();
                }
              }
              if (null == c) {
                if (null === t.type) return n.createText(a);
                (c = n.createComponent(t.type)), (f = null);
              }
              if (null === t.type) u !== a && c.text !== a && c.updateText(a);
              else {
                (c = c),
                  null != l && (f = W(c.children)),
                  (function (e, n, t) {
                    if (1 === e.kind) {
                      var r,
                        o = {},
                        l = !1;
                      for (r in t)
                        'children' === r ||
                          'key' === r ||
                          r in n ||
                          ((l = !0), (o[r] = void 0));
                      for (r in n)
                        'children' !== r &&
                          'key' !== r &&
                          t[r] !== n[r] &&
                          ((l = !0), (o[r] = n[r]));
                      l && e.updateProps(o);
                    }
                  })(c, a, null != u ? u : {});
                var v = a.children;
                X(c, n, Array.isArray(v) ? v : [v], t, r, o, f, i);
              }
              return c;
            })(null == o ? void 0 : o._remoteNode, t, r, o, l, i, u));
      null === (d = e.diffed) || void 0 === d || d.call(e, r);
    } catch (C) {
      (r._original = null),
        null != i && ((r._remoteNode = a), (i[i.indexOf(a)] = null)),
        e._catchError(C, r, o);
    }
    return r._remoteNode;
  }
  function G(n, t) {
    var r;
    null === (r = e._commit) || void 0 === r || r.call(e, t, n),
      n.forEach(function (n) {
        try {
          var t = n._renderCallbacks;
          (n._renderCallbacks = []),
            t.forEach(function (e) {
              e.call(n);
            });
        } catch (r) {
          e._catchError(r, n._vnode);
        }
      });
  }
  function J(n, t) {
    var r,
      o,
      l,
      i = arguments.length > 2 && void 0 !== arguments[2] && arguments[2];
    null === (r = e.unmount) || void 0 === r || r.call(e, n);
    var u,
      a = n.ref,
      c = n.type,
      f = n._component,
      d = n._children,
      p = i;
    if (
      (a && ((a.current && a.current !== n._remoteNode) || K(a, null, t)),
      i || 'function' == typeof c || (p = null != (u = n._remoteNode)),
      (n._remoteNode = void 0),
      (n._nextRemoteNode = void 0),
      null != f)
    ) {
      if (f.componentWillUnmount)
        try {
          f.componentWillUnmount();
        } catch (_) {
          e._catchError(_, t);
        }
      (f.base = null), (f._parentRemoteNode = null);
    }
    if (d) {
      var s,
        v = M(d);
      try {
        for (v.s(); !(s = v.n()).done; ) {
          var y = s.value;
          y && J(y, t, p);
        }
      } catch (h) {
        v.e(h);
      } finally {
        v.f();
      }
    }
    null === (o = u) ||
      void 0 === o ||
      null === (l = o.parent) ||
      void 0 === l ||
      l.removeChild(u);
  }
  function K(n, t, r) {
    try {
      'function' == typeof n ? n(t) : (n.current = t);
    } catch (o) {
      e._catchError(o, r);
    }
  }
  function L(e, n, t) {
    var r,
      o = M(e._children);
    try {
      for (o.s(); !(r = o.n()).done; ) {
        var l = r.value;
        if (null != l && ((l._parent = e), l._remoteNode)) {
          'function' == typeof l.type && l._children.length > 1 && L(l, n, t);
          var i = Y(t, l, l, e._children, null, l._remoteNode, n);
          'function' == typeof e.type && (e._nextRemoteNode = i);
        }
      }
    } catch (u) {
      o.e(u);
    } finally {
      o.f();
    }
  }
  function Q(e, n, t) {
    return this.constructor(e, t);
  }
  function X(e, n, t, r, o, l, i, u, a) {
    var c,
      f,
      d,
      p,
      s,
      v,
      y =
        null !== (c = null == o ? void 0 : o._children) && void 0 !== c ? c : F,
      _ = y.length,
      h = a;
    for (
      null == h && (h = null != i ? i[0] : _ ? x(o, 0) : null),
        r._children = [],
        f = 0;
      f < t.length;
      f++
    ) {
      var m,
        b,
        g,
        S = t[f],
        O = void 0;
      if (
        ((O =
          null == S || 'boolean' == typeof S
            ? null
            : 'string' == typeof S || 'number' == typeof S
            ? U(null, S, null, void 0, S)
            : Array.isArray(S)
            ? U(I, {children: S}, null, void 0, null)
            : null != S._remoteNode || null != S._component
            ? U(S.type, S.props, S.key, void 0, S._original)
            : S),
        (r._children[f] = O),
        null != O)
      ) {
        (O._parent = r), (O._depth = r._depth + 1);
        var w = y[f];
        if (null === w || (w && O.key === w.key && O.type === w.type))
          y[f] = void 0;
        else
          for (var j = 0; j < _; j++) {
            if ((w = y[j]) && O.key === w.key && O.type === w.type) {
              y[j] = void 0;
              break;
            }
            w = null;
          }
        var k,
          A,
          E = z(
            e,
            n,
            O,
            null !== (m = w) && void 0 !== m ? m : void 0,
            l,
            i,
            u,
            h,
          ),
          C = O.ref;
        C &&
          (null === (b = w) || void 0 === b ? void 0 : b.ref) !== C &&
          (d || (d = []),
          (null === (k = w) || void 0 === k ? void 0 : k.ref) &&
            d.push([w.ref, null, O]),
          d.push([C, null !== (A = O._component) && void 0 !== A ? A : E, O])),
          null != E
            ? (null == p && (p = E),
              (h = Y(e, O, w, y, i, E, h)),
              'function' == typeof r.type && (r._nextRemoteNode = h))
            : h &&
              (null === (g = w) || void 0 === g ? void 0 : g._remoteNode) ==
                h &&
              h.parent !== e &&
              (h = x(w));
      }
    }
    if (((r._remoteNode = p), null != i && 'function' != typeof r.type))
      for (var P = i.length; P--; )
        null != i[P] &&
          ((v = void 0),
          null === (v = (s = i[P]).parent) || void 0 === v || v.removeChild(s));
    for (var N = _; N--; ) {
      var R = y[N];
      null != R && J(R, R);
    }
    if (d) {
      var D,
        T = M(d);
      try {
        for (T.s(); !(D = T.n()).done; ) {
          var $ = D.value;
          K.apply(void 0, W($));
        }
      } catch (q) {
        T.e(q);
      } finally {
        T.f();
      }
    }
  }
  function Y(e, n, t, r, o, l, i) {
    var u;
    if (void 0 !== n._nextRemoteNode)
      (u = n._nextRemoteNode), (n._nextRemoteNode = void 0);
    else if (o == t || l !== i || null == l.parent)
      e: if (null == i || i.parent !== e) e.appendChild(l), (u = null);
      else {
        for (var a = i, c = 0; (a = Z(a)) && c < r.length; c += 2)
          if (a === l) break e;
        e.insertChildBefore(l, i), (u = i);
      }
    return void 0 === u ? Z(l) : u;
  }
  function Z(e) {
    var n = e.parent;
    if (null == n) return null;
    var t = n.children;
    return t[t.indexOf(e) + 1] || null;
  }
  function ee(e, n) {
    (null == n || n > e.length) && (n = e.length);
    for (var t = 0, r = new Array(n); t < n; t++) r[t] = e[t];
    return r;
  }
  function ne(n, t) {
    var r;
    null === (r = e._root) || void 0 === r || r.call(e, n, t);
    var o = t._vnode,
      l = (function (e, n) {
        var t,
          r,
          o,
          l = {};
        for (t in n)
          'key' === t ? (r = n[t]) : 'ref' === t ? (o = n[t]) : (l[t] = n[t]);
        for (
          var i = arguments.length, u = new Array(i > 2 ? i - 2 : 0), a = 2;
          a < i;
          a++
        )
          u[a - 2] = arguments[a];
        if (
          (u.length && (l.children = u),
          'function' == typeof e && null != e.defaultProps)
        )
          for (t in e.defaultProps)
            void 0 === l[t] && (l[t] = e.defaultProps[t]);
        return U(e, l, r, o, null);
      })(I, null, n);
    t._vnode = l;
    var i,
      u,
      a = [],
      c = o || !('children' in t) ? null : t.children;
    z(
      t,
      0 === (i = t).kind ? i : i.root,
      l,
      o,
      {},
      (null == c ? void 0 : c.length)
        ? (function (e) {
            if (Array.isArray(e)) return ee(e);
          })((u = c)) ||
            (function (e) {
              if ('undefined' != typeof Symbol && Symbol.iterator in Object(e))
                return Array.from(e);
            })(u) ||
            (function (e, n) {
              if (e) {
                if ('string' == typeof e) return ee(e, n);
                var t = Object.prototype.toString.call(e).slice(8, -1);
                return (
                  'Object' === t && e.constructor && (t = e.constructor.name),
                  'Map' === t || 'Set' === t
                    ? Array.from(e)
                    : 'Arguments' === t ||
                      /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)
                    ? ee(e, n)
                    : void 0
                );
              }
            })(u) ||
            (function () {
              throw new TypeError(
                'Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
              );
            })()
        : null,
      a,
      null,
    ),
      G(a, l);
  }
  function te(e, n) {
    (null == n || n > e.length) && (n = e.length);
    for (var t = 0, r = new Array(n); t < n; t++) r[t] = e[t];
    return r;
  }
  var re =
      ('undefined' != typeof Symbol &&
        (null === (T = Symbol.for) || void 0 === T
          ? void 0
          : T.call(Symbol, 'react.element'))) ||
      60103,
    oe = e.vnode;
  function le(e) {
    return (le =
      'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
        ? function (e) {
            return typeof e;
          }
        : function (e) {
            return e &&
              'function' == typeof Symbol &&
              e.constructor === Symbol &&
              e !== Symbol.prototype
              ? 'symbol'
              : typeof e;
          })(e);
  }
  function ie(e, n, t) {
    return (
      n in e
        ? Object.defineProperty(e, n, {
            value: t,
            enumerable: !0,
            configurable: !0,
            writable: !0,
          })
        : (e[n] = t),
      e
    );
  }
  function ue(e, n) {
    if (!(e instanceof n))
      throw new TypeError('Cannot call a class as a function');
  }
  function ae(e, n) {
    for (var t = 0; t < n.length; t++) {
      var r = n[t];
      (r.enumerable = r.enumerable || !1),
        (r.configurable = !0),
        'value' in r && (r.writable = !0),
        Object.defineProperty(e, r.key, r);
    }
  }
  function ce(e, n) {
    return (ce =
      Object.setPrototypeOf ||
      function (e, n) {
        return (e.__proto__ = n), e;
      })(e, n);
  }
  function fe(e, n) {
    return !n || ('object' !== le(n) && 'function' != typeof n) ? de(e) : n;
  }
  function de(e) {
    if (void 0 === e)
      throw new ReferenceError(
        "this hasn't been initialised - super() hasn't been called",
      );
    return e;
  }
  function pe(e) {
    return (pe = Object.setPrototypeOf
      ? Object.getPrototypeOf
      : function (e) {
          return e.__proto__ || Object.getPrototypeOf(e);
        })(e);
  }
  function se(e, n, t) {
    return (
      n in e
        ? Object.defineProperty(e, n, {
            value: t,
            enumerable: !0,
            configurable: !0,
            writable: !0,
          })
        : (e[n] = t),
      e
    );
  }
  e.vnode = function (e) {
    (e.$$typeof = re), null == oe || oe(e);
  };
  var ve = 0;
  function ye(e) {
    var n = '__cC'.concat(ve++);
    function t(e, n) {
      return e.children(n);
    }
    var r = {
      _id: n,
      _defaultValue: e,
      Provider: (function (e) {
        !(function (e, n) {
          if ('function' != typeof n && null !== n)
            throw new TypeError(
              'Super expression must either be null or a function',
            );
          (e.prototype = Object.create(n && n.prototype, {
            constructor: {value: e, writable: !0, configurable: !0},
          })),
            n && ce(e, n);
        })(u, e);
        var t,
          r,
          o,
          l,
          i =
            ((o = u),
            (l = (function () {
              if ('undefined' == typeof Reflect || !Reflect.construct)
                return !1;
              if (Reflect.construct.sham) return !1;
              if ('function' == typeof Proxy) return !0;
              try {
                return (
                  Date.prototype.toString.call(
                    Reflect.construct(Date, [], function () {}),
                  ),
                  !0
                );
              } catch (e) {
                return !1;
              }
            })()),
            function () {
              var e,
                n = pe(o);
              if (l) {
                var t = pe(this).constructor;
                e = Reflect.construct(n, arguments, t);
              } else e = n.apply(this, arguments);
              return fe(this, e);
            });
        function u() {
          var e;
          ue(this, u);
          for (var t = arguments.length, r = new Array(t), o = 0; o < t; o++)
            r[o] = arguments[o];
          return (
            se(de((e = i.call.apply(i, [this].concat(r)))), 'subs', []),
            se(de(e), 'contextValue', ie({}, n, de(e))),
            e
          );
        }
        return (
          (t = u),
          (r = [
            {
              key: 'getChildContext',
              value: function () {
                return this.contextValue;
              },
            },
            {
              key: 'shouldComponentUpdate',
              value: function (e) {
                return this.props.value !== e.value && this.subs.forEach(R), !0;
              },
            },
            {
              key: 'sub',
              value: function (e) {
                var n = this.subs;
                n.push(e);
                var t = e.componentWillUnmount;
                e.componentWillUnmount = function () {
                  n.splice(n.indexOf(e), 1), null == t || t.call(e);
                };
              },
            },
            {
              key: 'render',
              value: function (e) {
                return e.children;
              },
            },
          ]) && ae(t.prototype, r),
          u
        );
      })(k),
      Consumer: t,
    };
    return (t.contextType = r), r;
  }
  const _e = ye(null);
  function he(n, t, r, o, l) {
    var i,
      u = null == n ? void 0 : n.defaultProps;
    if (u) for (var a in u) void 0 === t[a] && (t[a] = u[a]);
    var c = {
      type: n,
      props: t,
      key: r,
      ref: null == t ? void 0 : t.ref,
      _children: null,
      _parent: null,
      _depth: 0,
      _remoteNode: null,
      _nextRemoteNode: void 0,
      _component: void 0,
      constructor: void 0,
      _original: null,
      __source: o,
      __self: l,
    };
    return (
      (c._original = c),
      null === (i = e.vnode) || void 0 === i || i.call(e, c),
      c
    );
  }
  function me(e, n) {
    (null == n || n > e.length) && (n = e.length);
    for (var t = 0, r = new Array(n); t < n; t++) r[t] = e[t];
    return r;
  }
  var be;
  function ge() {
    var n,
      t,
      l,
      u,
      a,
      c,
      f,
      d,
      s = (function (e, n) {
        return (
          (function (e) {
            if (Array.isArray(e)) return e;
          })(e) ||
          (function (e, n) {
            if ('undefined' != typeof Symbol && Symbol.iterator in Object(e)) {
              var t = [],
                r = !0,
                o = !1,
                l = void 0;
              try {
                for (
                  var i, u = e[Symbol.iterator]();
                  !(r = (i = u.next()).done) &&
                  (t.push(i.value), !n || t.length !== n);
                  r = !0
                );
              } catch (a) {
                (o = !0), (l = a);
              } finally {
                try {
                  r || null == u.return || u.return();
                } finally {
                  if (o) throw l;
                }
              }
              return t;
            }
          })(e, n) ||
          (function (e, n) {
            if (e) {
              if ('string' == typeof e) return me(e, n);
              var t = Object.prototype.toString.call(e).slice(8, -1);
              return (
                'Object' === t && e.constructor && (t = e.constructor.name),
                'Map' === t || 'Set' === t
                  ? Array.from(e)
                  : 'Arguments' === t ||
                    /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)
                  ? me(e, n)
                  : void 0
              );
            }
          })(e, n) ||
          (function () {
            throw new TypeError(
              'Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
            );
          })()
        );
      })(
        ((i = 1),
        (u = m),
        (a = 0),
        ((c = p(r++, 2))._reducer = u),
        c._component ||
          ((c._component = o),
          (c._value = [
            m(void 0, a),
            function (e) {
              var n = c._reducer(c._value[0], e);
              c._value[0] !== n &&
                ((c._value = [n, c._value[1]]), c._component.setState({}));
            },
          ])),
        c._value),
        2,
      ),
      v = s[0],
      y = s[1];
    return (
      (n = function () {
        setInterval(function () {
          y(function (e) {
            return e + 1;
          });
        }, 1e3);
      }),
      (t = []),
      (l = p(r++, 3)),
      !e._skipEffects &&
        ((f = l._args),
        (d = null != t ? t : []),
        !f ||
          f.length !== d.length ||
          d.some(function (e, n) {
            return e !== f[n];
          })) &&
        ((l._value = n), (l._args = t), o.__hooks._pendingEffects.push(l)),
      he('Text', {children: ['Hello world! Count: ', v]})
    );
  }
  (be = function () {
    return he(ge, {});
  }),
    ((...e) => {
      self.clips.extend(...e);
    })('Watch::Series::Details', (e, n) => {
      !(function (e, n, t) {
        if (null == n._vnode) {
          var r,
            o = (function (e, n) {
              var t;
              if ('undefined' == typeof Symbol || null == e[Symbol.iterator]) {
                if (
                  Array.isArray(e) ||
                  (t = (function (e, n) {
                    if (e) {
                      if ('string' == typeof e) return te(e, n);
                      var t = Object.prototype.toString.call(e).slice(8, -1);
                      return (
                        'Object' === t &&
                          e.constructor &&
                          (t = e.constructor.name),
                        'Map' === t || 'Set' === t
                          ? Array.from(e)
                          : 'Arguments' === t ||
                            /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)
                          ? te(e, n)
                          : void 0
                      );
                    }
                  })(e)) ||
                  (n && e && 'number' == typeof e.length)
                ) {
                  t && (e = t);
                  var r = 0,
                    o = function () {};
                  return {
                    s: o,
                    n: function () {
                      return r >= e.length
                        ? {done: !0}
                        : {done: !1, value: e[r++]};
                    },
                    e: function (e) {
                      throw e;
                    },
                    f: o,
                  };
                }
                throw new TypeError(
                  'Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
                );
              }
              var l,
                i = !0,
                u = !1;
              return {
                s: function () {
                  t = e[Symbol.iterator]();
                },
                n: function () {
                  var e = t.next();
                  return (i = e.done), e;
                },
                e: function (e) {
                  (u = !0), (l = e);
                },
                f: function () {
                  try {
                    i || null == t.return || t.return();
                  } finally {
                    if (u) throw l;
                  }
                },
              };
            })(n.children);
          try {
            for (o.s(); !(r = o.n()).done; ) {
              var l = r.value;
              n.removeChild(l);
            }
          } catch (i) {
            o.e(i);
          } finally {
            o.f();
          }
        }
        ne(e, n), null == t || t(), null == e || e._component;
      })(he(_e.Provider, {value: n, children: be()}), e, () => {
        e.mount();
      });
    });
})();
