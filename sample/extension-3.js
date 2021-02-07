(()=>{"use strict";const e={_catchError:function(e,n){for(var t=!1,r=e;;){var o,l=null===(o=n._parent)||void 0===o?void 0:o._component;if(null==l)break;if(!l._processingException)try{var i=l.constructor;if(null!=(null==i?void 0:i.getDerivedStateFromError)&&(l.setState(i.getDerivedStateFromError(r)),t=l._dirty),null!=l.componentDidCatch&&(l.componentDidCatch(r),t=l._dirty),t)return void(l._pendingError=l)}catch(e){r=e}}throw e}};function n(e,n){var r;if("undefined"==typeof Symbol||null==e[Symbol.iterator]){if(Array.isArray(e)||(r=function(e,n){if(e){if("string"==typeof e)return t(e,n);var r=Object.prototype.toString.call(e).slice(8,-1);return"Object"===r&&e.constructor&&(r=e.constructor.name),"Map"===r||"Set"===r?Array.from(e):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?t(e,n):void 0}}(e))||n&&e&&"number"==typeof e.length){r&&(e=r);var o=0,l=function(){};return{s:l,n:function(){return o>=e.length?{done:!0}:{done:!1,value:e[o++]}},e:function(e){throw e},f:l}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,u=!0,a=!1;return{s:function(){r=e[Symbol.iterator]()},n:function(){var e=r.next();return u=e.done,e},e:function(e){a=!0,i=e},f:function(){try{u||null==r.return||r.return()}finally{if(a)throw i}}}}function t(e,n){(null==n||n>e.length)&&(n=e.length);for(var t=0,r=new Array(n);t<n;t++)r[t]=e[t];return r}function r(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}function o(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?r(Object(t),!0).forEach((function(n){l(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):r(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function l(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function i(e,n){for(var t=0;t<n.length;t++){var r=n[t];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}var u=function(){function e(n,t){var r,o;!function(e,n){if(!(e instanceof n))throw new TypeError("Cannot call a class as a function")}(this,e),this.props=n,this.context=t,o=void 0,(r="state")in this?Object.defineProperty(this,r,{value:o,enumerable:!0,configurable:!0,writable:!0}):this[r]=o}var n,t;return n=e,(t=[{key:"setState",value:function(e,n){var t,r=this,l=r.state,i=r._nextState;null!=i&&i!==l?t=i:(t=o({},l),r._nextState=t);var u="function"==typeof e?e(o({},t),r.props):e;u&&Object.assign(t,u),null!=u&&r._vnode&&(n&&r._renderCallbacks.push(n),s(r))}},{key:"forceUpdate",value:function(e){var n=this;n._vnode&&(n._force=!0,e&&n._renderCallbacks.push(e),s(n))}},{key:"render",value:function(e){return e.children}}])&&i(n.prototype,t),e}();function a(e,t){if(null==t)return e._parent?a(e._parent,e._parent._children.indexOf(e)+1):null;var r,o=n(e._children);try{for(o.s();!(r=o.n()).done;){var l=r.value;if(null!=(null==l?void 0:l._remoteNode))return l._remoteNode}}catch(i){o.e(i)}finally{o.f()}return"function"==typeof e.type?a(e):null}function c(e){var n=e._vnode,t=n._remoteNode,r=e._parentRemoteNode;if(r){var l=[],i=o({},n);i._original=i;var u=k(r,e._remoteRoot,n,i,e._globalContext,[],l,null==t?a(n):t);C(l,n),u!==t&&f(n)}}function f(e){var t=e._parent,r=null==t?void 0:t._component;if(null!=t&&null!=r){t._remoteNode=null,r.base=void 0;var o,l=n(t._children);try{for(l.s();!(o=l.n()).done;){var i=o.value;if(null!=(null==i?void 0:i._remoteNode)){var u=i._remoteNode;t._remoteNode=u,r.base=u;break}}}catch(a){l.e(a)}finally{l.f()}f(t)}}var d,p=[],v="function"==typeof Promise?Promise.prototype.then.bind(Promise.resolve()):setTimeout;function s(n){var t,r=!1;n._dirty?r=d!==e.debounceRendering:(n._dirty=!0,p.push(n),r=0===y._rerenderCount,y._rerenderCount+=1),r&&(null!==(t=d=e.debounceRendering)&&void 0!==t?t:v)(y)}function y(){for(var e;y._rerenderCount=p.length;)e=p.sort((function(e,n){return e._vnode._depth-n._vnode._depth})),p=[],e.forEach((function(e){e._dirty&&c(e)}))}function _(e){return e.children}function m(n,t,r,o,l){var i,u={type:n,props:t,key:r,ref:o,_children:null,_parent:null,_depth:0,_remoteNode:null,_nextRemoteNode:void 0,_component:void 0,constructor:void 0,_original:l};return null==l&&(u._original=u),null===(i=e.vnode)||void 0===i||i.call(e,u),u}y._rerenderCount=0;var h,b=[];function g(e){return function(e){if(Array.isArray(e))return w(e)}(e)||function(e){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(e))return Array.from(e)}(e)||S(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function O(e,n){var t;if("undefined"==typeof Symbol||null==e[Symbol.iterator]){if(Array.isArray(e)||(t=S(e))||n&&e&&"number"==typeof e.length){t&&(e=t);var r=0,o=function(){};return{s:o,n:function(){return r>=e.length?{done:!0}:{done:!1,value:e[r++]}},e:function(e){throw e},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var l,i=!0,u=!1;return{s:function(){t=e[Symbol.iterator]()},n:function(){var e=t.next();return i=e.done,e},e:function(e){u=!0,l=e},f:function(){try{i||null==t.return||t.return()}finally{if(u)throw l}}}}function S(e,n){if(e){if("string"==typeof e)return w(e,n);var t=Object.prototype.toString.call(e).slice(8,-1);return"Object"===t&&e.constructor&&(t=e.constructor.name),"Map"===t||"Set"===t?Array.from(e):"Arguments"===t||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)?w(e,n):void 0}}function w(e,n){(null==n||n>e.length)&&(n=e.length);for(var t=0,r=new Array(n);t<n;t++)r[t]=e[t];return r}function x(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}function j(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?x(Object(t),!0).forEach((function(n){P(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):x(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function P(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function k(n,t,r,o,l,i,a,c){var f,d=r.type;if(void 0!==r.constructor)return null;null===(f=e._diff)||void 0===f||f.call(e,r);try{var p;e:if("function"==typeof d){var v,s,y,m,h=!1,b=null==o?void 0:o._component,S=r.props,w=d.contextType,x=w&&l[w._id],P=w?x?x.props.value:w._defaultValue:l;b?(y=b,r._component=y,s=y._pendingError,y._processingException=y._pendingError):("prototype"in d&&d.prototype.render?y=new d(S,P):((y=new u(S,P)).constructor=d,y.render=D),r._component=y,x&&x.sub(y),y.props=S,y.state||(y.state={}),y.context=P,y._globalContext=l,y._remoteRoot=t,y._dirty=!0,y._renderCallbacks=[],h=!0),null==y._nextState&&(y._nextState=y.state),null!=d.getDerivedStateFromProps&&(y._nextState===y.state&&(y._nextState=j({},y._nextState)),Object.assign(y._nextState,d.getDerivedStateFromProps(S,y._nextState)));var k=y,C=k.props,N=k.state;if(h)null==d.getDerivedStateFromProps&&null!=y.componentWillMount&&y.componentWillMount(),null!=y.componentDidMount&&y._renderCallbacks.push(y.componentDidMount);else{if(null==d.getDerivedStateFromProps&&S!==C&&null!=y.componentWillReceiveProps&&y.componentWillReceiveProps(S,P),!y._force&&null!=y.shouldComponentUpdate&&!1===y.shouldComponentUpdate(S,y._nextState,P)||r._original===(null==o?void 0:o._original)){y.props=S,y.state=y._nextState,r._original!==o._original&&(y._dirty=!1),y._vnode=r,r._remoteNode=o._remoteNode,r._children=o._children,y._renderCallbacks.length&&a.push(y),E(r,c,n);break e}null!=y.componentWillUpdate&&y.componentWillUpdate(S,y._nextState,P),null!=y.componentDidUpdate&&y._renderCallbacks.push((function(){y.componentDidUpdate(C,N,m)}))}y.context=P,y.props=S,y.state=y._nextState,null===(v=e._render)||void 0===v||v.call(e,r),y._dirty=!1,y._vnode=r,y._parentRemoteNode=n;var A=y.render(y.props,y.state,y.context),U=null==A||A.type!==_||null!=A.key?A:A.props.children;y.state=y._nextState;var I=null==y.getChildContext?l:j(j({},l),y.getChildContext());h||null==y.getSnapshotBeforeUpdate||(m=y.getSnapshotBeforeUpdate(C,N)),R(n,t,Array.isArray(U)?U:[U],r,o,I,i,a,c),y.base=r._remoteNode,y._renderCallbacks.length&&a.push(y),s&&(y._pendingError=null,y._processingException=null),y._force=!1}else null==i&&r._original===(null==o?void 0:o._original)?(r._children=o._children,r._remoteNode=o._remoteNode):r._remoteNode=function(e,n,t,r,o,l,i){var u=null==r?void 0:r.props,a=t.props,c=e,f=l;if(null!=l){var d,p=O(l);try{for(p.s();!(d=p.n()).done;){var v=d.value;if(null!=v&&((null===t.type?2===v.kind:v.type===t.type)||e===v)){c=v,l[l.indexOf(v)]=null;break}}}catch(y){p.e(y)}finally{p.f()}}if(null==c){if(null===t.type)return n.createText(a);c=n.createComponent(t.type),f=null}if(null===t.type)u!==a&&c.text!==a&&c.updateText(a);else{c=c,null!=l&&(f=g(c.children)),function(e,n,t){if(1===e.kind){var r,o={},l=!1;for(r in t)"children"===r||"key"===r||r in n||(l=!0,o[r]=void 0);for(r in n)"children"!==r&&"key"!==r&&t[r]!==n[r]&&(l=!0,o[r]=n[r]);l&&e.updateProps(o)}}(c,a,null!=u?u:{});var s=a.children;R(c,n,Array.isArray(s)?s:[s],t,r,o,f,i)}return c}(null==o?void 0:o._remoteNode,t,r,o,l,i,a);null===(p=e.diffed)||void 0===p||p.call(e,r)}catch(T){r._original=null,null!=i&&(r._remoteNode=c,i[i.indexOf(c)]=null),e._catchError(T,r,o)}return r._remoteNode}function C(n,t){var r;null===(r=e._commit)||void 0===r||r.call(e,t,n),n.forEach((function(n){try{var t=n._renderCallbacks;n._renderCallbacks=[],t.forEach((function(e){e.call(n)}))}catch(r){e._catchError(r,n._vnode)}}))}function N(n,t){var r,o,l,i=arguments.length>2&&void 0!==arguments[2]&&arguments[2];null===(r=e.unmount)||void 0===r||r.call(e,n);var u,a=n.ref,c=n.type,f=n._component,d=n._children,p=i;if(a&&(a.current&&a.current!==n._remoteNode||A(a,null,t)),i||"function"==typeof c||(p=null!=(u=n._remoteNode)),n._remoteNode=void 0,n._nextRemoteNode=void 0,null!=f){if(f.componentWillUnmount)try{f.componentWillUnmount()}catch(_){e._catchError(_,t)}f.base=null,f._parentRemoteNode=null}if(d){var v,s=O(d);try{for(s.s();!(v=s.n()).done;){var y=v.value;y&&N(y,t,p)}}catch(m){s.e(m)}finally{s.f()}}null===(o=u)||void 0===o||null===(l=o.parent)||void 0===l||l.removeChild(u)}function A(n,t,r){try{"function"==typeof n?n(t):n.current=t}catch(o){e._catchError(o,r)}}function E(e,n,t){var r,o=O(e._children);try{for(o.s();!(r=o.n()).done;){var l=r.value;if(null!=l&&(l._parent=e,l._remoteNode)){"function"==typeof l.type&&l._children.length>1&&E(l,n,t);var i=U(t,l,l,e._children,null,l._remoteNode,n);"function"==typeof e.type&&(e._nextRemoteNode=i)}}}catch(u){o.e(u)}finally{o.f()}}function D(e,n,t){return this.constructor(e,t)}function R(e,n,t,r,o,l,i,u,c){var f,d,p,v,s,y,h=null!==(f=null==o?void 0:o._children)&&void 0!==f?f:b,S=h.length,w=c;for(null==w&&(w=null!=i?i[0]:S?a(o,0):null),r._children=[],d=0;d<t.length;d++){var x,j,P,C=t[d],E=void 0;if(E=null==C||"boolean"==typeof C?null:"string"==typeof C||"number"==typeof C?m(null,C,null,void 0,C):Array.isArray(C)?m(_,{children:C},null,void 0,null):null!=C._remoteNode||null!=C._component?m(C.type,C.props,C.key,void 0,C._original):C,r._children[d]=E,null!=E){E._parent=r,E._depth=r._depth+1;var D=h[d];if(null===D||D&&E.key===D.key&&E.type===D.type)h[d]=void 0;else for(var R=0;R<S;R++){if((D=h[R])&&E.key===D.key&&E.type===D.type){h[R]=void 0;break}D=null}var I,T,W=k(e,n,E,null!==(x=D)&&void 0!==x?x:void 0,l,i,u,w),M=E.ref;M&&(null===(j=D)||void 0===j?void 0:j.ref)!==M&&(p||(p=[]),(null===(I=D)||void 0===I?void 0:I.ref)&&p.push([D.ref,null,E]),p.push([M,null!==(T=E._component)&&void 0!==T?T:W,E])),null!=W?(null==v&&(v=W),w=U(e,E,D,h,i,W,w),"function"==typeof r.type&&(r._nextRemoteNode=w)):w&&(null===(P=D)||void 0===P?void 0:P._remoteNode)==w&&w.parent!==e&&(w=a(D))}}if(r._remoteNode=v,null!=i&&"function"!=typeof r.type)for(var F=i.length;F--;)null!=i[F]&&(y=void 0,null===(y=(s=i[F]).parent)||void 0===y||y.removeChild(s));for(var $=S;$--;){var V=h[$];null!=V&&N(V,V)}if(p){var B,H=O(p);try{for(H.s();!(B=H.n()).done;){var q=B.value;A.apply(void 0,g(q))}}catch(z){H.e(z)}finally{H.f()}}}function U(e,n,t,r,o,l,i){var u;if(void 0!==n._nextRemoteNode)u=n._nextRemoteNode,n._nextRemoteNode=void 0;else if(o==t||l!==i||null==l.parent)e:if(null==i||i.parent!==e)e.appendChild(l),u=null;else{for(var a=i,c=0;(a=I(a))&&c<r.length;c+=2)if(a===l)break e;e.insertChildBefore(l,i),u=i}return void 0===u?I(l):u}function I(e){var n=e.parent;if(null==n)return null;var t=n.children;return t[t.indexOf(e)+1]||null}function T(e,n){(null==n||n>e.length)&&(n=e.length);for(var t=0,r=new Array(n);t<n;t++)r[t]=e[t];return r}function W(n,t){var r;null===(r=e._root)||void 0===r||r.call(e,n,t);var o=t._vnode,l=function(e,n){var t,r,o,l={};for(t in n)"key"===t?r=n[t]:"ref"===t?o=n[t]:l[t]=n[t];for(var i=arguments.length,u=new Array(i>2?i-2:0),a=2;a<i;a++)u[a-2]=arguments[a];if(u.length&&(l.children=u),"function"==typeof e&&null!=e.defaultProps)for(t in e.defaultProps)void 0===l[t]&&(l[t]=e.defaultProps[t]);return m(e,l,r,o,null)}(_,null,n);t._vnode=l;var i,u,a=[],c=o||!("children"in t)?null:t.children;k(t,0===(i=t).kind?i:i.root,l,o,{},(null==c?void 0:c.length)?function(e){if(Array.isArray(e))return T(e)}(u=c)||function(e){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(e))return Array.from(e)}(u)||function(e,n){if(e){if("string"==typeof e)return T(e,n);var t=Object.prototype.toString.call(e).slice(8,-1);return"Object"===t&&e.constructor&&(t=e.constructor.name),"Map"===t||"Set"===t?Array.from(e):"Arguments"===t||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)?T(e,n):void 0}}(u)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}():null,a,null),C(a,l)}function M(e,n){(null==n||n>e.length)&&(n=e.length);for(var t=0,r=new Array(n);t<n;t++)r[t]=e[t];return r}var F="undefined"!=typeof Symbol&&(null===(h=Symbol.for)||void 0===h?void 0:h.call(Symbol,"react.element"))||60103,$=e.vnode;function V(e){return(V="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function B(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function H(e,n){if(!(e instanceof n))throw new TypeError("Cannot call a class as a function")}function q(e,n){for(var t=0;t<n.length;t++){var r=n[t];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}function z(e,n){return(z=Object.setPrototypeOf||function(e,n){return e.__proto__=n,e})(e,n)}function G(e,n){return!n||"object"!==V(n)&&"function"!=typeof n?J(e):n}function J(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function K(e){return(K=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function L(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}e.vnode=function(e){e.$$typeof=F,null==$||$(e)};var Q=0;function X(e){var n="__cC".concat(Q++);function t(e,n){return e.children(n)}var r={_id:n,_defaultValue:e,Provider:function(e){!function(e,n){if("function"!=typeof n&&null!==n)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(n&&n.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),n&&z(e,n)}(u,e);var t,r,o,l,i=(o=u,l=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(e){return!1}}(),function(){var e,n=K(o);if(l){var t=K(this).constructor;e=Reflect.construct(n,arguments,t)}else e=n.apply(this,arguments);return G(this,e)});function u(){var e;H(this,u);for(var t=arguments.length,r=new Array(t),o=0;o<t;o++)r[o]=arguments[o];return L(J(e=i.call.apply(i,[this].concat(r))),"subs",[]),L(J(e),"contextValue",B({},n,J(e))),e}return t=u,(r=[{key:"getChildContext",value:function(){return this.contextValue}},{key:"shouldComponentUpdate",value:function(e){return this.props.value!==e.value&&this.subs.forEach(s),!0}},{key:"sub",value:function(e){var n=this.subs;n.push(e);var t=e.componentWillUnmount;e.componentWillUnmount=function(){n.splice(n.indexOf(e),1),null==t||t.call(e)}}},{key:"render",value:function(e){return e.children}}])&&q(t.prototype,r),u}(u),Consumer:t};return t.contextType=r,r}const Y=X(null);function Z(n,t,r,o,l){var i,u=null==n?void 0:n.defaultProps;if(u)for(var a in u)void 0===t[a]&&(t[a]=u[a]);var c={type:n,props:t,key:r,ref:null==t?void 0:t.ref,_children:null,_parent:null,_depth:0,_remoteNode:null,_nextRemoteNode:void 0,_component:void 0,constructor:void 0,_original:null,__source:o,__self:l};return c._original=c,null===(i=e.vnode)||void 0===i||i.call(e,c),c}var ee;function ne(){return Z("Text",{children:"Hello world!"})}ee=function(){return Z(ne,{})},((...e)=>{self.clips.extend(...e)})("Watch::Series::Details",((e,n)=>{!function(e,n,t){if(null==n._vnode){var r,o=function(e,n){var t;if("undefined"==typeof Symbol||null==e[Symbol.iterator]){if(Array.isArray(e)||(t=function(e,n){if(e){if("string"==typeof e)return M(e,n);var t=Object.prototype.toString.call(e).slice(8,-1);return"Object"===t&&e.constructor&&(t=e.constructor.name),"Map"===t||"Set"===t?Array.from(e):"Arguments"===t||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)?M(e,n):void 0}}(e))||n&&e&&"number"==typeof e.length){t&&(e=t);var r=0,o=function(){};return{s:o,n:function(){return r>=e.length?{done:!0}:{done:!1,value:e[r++]}},e:function(e){throw e},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var l,i=!0,u=!1;return{s:function(){t=e[Symbol.iterator]()},n:function(){var e=t.next();return i=e.done,e},e:function(e){u=!0,l=e},f:function(){try{i||null==t.return||t.return()}finally{if(u)throw l}}}}(n.children);try{for(o.s();!(r=o.n()).done;){var l=r.value;n.removeChild(l)}}catch(i){o.e(i)}finally{o.f()}}W(e,n),null==t||t(),null==e||e._component}(Z(Y.Provider,{value:n,children:ee()}),e,(()=>{e.mount()}))}))})();
