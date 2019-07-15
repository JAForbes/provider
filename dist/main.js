var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var mithril = createCommonjsModule(function (module) {
(function() {
function Vnode(tag, key, attrs0, children, text, dom) {
	return {tag: tag, key: key, attrs: attrs0, children: children, text: text, dom: dom, domSize: undefined, state: undefined, _state: undefined, events: undefined, instance: undefined, skip: false}
}
Vnode.normalize = function(node) {
	if (Array.isArray(node)) return Vnode("[", undefined, undefined, Vnode.normalizeChildren(node), undefined, undefined)
	if (node != null && typeof node !== "object") return Vnode("#", undefined, undefined, node === false ? "" : node, undefined, undefined)
	return node
};
Vnode.normalizeChildren = function normalizeChildren(children) {
	for (var i = 0; i < children.length; i++) {
		children[i] = Vnode.normalize(children[i]);
	}
	return children
};
var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g;
var selectorCache = {};
var hasOwn = {}.hasOwnProperty;
function compileSelector(selector) {
	var match, tag = "div", classes = [], attrs = {};
	while (match = selectorParser.exec(selector)) {
		var type = match[1], value = match[2];
		if (type === "" && value !== "") tag = value;
		else if (type === "#") attrs.id = value;
		else if (type === ".") classes.push(value);
		else if (match[3][0] === "[") {
			var attrValue = match[6];
			if (attrValue) attrValue = attrValue.replace(/\\(["'])/g, "$1").replace(/\\\\/g, "\\");
			if (match[4] === "class") classes.push(attrValue);
			else attrs[match[4]] = attrValue === "" ? attrValue : attrValue || true;
		}
	}
	if (classes.length > 0) attrs.className = classes.join(" ");
	return selectorCache[selector] = {tag: tag, attrs: attrs}
}
function execSelector(state, attrs, children) {
	var hasAttrs = false, childList, text;
	var className = attrs.className || attrs.class;
	for (var key in state.attrs) {
		if (hasOwn.call(state.attrs, key)) {
			attrs[key] = state.attrs[key];
		}
	}
	if (className !== undefined) {
		if (attrs.class !== undefined) {
			attrs.class = undefined;
			attrs.className = className;
		}
		if (state.attrs.className != null) {
			attrs.className = state.attrs.className + " " + className;
		}
	}
	for (var key in attrs) {
		if (hasOwn.call(attrs, key) && key !== "key") {
			hasAttrs = true;
			break
		}
	}
	if (Array.isArray(children) && children.length === 1 && children[0] != null && children[0].tag === "#") {
		text = children[0].children;
	} else {
		childList = children;
	}
	return Vnode(state.tag, attrs.key, hasAttrs ? attrs : undefined, childList, text)
}
function hyperscript(selector) {
	// Because sloppy mode sucks
	var attrs = arguments[1], start = 2, children;
	if (selector == null || typeof selector !== "string" && typeof selector !== "function" && typeof selector.view !== "function") {
		throw Error("The selector must be either a string or a component.");
	}
	if (typeof selector === "string") {
		var cached = selectorCache[selector] || compileSelector(selector);
	}
	if (attrs == null) {
		attrs = {};
	} else if (typeof attrs !== "object" || attrs.tag != null || Array.isArray(attrs)) {
		attrs = {};
		start = 1;
	}
	if (arguments.length === start + 1) {
		children = arguments[start];
		if (!Array.isArray(children)) children = [children];
	} else {
		children = [];
		while (start < arguments.length) children.push(arguments[start++]);
	}
	var normalized = Vnode.normalizeChildren(children);
	if (typeof selector === "string") {
		return execSelector(cached, attrs, normalized)
	} else {
		return Vnode(selector, attrs.key, attrs, normalized)
	}
}
hyperscript.trust = function(html) {
	if (html == null) html = "";
	return Vnode("<", undefined, undefined, html, undefined, undefined)
};
hyperscript.fragment = function(attrs1, children) {
	return Vnode("[", attrs1.key, attrs1, Vnode.normalizeChildren(children), undefined, undefined)
};
var m = hyperscript;
/** @constructor */
var PromisePolyfill = function(executor) {
	if (!(this instanceof PromisePolyfill)) throw new Error("Promise must be called with `new`")
	if (typeof executor !== "function") throw new TypeError("executor must be a function")
	var self = this, resolvers = [], rejectors = [], resolveCurrent = handler(resolvers, true), rejectCurrent = handler(rejectors, false);
	var instance = self._instance = {resolvers: resolvers, rejectors: rejectors};
	var callAsync = typeof setImmediate === "function" ? setImmediate : setTimeout;
	function handler(list, shouldAbsorb) {
		return function execute(value) {
			var then;
			try {
				if (shouldAbsorb && value != null && (typeof value === "object" || typeof value === "function") && typeof (then = value.then) === "function") {
					if (value === self) throw new TypeError("Promise can't be resolved w/ itself")
					executeOnce(then.bind(value));
				}
				else {
					callAsync(function() {
						if (!shouldAbsorb && list.length === 0) console.error("Possible unhandled promise rejection:", value);
						for (var i = 0; i < list.length; i++) list[i](value);
						resolvers.length = 0, rejectors.length = 0;
						instance.state = shouldAbsorb;
						instance.retry = function() {execute(value);};
					});
				}
			}
			catch (e) {
				rejectCurrent(e);
			}
		}
	}
	function executeOnce(then) {
		var runs = 0;
		function run(fn) {
			return function(value) {
				if (runs++ > 0) return
				fn(value);
			}
		}
		var onerror = run(rejectCurrent);
		try {then(run(resolveCurrent), onerror);} catch (e) {onerror(e);}
	}
	executeOnce(executor);
};
PromisePolyfill.prototype.then = function(onFulfilled, onRejection) {
	var self = this, instance = self._instance;
	function handle(callback, list, next, state) {
		list.push(function(value) {
			if (typeof callback !== "function") next(value);
			else try {resolveNext(callback(value));} catch (e) {if (rejectNext) rejectNext(e);}
		});
		if (typeof instance.retry === "function" && state === instance.state) instance.retry();
	}
	var resolveNext, rejectNext;
	var promise = new PromisePolyfill(function(resolve, reject) {resolveNext = resolve, rejectNext = reject;});
	handle(onFulfilled, instance.resolvers, resolveNext, true), handle(onRejection, instance.rejectors, rejectNext, false);
	return promise
};
PromisePolyfill.prototype.catch = function(onRejection) {
	return this.then(null, onRejection)
};
PromisePolyfill.resolve = function(value) {
	if (value instanceof PromisePolyfill) return value
	return new PromisePolyfill(function(resolve) {resolve(value);})
};
PromisePolyfill.reject = function(value) {
	return new PromisePolyfill(function(resolve, reject) {reject(value);})
};
PromisePolyfill.all = function(list) {
	return new PromisePolyfill(function(resolve, reject) {
		var total = list.length, count = 0, values = [];
		if (list.length === 0) resolve([]);
		else for (var i = 0; i < list.length; i++) {
			(function(i) {
				function consume(value) {
					count++;
					values[i] = value;
					if (count === total) resolve(values);
				}
				if (list[i] != null && (typeof list[i] === "object" || typeof list[i] === "function") && typeof list[i].then === "function") {
					list[i].then(consume, reject);
				}
				else consume(list[i]);
			})(i);
		}
	})
};
PromisePolyfill.race = function(list) {
	return new PromisePolyfill(function(resolve, reject) {
		for (var i = 0; i < list.length; i++) {
			list[i].then(resolve, reject);
		}
	})
};
if (typeof window !== "undefined") {
	if (typeof window.Promise === "undefined") window.Promise = PromisePolyfill;
	var PromisePolyfill = window.Promise;
} else if (typeof commonjsGlobal !== "undefined") {
	if (typeof commonjsGlobal.Promise === "undefined") commonjsGlobal.Promise = PromisePolyfill;
	var PromisePolyfill = commonjsGlobal.Promise;
}
var buildQueryString = function(object) {
	if (Object.prototype.toString.call(object) !== "[object Object]") return ""
	var args = [];
	for (var key0 in object) {
		destructure(key0, object[key0]);
	}
	return args.join("&")
	function destructure(key0, value) {
		if (Array.isArray(value)) {
			for (var i = 0; i < value.length; i++) {
				destructure(key0 + "[" + i + "]", value[i]);
			}
		}
		else if (Object.prototype.toString.call(value) === "[object Object]") {
			for (var i in value) {
				destructure(key0 + "[" + i + "]", value[i]);
			}
		}
		else args.push(encodeURIComponent(key0) + (value != null && value !== "" ? "=" + encodeURIComponent(value) : ""));
	}
};
var FILE_PROTOCOL_REGEX = new RegExp("^file://", "i");
var _8 = function($window, Promise) {
	var callbackCount = 0;
	var oncompletion;
	function setCompletionCallback(callback) {oncompletion = callback;}
	function finalizer() {
		var count = 0;
		function complete() {if (--count === 0 && typeof oncompletion === "function") oncompletion();}
		return function finalize(promise0) {
			var then0 = promise0.then;
			promise0.then = function() {
				count++;
				var next = then0.apply(promise0, arguments);
				next.then(complete, function(e) {
					complete();
					if (count === 0) throw e
				});
				return finalize(next)
			};
			return promise0
		}
	}
	function normalize(args, extra) {
		if (typeof args === "string") {
			var url = args;
			args = extra || {};
			if (args.url == null) args.url = url;
		}
		return args
	}
	function request(args, extra) {
		var finalize = finalizer();
		args = normalize(args, extra);
		var promise0 = new Promise(function(resolve, reject) {
			if (args.method == null) args.method = "GET";
			args.method = args.method.toUpperCase();
			var useBody = (args.method === "GET" || args.method === "TRACE") ? false : (typeof args.useBody === "boolean" ? args.useBody : true);
			if (typeof args.serialize !== "function") args.serialize = typeof FormData !== "undefined" && args.data instanceof FormData ? function(value) {return value} : JSON.stringify;
			if (typeof args.deserialize !== "function") args.deserialize = deserialize;
			if (typeof args.extract !== "function") args.extract = extract;
			args.url = interpolate(args.url, args.data);
			if (useBody) args.data = args.serialize(args.data);
			else args.url = assemble(args.url, args.data);
			var xhr = new $window.XMLHttpRequest(),
				aborted = false,
				_abort = xhr.abort;
			xhr.abort = function abort() {
				aborted = true;
				_abort.call(xhr);
			};
			xhr.open(args.method, args.url, typeof args.async === "boolean" ? args.async : true, typeof args.user === "string" ? args.user : undefined, typeof args.password === "string" ? args.password : undefined);
			if (args.serialize === JSON.stringify && useBody && !(args.headers && args.headers.hasOwnProperty("Content-Type"))) {
				xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
			}
			if (args.deserialize === deserialize && !(args.headers && args.headers.hasOwnProperty("Accept"))) {
				xhr.setRequestHeader("Accept", "application/json, text/*");
			}
			if (args.withCredentials) xhr.withCredentials = args.withCredentials;
			for (var key in args.headers) if ({}.hasOwnProperty.call(args.headers, key)) {
				xhr.setRequestHeader(key, args.headers[key]);
			}
			if (typeof args.config === "function") xhr = args.config(xhr, args) || xhr;
			xhr.onreadystatechange = function() {
				// Don't throw errors on xhr.abort().
				if(aborted) return
				if (xhr.readyState === 4) {
					try {
						var response = (args.extract !== extract) ? args.extract(xhr, args) : args.deserialize(args.extract(xhr, args));
						if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304 || FILE_PROTOCOL_REGEX.test(args.url)) {
							resolve(cast(args.type, response));
						}
						else {
							var error = new Error(xhr.responseText);
							for (var key in response) error[key] = response[key];
							reject(error);
						}
					}
					catch (e) {
						reject(e);
					}
				}
			};
			if (useBody && (args.data != null)) xhr.send(args.data);
			else xhr.send();
		});
		return args.background === true ? promise0 : finalize(promise0)
	}
	function jsonp(args, extra) {
		var finalize = finalizer();
		args = normalize(args, extra);
		var promise0 = new Promise(function(resolve, reject) {
			var callbackName = args.callbackName || "_mithril_" + Math.round(Math.random() * 1e16) + "_" + callbackCount++;
			var script = $window.document.createElement("script");
			$window[callbackName] = function(data) {
				script.parentNode.removeChild(script);
				resolve(cast(args.type, data));
				delete $window[callbackName];
			};
			script.onerror = function() {
				script.parentNode.removeChild(script);
				reject(new Error("JSONP request failed"));
				delete $window[callbackName];
			};
			if (args.data == null) args.data = {};
			args.url = interpolate(args.url, args.data);
			args.data[args.callbackKey || "callback"] = callbackName;
			script.src = assemble(args.url, args.data);
			$window.document.documentElement.appendChild(script);
		});
		return args.background === true? promise0 : finalize(promise0)
	}
	function interpolate(url, data) {
		if (data == null) return url
		var tokens = url.match(/:[^\/]+/gi) || [];
		for (var i = 0; i < tokens.length; i++) {
			var key = tokens[i].slice(1);
			if (data[key] != null) {
				url = url.replace(tokens[i], data[key]);
			}
		}
		return url
	}
	function assemble(url, data) {
		var querystring = buildQueryString(data);
		if (querystring !== "") {
			var prefix = url.indexOf("?") < 0 ? "?" : "&";
			url += prefix + querystring;
		}
		return url
	}
	function deserialize(data) {
		try {return data !== "" ? JSON.parse(data) : null}
		catch (e) {throw new Error(data)}
	}
	function extract(xhr) {return xhr.responseText}
	function cast(type0, data) {
		if (typeof type0 === "function") {
			if (Array.isArray(data)) {
				for (var i = 0; i < data.length; i++) {
					data[i] = new type0(data[i]);
				}
			}
			else return new type0(data)
		}
		return data
	}
	return {request: request, jsonp: jsonp, setCompletionCallback: setCompletionCallback}
};
var requestService = _8(window, PromisePolyfill);
var coreRenderer = function($window) {
	var $doc = $window.document;
	var $emptyFragment = $doc.createDocumentFragment();
	var nameSpace = {
		svg: "http://www.w3.org/2000/svg",
		math: "http://www.w3.org/1998/Math/MathML"
	};
	var onevent;
	function setEventCallback(callback) {return onevent = callback}
	function getNameSpace(vnode) {
		return vnode.attrs && vnode.attrs.xmlns || nameSpace[vnode.tag]
	}
	//create
	function createNodes(parent, vnodes, start, end, hooks, nextSibling, ns) {
		for (var i = start; i < end; i++) {
			var vnode = vnodes[i];
			if (vnode != null) {
				createNode(parent, vnode, hooks, ns, nextSibling);
			}
		}
	}
	function createNode(parent, vnode, hooks, ns, nextSibling) {
		var tag = vnode.tag;
		if (typeof tag === "string") {
			vnode.state = {};
			if (vnode.attrs != null) initLifecycle(vnode.attrs, vnode, hooks);
			switch (tag) {
				case "#": return createText(parent, vnode, nextSibling)
				case "<": return createHTML(parent, vnode, nextSibling)
				case "[": return createFragment(parent, vnode, hooks, ns, nextSibling)
				default: return createElement(parent, vnode, hooks, ns, nextSibling)
			}
		}
		else return createComponent(parent, vnode, hooks, ns, nextSibling)
	}
	function createText(parent, vnode, nextSibling) {
		vnode.dom = $doc.createTextNode(vnode.children);
		insertNode(parent, vnode.dom, nextSibling);
		return vnode.dom
	}
	function createHTML(parent, vnode, nextSibling) {
		var match1 = vnode.children.match(/^\s*?<(\w+)/im) || [];
		var parent1 = {caption: "table", thead: "table", tbody: "table", tfoot: "table", tr: "tbody", th: "tr", td: "tr", colgroup: "table", col: "colgroup"}[match1[1]] || "div";
		var temp = $doc.createElement(parent1);
		temp.innerHTML = vnode.children;
		vnode.dom = temp.firstChild;
		vnode.domSize = temp.childNodes.length;
		var fragment = $doc.createDocumentFragment();
		var child;
		while (child = temp.firstChild) {
			fragment.appendChild(child);
		}
		insertNode(parent, fragment, nextSibling);
		return fragment
	}
	function createFragment(parent, vnode, hooks, ns, nextSibling) {
		var fragment = $doc.createDocumentFragment();
		if (vnode.children != null) {
			var children = vnode.children;
			createNodes(fragment, children, 0, children.length, hooks, null, ns);
		}
		vnode.dom = fragment.firstChild;
		vnode.domSize = fragment.childNodes.length;
		insertNode(parent, fragment, nextSibling);
		return fragment
	}
	function createElement(parent, vnode, hooks, ns, nextSibling) {
		var tag = vnode.tag;
		var attrs2 = vnode.attrs;
		var is = attrs2 && attrs2.is;
		ns = getNameSpace(vnode) || ns;
		var element = ns ?
			is ? $doc.createElementNS(ns, tag, {is: is}) : $doc.createElementNS(ns, tag) :
			is ? $doc.createElement(tag, {is: is}) : $doc.createElement(tag);
		vnode.dom = element;
		if (attrs2 != null) {
			setAttrs(vnode, attrs2, ns);
		}
		insertNode(parent, element, nextSibling);
		if (vnode.attrs != null && vnode.attrs.contenteditable != null) {
			setContentEditable(vnode);
		}
		else {
			if (vnode.text != null) {
				if (vnode.text !== "") element.textContent = vnode.text;
				else vnode.children = [Vnode("#", undefined, undefined, vnode.text, undefined, undefined)];
			}
			if (vnode.children != null) {
				var children = vnode.children;
				createNodes(element, children, 0, children.length, hooks, null, ns);
				setLateAttrs(vnode);
			}
		}
		return element
	}
	function initComponent(vnode, hooks) {
		var sentinel;
		if (typeof vnode.tag.view === "function") {
			vnode.state = Object.create(vnode.tag);
			sentinel = vnode.state.view;
			if (sentinel.$$reentrantLock$$ != null) return $emptyFragment
			sentinel.$$reentrantLock$$ = true;
		} else {
			vnode.state = void 0;
			sentinel = vnode.tag;
			if (sentinel.$$reentrantLock$$ != null) return $emptyFragment
			sentinel.$$reentrantLock$$ = true;
			vnode.state = (vnode.tag.prototype != null && typeof vnode.tag.prototype.view === "function") ? new vnode.tag(vnode) : vnode.tag(vnode);
		}
		vnode._state = vnode.state;
		if (vnode.attrs != null) initLifecycle(vnode.attrs, vnode, hooks);
		initLifecycle(vnode._state, vnode, hooks);
		vnode.instance = Vnode.normalize(vnode._state.view.call(vnode.state, vnode));
		if (vnode.instance === vnode) throw Error("A view cannot return the vnode it received as argument")
		sentinel.$$reentrantLock$$ = null;
	}
	function createComponent(parent, vnode, hooks, ns, nextSibling) {
		initComponent(vnode, hooks);
		if (vnode.instance != null) {
			var element = createNode(parent, vnode.instance, hooks, ns, nextSibling);
			vnode.dom = vnode.instance.dom;
			vnode.domSize = vnode.dom != null ? vnode.instance.domSize : 0;
			insertNode(parent, element, nextSibling);
			return element
		}
		else {
			vnode.domSize = 0;
			return $emptyFragment
		}
	}
	//update
	function updateNodes(parent, old, vnodes, recycling, hooks, nextSibling, ns) {
		if (old === vnodes || old == null && vnodes == null) return
		else if (old == null) createNodes(parent, vnodes, 0, vnodes.length, hooks, nextSibling, ns);
		else if (vnodes == null) removeNodes(old, 0, old.length, vnodes);
		else {
			if (old.length === vnodes.length) {
				var isUnkeyed = false;
				for (var i = 0; i < vnodes.length; i++) {
					if (vnodes[i] != null && old[i] != null) {
						isUnkeyed = vnodes[i].key == null && old[i].key == null;
						break
					}
				}
				if (isUnkeyed) {
					for (var i = 0; i < old.length; i++) {
						if (old[i] === vnodes[i]) continue
						else if (old[i] == null && vnodes[i] != null) createNode(parent, vnodes[i], hooks, ns, getNextSibling(old, i + 1, nextSibling));
						else if (vnodes[i] == null) removeNodes(old, i, i + 1, vnodes);
						else updateNode(parent, old[i], vnodes[i], hooks, getNextSibling(old, i + 1, nextSibling), recycling, ns);
					}
					return
				}
			}
			recycling = recycling || isRecyclable(old, vnodes);
			if (recycling) {
				var pool = old.pool;
				old = old.concat(old.pool);
			}
			var oldStart = 0, start = 0, oldEnd = old.length - 1, end = vnodes.length - 1, map;
			while (oldEnd >= oldStart && end >= start) {
				var o = old[oldStart], v = vnodes[start];
				if (o === v && !recycling) oldStart++, start++;
				else if (o == null) oldStart++;
				else if (v == null) start++;
				else if (o.key === v.key) {
					var shouldRecycle = (pool != null && oldStart >= old.length - pool.length) || ((pool == null) && recycling);
					oldStart++, start++;
					updateNode(parent, o, v, hooks, getNextSibling(old, oldStart, nextSibling), shouldRecycle, ns);
					if (recycling && o.tag === v.tag) insertNode(parent, toFragment(o), nextSibling);
				}
				else {
					var o = old[oldEnd];
					if (o === v && !recycling) oldEnd--, start++;
					else if (o == null) oldEnd--;
					else if (v == null) start++;
					else if (o.key === v.key) {
						var shouldRecycle = (pool != null && oldEnd >= old.length - pool.length) || ((pool == null) && recycling);
						updateNode(parent, o, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), shouldRecycle, ns);
						if (recycling || start < end) insertNode(parent, toFragment(o), getNextSibling(old, oldStart, nextSibling));
						oldEnd--, start++;
					}
					else break
				}
			}
			while (oldEnd >= oldStart && end >= start) {
				var o = old[oldEnd], v = vnodes[end];
				if (o === v && !recycling) oldEnd--, end--;
				else if (o == null) oldEnd--;
				else if (v == null) end--;
				else if (o.key === v.key) {
					var shouldRecycle = (pool != null && oldEnd >= old.length - pool.length) || ((pool == null) && recycling);
					updateNode(parent, o, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), shouldRecycle, ns);
					if (recycling && o.tag === v.tag) insertNode(parent, toFragment(o), nextSibling);
					if (o.dom != null) nextSibling = o.dom;
					oldEnd--, end--;
				}
				else {
					if (!map) map = getKeyMap(old, oldEnd);
					if (v != null) {
						var oldIndex = map[v.key];
						if (oldIndex != null) {
							var movable = old[oldIndex];
							var shouldRecycle = (pool != null && oldIndex >= old.length - pool.length) || ((pool == null) && recycling);
							updateNode(parent, movable, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), recycling, ns);
							insertNode(parent, toFragment(movable), nextSibling);
							old[oldIndex].skip = true;
							if (movable.dom != null) nextSibling = movable.dom;
						}
						else {
							var dom = createNode(parent, v, hooks, ns, nextSibling);
							nextSibling = dom;
						}
					}
					end--;
				}
				if (end < start) break
			}
			createNodes(parent, vnodes, start, end + 1, hooks, nextSibling, ns);
			removeNodes(old, oldStart, oldEnd + 1, vnodes);
		}
	}
	function updateNode(parent, old, vnode, hooks, nextSibling, recycling, ns) {
		var oldTag = old.tag, tag = vnode.tag;
		if (oldTag === tag) {
			vnode.state = old.state;
			vnode._state = old._state;
			vnode.events = old.events;
			if (!recycling && shouldNotUpdate(vnode, old)) return
			if (typeof oldTag === "string") {
				if (vnode.attrs != null) {
					if (recycling) {
						vnode.state = {};
						initLifecycle(vnode.attrs, vnode, hooks);
					}
					else updateLifecycle(vnode.attrs, vnode, hooks);
				}
				switch (oldTag) {
					case "#": updateText(old, vnode); break
					case "<": updateHTML(parent, old, vnode, nextSibling); break
					case "[": updateFragment(parent, old, vnode, recycling, hooks, nextSibling, ns); break
					default: updateElement(old, vnode, recycling, hooks, ns);
				}
			}
			else updateComponent(parent, old, vnode, hooks, nextSibling, recycling, ns);
		}
		else {
			removeNode(old, null);
			createNode(parent, vnode, hooks, ns, nextSibling);
		}
	}
	function updateText(old, vnode) {
		if (old.children.toString() !== vnode.children.toString()) {
			old.dom.nodeValue = vnode.children;
		}
		vnode.dom = old.dom;
	}
	function updateHTML(parent, old, vnode, nextSibling) {
		if (old.children !== vnode.children) {
			toFragment(old);
			createHTML(parent, vnode, nextSibling);
		}
		else vnode.dom = old.dom, vnode.domSize = old.domSize;
	}
	function updateFragment(parent, old, vnode, recycling, hooks, nextSibling, ns) {
		updateNodes(parent, old.children, vnode.children, recycling, hooks, nextSibling, ns);
		var domSize = 0, children = vnode.children;
		vnode.dom = null;
		if (children != null) {
			for (var i = 0; i < children.length; i++) {
				var child = children[i];
				if (child != null && child.dom != null) {
					if (vnode.dom == null) vnode.dom = child.dom;
					domSize += child.domSize || 1;
				}
			}
			if (domSize !== 1) vnode.domSize = domSize;
		}
	}
	function updateElement(old, vnode, recycling, hooks, ns) {
		var element = vnode.dom = old.dom;
		ns = getNameSpace(vnode) || ns;
		if (vnode.tag === "textarea") {
			if (vnode.attrs == null) vnode.attrs = {};
			if (vnode.text != null) {
				vnode.attrs.value = vnode.text; //FIXME handle0 multiple children
				vnode.text = undefined;
			}
		}
		updateAttrs(vnode, old.attrs, vnode.attrs, ns);
		if (vnode.attrs != null && vnode.attrs.contenteditable != null) {
			setContentEditable(vnode);
		}
		else if (old.text != null && vnode.text != null && vnode.text !== "") {
			if (old.text.toString() !== vnode.text.toString()) old.dom.firstChild.nodeValue = vnode.text;
		}
		else {
			if (old.text != null) old.children = [Vnode("#", undefined, undefined, old.text, undefined, old.dom.firstChild)];
			if (vnode.text != null) vnode.children = [Vnode("#", undefined, undefined, vnode.text, undefined, undefined)];
			updateNodes(element, old.children, vnode.children, recycling, hooks, null, ns);
		}
	}
	function updateComponent(parent, old, vnode, hooks, nextSibling, recycling, ns) {
		if (recycling) {
			initComponent(vnode, hooks);
		} else {
			vnode.instance = Vnode.normalize(vnode._state.view.call(vnode.state, vnode));
			if (vnode.instance === vnode) throw Error("A view cannot return the vnode it received as argument")
			if (vnode.attrs != null) updateLifecycle(vnode.attrs, vnode, hooks);
			updateLifecycle(vnode._state, vnode, hooks);
		}
		if (vnode.instance != null) {
			if (old.instance == null) createNode(parent, vnode.instance, hooks, ns, nextSibling);
			else updateNode(parent, old.instance, vnode.instance, hooks, nextSibling, recycling, ns);
			vnode.dom = vnode.instance.dom;
			vnode.domSize = vnode.instance.domSize;
		}
		else if (old.instance != null) {
			removeNode(old.instance, null);
			vnode.dom = undefined;
			vnode.domSize = 0;
		}
		else {
			vnode.dom = old.dom;
			vnode.domSize = old.domSize;
		}
	}
	function isRecyclable(old, vnodes) {
		if (old.pool != null && Math.abs(old.pool.length - vnodes.length) <= Math.abs(old.length - vnodes.length)) {
			var oldChildrenLength = old[0] && old[0].children && old[0].children.length || 0;
			var poolChildrenLength = old.pool[0] && old.pool[0].children && old.pool[0].children.length || 0;
			var vnodesChildrenLength = vnodes[0] && vnodes[0].children && vnodes[0].children.length || 0;
			if (Math.abs(poolChildrenLength - vnodesChildrenLength) <= Math.abs(oldChildrenLength - vnodesChildrenLength)) {
				return true
			}
		}
		return false
	}
	function getKeyMap(vnodes, end) {
		var map = {}, i = 0;
		for (var i = 0; i < end; i++) {
			var vnode = vnodes[i];
			if (vnode != null) {
				var key2 = vnode.key;
				if (key2 != null) map[key2] = i;
			}
		}
		return map
	}
	function toFragment(vnode) {
		var count0 = vnode.domSize;
		if (count0 != null || vnode.dom == null) {
			var fragment = $doc.createDocumentFragment();
			if (count0 > 0) {
				var dom = vnode.dom;
				while (--count0) fragment.appendChild(dom.nextSibling);
				fragment.insertBefore(dom, fragment.firstChild);
			}
			return fragment
		}
		else return vnode.dom
	}
	function getNextSibling(vnodes, i, nextSibling) {
		for (; i < vnodes.length; i++) {
			if (vnodes[i] != null && vnodes[i].dom != null) return vnodes[i].dom
		}
		return nextSibling
	}
	function insertNode(parent, dom, nextSibling) {
		if (nextSibling && nextSibling.parentNode) parent.insertBefore(dom, nextSibling);
		else parent.appendChild(dom);
	}
	function setContentEditable(vnode) {
		var children = vnode.children;
		if (children != null && children.length === 1 && children[0].tag === "<") {
			var content = children[0].children;
			if (vnode.dom.innerHTML !== content) vnode.dom.innerHTML = content;
		}
		else if (vnode.text != null || children != null && children.length !== 0) throw new Error("Child node of a contenteditable must be trusted")
	}
	//remove
	function removeNodes(vnodes, start, end, context) {
		for (var i = start; i < end; i++) {
			var vnode = vnodes[i];
			if (vnode != null) {
				if (vnode.skip) vnode.skip = false;
				else removeNode(vnode, context);
			}
		}
	}
	function removeNode(vnode, context) {
		var expected = 1, called = 0;
		if (vnode.attrs && typeof vnode.attrs.onbeforeremove === "function") {
			var result = vnode.attrs.onbeforeremove.call(vnode.state, vnode);
			if (result != null && typeof result.then === "function") {
				expected++;
				result.then(continuation, continuation);
			}
		}
		if (typeof vnode.tag !== "string" && typeof vnode._state.onbeforeremove === "function") {
			var result = vnode._state.onbeforeremove.call(vnode.state, vnode);
			if (result != null && typeof result.then === "function") {
				expected++;
				result.then(continuation, continuation);
			}
		}
		continuation();
		function continuation() {
			if (++called === expected) {
				onremove(vnode);
				if (vnode.dom) {
					var count0 = vnode.domSize || 1;
					if (count0 > 1) {
						var dom = vnode.dom;
						while (--count0) {
							removeNodeFromDOM(dom.nextSibling);
						}
					}
					removeNodeFromDOM(vnode.dom);
					if (context != null && vnode.domSize == null && !hasIntegrationMethods(vnode.attrs) && typeof vnode.tag === "string") { //TODO test custom elements
						if (!context.pool) context.pool = [vnode];
						else context.pool.push(vnode);
					}
				}
			}
		}
	}
	function removeNodeFromDOM(node) {
		var parent = node.parentNode;
		if (parent != null) parent.removeChild(node);
	}
	function onremove(vnode) {
		if (vnode.attrs && typeof vnode.attrs.onremove === "function") vnode.attrs.onremove.call(vnode.state, vnode);
		if (typeof vnode.tag !== "string" && typeof vnode._state.onremove === "function") vnode._state.onremove.call(vnode.state, vnode);
		if (vnode.instance != null) onremove(vnode.instance);
		else {
			var children = vnode.children;
			if (Array.isArray(children)) {
				for (var i = 0; i < children.length; i++) {
					var child = children[i];
					if (child != null) onremove(child);
				}
			}
		}
	}
	//attrs2
	function setAttrs(vnode, attrs2, ns) {
		for (var key2 in attrs2) {
			setAttr(vnode, key2, null, attrs2[key2], ns);
		}
	}
	function setAttr(vnode, key2, old, value, ns) {
		var element = vnode.dom;
		if (key2 === "key" || key2 === "is" || (old === value && !isFormAttribute(vnode, key2)) && typeof value !== "object" || typeof value === "undefined" || isLifecycleMethod(key2)) return
		var nsLastIndex = key2.indexOf(":");
		if (nsLastIndex > -1 && key2.substr(0, nsLastIndex) === "xlink") {
			element.setAttributeNS("http://www.w3.org/1999/xlink", key2.slice(nsLastIndex + 1), value);
		}
		else if (key2[0] === "o" && key2[1] === "n" && typeof value === "function") updateEvent(vnode, key2, value);
		else if (key2 === "style") updateStyle(element, old, value);
		else if (key2 in element && !isAttribute(key2) && ns === undefined && !isCustomElement(vnode)) {
			if (key2 === "value") {
				var normalized0 = "" + value; // eslint-disable-line no-implicit-coercion
				//setting input[value] to same value by typing on focused element moves cursor to end in Chrome
				if ((vnode.tag === "input" || vnode.tag === "textarea") && vnode.dom.value === normalized0 && vnode.dom === $doc.activeElement) return
				//setting select[value] to same value while having select open blinks select dropdown in Chrome
				if (vnode.tag === "select") {
					if (value === null) {
						if (vnode.dom.selectedIndex === -1 && vnode.dom === $doc.activeElement) return
					} else {
						if (old !== null && vnode.dom.value === normalized0 && vnode.dom === $doc.activeElement) return
					}
				}
				//setting option[value] to same value while having select open blinks select dropdown in Chrome
				if (vnode.tag === "option" && old != null && vnode.dom.value === normalized0) return
			}
			// If you assign an input type1 that is not supported by IE 11 with an assignment expression, an error0 will occur.
			if (vnode.tag === "input" && key2 === "type") {
				element.setAttribute(key2, value);
				return
			}
			element[key2] = value;
		}
		else {
			if (typeof value === "boolean") {
				if (value) element.setAttribute(key2, "");
				else element.removeAttribute(key2);
			}
			else element.setAttribute(key2 === "className" ? "class" : key2, value);
		}
	}
	function setLateAttrs(vnode) {
		var attrs2 = vnode.attrs;
		if (vnode.tag === "select" && attrs2 != null) {
			if ("value" in attrs2) setAttr(vnode, "value", null, attrs2.value, undefined);
			if ("selectedIndex" in attrs2) setAttr(vnode, "selectedIndex", null, attrs2.selectedIndex, undefined);
		}
	}
	function updateAttrs(vnode, old, attrs2, ns) {
		if (attrs2 != null) {
			for (var key2 in attrs2) {
				setAttr(vnode, key2, old && old[key2], attrs2[key2], ns);
			}
		}
		if (old != null) {
			for (var key2 in old) {
				if (attrs2 == null || !(key2 in attrs2)) {
					if (key2 === "className") key2 = "class";
					if (key2[0] === "o" && key2[1] === "n" && !isLifecycleMethod(key2)) updateEvent(vnode, key2, undefined);
					else if (key2 !== "key") vnode.dom.removeAttribute(key2);
				}
			}
		}
	}
	function isFormAttribute(vnode, attr) {
		return attr === "value" || attr === "checked" || attr === "selectedIndex" || attr === "selected" && vnode.dom === $doc.activeElement
	}
	function isLifecycleMethod(attr) {
		return attr === "oninit" || attr === "oncreate" || attr === "onupdate" || attr === "onremove" || attr === "onbeforeremove" || attr === "onbeforeupdate"
	}
	function isAttribute(attr) {
		return attr === "href" || attr === "list" || attr === "form" || attr === "width" || attr === "height"// || attr === "type"
	}
	function isCustomElement(vnode){
		return vnode.attrs.is || vnode.tag.indexOf("-") > -1
	}
	function hasIntegrationMethods(source) {
		return source != null && (source.oncreate || source.onupdate || source.onbeforeremove || source.onremove)
	}
	//style
	function updateStyle(element, old, style) {
		if (old === style) element.style.cssText = "", old = null;
		if (style == null) element.style.cssText = "";
		else if (typeof style === "string") element.style.cssText = style;
		else {
			if (typeof old === "string") element.style.cssText = "";
			for (var key2 in style) {
				element.style[key2] = style[key2];
			}
			if (old != null && typeof old !== "string") {
				for (var key2 in old) {
					if (!(key2 in style)) element.style[key2] = "";
				}
			}
		}
	}
	//event
	function updateEvent(vnode, key2, value) {
		var element = vnode.dom;
		var callback = typeof onevent !== "function" ? value : function(e) {
			var result = value.call(element, e);
			onevent.call(element, e);
			return result
		};
		if (key2 in element) element[key2] = typeof value === "function" ? callback : null;
		else {
			var eventName = key2.slice(2);
			if (vnode.events === undefined) vnode.events = {};
			if (vnode.events[key2] === callback) return
			if (vnode.events[key2] != null) element.removeEventListener(eventName, vnode.events[key2], false);
			if (typeof value === "function") {
				vnode.events[key2] = callback;
				element.addEventListener(eventName, vnode.events[key2], false);
			}
		}
	}
	//lifecycle
	function initLifecycle(source, vnode, hooks) {
		if (typeof source.oninit === "function") source.oninit.call(vnode.state, vnode);
		if (typeof source.oncreate === "function") hooks.push(source.oncreate.bind(vnode.state, vnode));
	}
	function updateLifecycle(source, vnode, hooks) {
		if (typeof source.onupdate === "function") hooks.push(source.onupdate.bind(vnode.state, vnode));
	}
	function shouldNotUpdate(vnode, old) {
		var forceVnodeUpdate, forceComponentUpdate;
		if (vnode.attrs != null && typeof vnode.attrs.onbeforeupdate === "function") forceVnodeUpdate = vnode.attrs.onbeforeupdate.call(vnode.state, vnode, old);
		if (typeof vnode.tag !== "string" && typeof vnode._state.onbeforeupdate === "function") forceComponentUpdate = vnode._state.onbeforeupdate.call(vnode.state, vnode, old);
		if (!(forceVnodeUpdate === undefined && forceComponentUpdate === undefined) && !forceVnodeUpdate && !forceComponentUpdate) {
			vnode.dom = old.dom;
			vnode.domSize = old.domSize;
			vnode.instance = old.instance;
			return true
		}
		return false
	}
	function render(dom, vnodes) {
		if (!dom) throw new Error("Ensure the DOM element being passed to m.route/m.mount/m.render is not undefined.")
		var hooks = [];
		var active = $doc.activeElement;
		var namespace = dom.namespaceURI;
		// First time0 rendering into a node clears it out
		if (dom.vnodes == null) dom.textContent = "";
		if (!Array.isArray(vnodes)) vnodes = [vnodes];
		updateNodes(dom, dom.vnodes, Vnode.normalizeChildren(vnodes), false, hooks, null, namespace === "http://www.w3.org/1999/xhtml" ? undefined : namespace);
		dom.vnodes = vnodes;
		for (var i = 0; i < hooks.length; i++) hooks[i]();
		// document.activeElement can return null in IE https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement
		if (active != null && $doc.activeElement !== active) active.focus();
	}
	return {render: render, setEventCallback: setEventCallback}
};
function throttle(callback) {
	//60fps translates to 16.6ms, round it down since setTimeout requires int
	var time = 16;
	var last = 0, pending = null;
	var timeout = typeof requestAnimationFrame === "function" ? requestAnimationFrame : setTimeout;
	return function() {
		var now = Date.now();
		if (last === 0 || now - last >= time) {
			last = now;
			callback();
		}
		else if (pending === null) {
			pending = timeout(function() {
				pending = null;
				callback();
				last = Date.now();
			}, time - (now - last));
		}
	}
}
var _11 = function($window) {
	var renderService = coreRenderer($window);
	renderService.setEventCallback(function(e) {
		if (e.redraw === false) e.redraw = undefined;
		else redraw();
	});
	var callbacks = [];
	function subscribe(key1, callback) {
		unsubscribe(key1);
		callbacks.push(key1, throttle(callback));
	}
	function unsubscribe(key1) {
		var index = callbacks.indexOf(key1);
		if (index > -1) callbacks.splice(index, 2);
	}
	function redraw() {
		for (var i = 1; i < callbacks.length; i += 2) {
			callbacks[i]();
		}
	}
	return {subscribe: subscribe, unsubscribe: unsubscribe, redraw: redraw, render: renderService.render}
};
var redrawService = _11(window);
requestService.setCompletionCallback(redrawService.redraw);
var _16 = function(redrawService0) {
	return function(root, component) {
		if (component === null) {
			redrawService0.render(root, []);
			redrawService0.unsubscribe(root);
			return
		}
		
		if (component.view == null && typeof component !== "function") throw new Error("m.mount(element, component) expects a component, not a vnode")
		
		var run0 = function() {
			redrawService0.render(root, Vnode(component));
		};
		redrawService0.subscribe(root, run0);
		redrawService0.redraw();
	}
};
m.mount = _16(redrawService);
var Promise = PromisePolyfill;
var parseQueryString = function(string) {
	if (string === "" || string == null) return {}
	if (string.charAt(0) === "?") string = string.slice(1);
	var entries = string.split("&"), data0 = {}, counters = {};
	for (var i = 0; i < entries.length; i++) {
		var entry = entries[i].split("=");
		var key5 = decodeURIComponent(entry[0]);
		var value = entry.length === 2 ? decodeURIComponent(entry[1]) : "";
		if (value === "true") value = true;
		else if (value === "false") value = false;
		var levels = key5.split(/\]\[?|\[/);
		var cursor = data0;
		if (key5.indexOf("[") > -1) levels.pop();
		for (var j = 0; j < levels.length; j++) {
			var level = levels[j], nextLevel = levels[j + 1];
			var isNumber = nextLevel == "" || !isNaN(parseInt(nextLevel, 10));
			var isValue = j === levels.length - 1;
			if (level === "") {
				var key5 = levels.slice(0, j).join();
				if (counters[key5] == null) counters[key5] = 0;
				level = counters[key5]++;
			}
			if (cursor[level] == null) {
				cursor[level] = isValue ? value : isNumber ? [] : {};
			}
			cursor = cursor[level];
		}
	}
	return data0
};
var coreRouter = function($window) {
	var supportsPushState = typeof $window.history.pushState === "function";
	var callAsync0 = typeof setImmediate === "function" ? setImmediate : setTimeout;
	function normalize1(fragment0) {
		var data = $window.location[fragment0].replace(/(?:%[a-f89][a-f0-9])+/gim, decodeURIComponent);
		if (fragment0 === "pathname" && data[0] !== "/") data = "/" + data;
		return data
	}
	var asyncId;
	function debounceAsync(callback0) {
		return function() {
			if (asyncId != null) return
			asyncId = callAsync0(function() {
				asyncId = null;
				callback0();
			});
		}
	}
	function parsePath(path, queryData, hashData) {
		var queryIndex = path.indexOf("?");
		var hashIndex = path.indexOf("#");
		var pathEnd = queryIndex > -1 ? queryIndex : hashIndex > -1 ? hashIndex : path.length;
		if (queryIndex > -1) {
			var queryEnd = hashIndex > -1 ? hashIndex : path.length;
			var queryParams = parseQueryString(path.slice(queryIndex + 1, queryEnd));
			for (var key4 in queryParams) queryData[key4] = queryParams[key4];
		}
		if (hashIndex > -1) {
			var hashParams = parseQueryString(path.slice(hashIndex + 1));
			for (var key4 in hashParams) hashData[key4] = hashParams[key4];
		}
		return path.slice(0, pathEnd)
	}
	var router = {prefix: "#!"};
	router.getPath = function() {
		var type2 = router.prefix.charAt(0);
		switch (type2) {
			case "#": return normalize1("hash").slice(router.prefix.length)
			case "?": return normalize1("search").slice(router.prefix.length) + normalize1("hash")
			default: return normalize1("pathname").slice(router.prefix.length) + normalize1("search") + normalize1("hash")
		}
	};
	router.setPath = function(path, data, options) {
		var queryData = {}, hashData = {};
		path = parsePath(path, queryData, hashData);
		if (data != null) {
			for (var key4 in data) queryData[key4] = data[key4];
			path = path.replace(/:([^\/]+)/g, function(match2, token) {
				delete queryData[token];
				return data[token]
			});
		}
		var query = buildQueryString(queryData);
		if (query) path += "?" + query;
		var hash = buildQueryString(hashData);
		if (hash) path += "#" + hash;
		if (supportsPushState) {
			var state = options ? options.state : null;
			var title = options ? options.title : null;
			$window.onpopstate();
			if (options && options.replace) $window.history.replaceState(state, title, router.prefix + path);
			else $window.history.pushState(state, title, router.prefix + path);
		}
		else $window.location.href = router.prefix + path;
	};
	router.defineRoutes = function(routes, resolve, reject) {
		function resolveRoute() {
			var path = router.getPath();
			var params = {};
			var pathname = parsePath(path, params, params);
			var state = $window.history.state;
			if (state != null) {
				for (var k in state) params[k] = state[k];
			}
			for (var route0 in routes) {
				var matcher = new RegExp("^" + route0.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$");
				if (matcher.test(pathname)) {
					pathname.replace(matcher, function() {
						var keys = route0.match(/:[^\/]+/g) || [];
						var values = [].slice.call(arguments, 1, -2);
						for (var i = 0; i < keys.length; i++) {
							params[keys[i].replace(/:|\./g, "")] = decodeURIComponent(values[i]);
						}
						resolve(routes[route0], params, path, route0);
					});
					return
				}
			}
			reject(path, params);
		}
		if (supportsPushState) $window.onpopstate = debounceAsync(resolveRoute);
		else if (router.prefix.charAt(0) === "#") $window.onhashchange = resolveRoute;
		resolveRoute();
	};
	return router
};
var _20 = function($window, redrawService0) {
	var routeService = coreRouter($window);
	var identity = function(v) {return v};
	var render1, component, attrs3, currentPath, lastUpdate;
	var route = function(root, defaultRoute, routes) {
		if (root == null) throw new Error("Ensure the DOM element that was passed to `m.route` is not undefined")
		var run1 = function() {
			if (render1 != null) redrawService0.render(root, render1(Vnode(component, attrs3.key, attrs3)));
		};
		var bail = function(path) {
			if (path !== defaultRoute) routeService.setPath(defaultRoute, null, {replace: true});
			else throw new Error("Could not resolve default route " + defaultRoute)
		};
		routeService.defineRoutes(routes, function(payload, params, path) {
			var update = lastUpdate = function(routeResolver, comp) {
				if (update !== lastUpdate) return
				component = comp != null && (typeof comp.view === "function" || typeof comp === "function")? comp : "div";
				attrs3 = params, currentPath = path, lastUpdate = null;
				render1 = (routeResolver.render || identity).bind(routeResolver);
				run1();
			};
			if (payload.view || typeof payload === "function") update({}, payload);
			else {
				if (payload.onmatch) {
					Promise.resolve(payload.onmatch(params, path)).then(function(resolved) {
						update(payload, resolved);
					}, bail);
				}
				else update(payload, "div");
			}
		}, bail);
		redrawService0.subscribe(root, run1);
	};
	route.set = function(path, data, options) {
		if (lastUpdate != null) {
			options = options || {};
			options.replace = true;
		}
		lastUpdate = null;
		routeService.setPath(path, data, options);
	};
	route.get = function() {return currentPath};
	route.prefix = function(prefix0) {routeService.prefix = prefix0;};
	route.link = function(vnode1) {
		vnode1.dom.setAttribute("href", routeService.prefix + vnode1.attrs.href);
		vnode1.dom.onclick = function(e) {
			if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2) return
			e.preventDefault();
			e.redraw = false;
			var href = this.getAttribute("href");
			if (href.indexOf(routeService.prefix) === 0) href = href.slice(routeService.prefix.length);
			route.set(href, undefined, undefined);
		};
	};
	route.param = function(key3) {
		if(typeof attrs3 !== "undefined" && typeof key3 !== "undefined") return attrs3[key3]
		return attrs3
	};
	return route
};
m.route = _20(window, redrawService);
m.withAttr = function(attrName, callback1, context) {
	return function(e) {
		callback1.call(context || this, attrName in e.currentTarget ? e.currentTarget[attrName] : e.currentTarget.getAttribute(attrName));
	}
};
var _28 = coreRenderer(window);
m.render = _28.render;
m.redraw = redrawService.redraw;
m.request = requestService.request;
m.jsonp = requestService.jsonp;
m.parseQueryString = parseQueryString;
m.buildQueryString = buildQueryString;
m.version = "1.1.5";
m.vnode = Vnode;
module["exports"] = m;
}());
});

// @ts-check 

const uuid = () => Math.random().toString(15).slice(2);
const hunter = uuid();
const deer = uuid();
const night = uuid();

const LocalStorage = {

	/**
	 * @param {string} k 
	 * @param {string} v 
	 */
	set(k, v){
		
		// eslint-disable-next-line no-undef
		return localStorage.setItem(k, v)
	}

	,get( /** @type {string}*/ k){
		// eslint-disable-next-line no-undef
		return localStorage.getItem(k)
	}
};

/**
	@param {string} name 
	@param {string[]} positions 
	@returns {Provider.Verb}
 */
function Verb(name, positions){
	return {
		images: {}
		,name
		,positions
	}
}


const Util = {
	/**
	 * 
	 * @param {Provider.Coord} p1 
	 * @param {Provider.Coord} p2 
	 */
	distance(p1, p2){
		const xs = 
			[p2.x - p1.x].map( x => x * x );

		const ys = 
			[p2.y - p1.y].map( x => x * x );
			
		const zs = 
			[p2.z - p1.z].map( x => x * x );
			
		return Math.sqrt( xs[0] + ys[0] + zs[0] )
	}

	,random(multiplier=1){
		return Math.random() * Util.even() * multiplier
	}
	,randomInt(multiplier=1){
		return Math.floor(Util.random(multiplier))
	}
	,even(){
		return Math.random() > 0.5 ? 1 : -1
	}

};


/**
	
	@typedef {{
		resources: {
			img: { 
				[k:string]: { element: HTMLImageElement | null, src: string } 
			}
		}
		frames: {
			[k:string]: Provider.Frame
		}
		camera: Provider.Camera
		coords: {
			[k:string]: Provider.Coord
		}
		canvas: {
			[k:string]: Provider.Canvas
		}
	}} FrameState

 */
const Frame = {
	of(){
		return {
			count: 0
			, width: 0
			, index: 0
			, imageId: null
			, playspeed: 1/8
			, repeat: true
			, scale: 1
			, alpha: 1
		}
	},

	/**
	 * @param {HTMLImageElement | null} element
	 * @param {Provider.Frame} frame
	 */
	onload(element, frame){
		if( element != null ){
			const image = element;

				frame.count = 
					image.width / image.height;
	
				// the height of the strip is the width of a frame
				frame.width = image.height;
	

			frame.index = 0;
		}
	},

	/**
	 	@param {FrameState} state
	 	@param {Provider.Frame} frame
	 	@param {string} imageId
	 */
	reset(state, frame, imageId){

		if( imageId != null ){

			const image = 
				state.resources.img[imageId].element;
			
			frame.imageId = imageId;
	
			if(image != null){
	
				if( image.complete ){	
					Frame.onload(image, frame);
				} else {
					image.onload = () => 
						Frame.onload(image, frame);
				}
	
				// todo-james why is this happening here?
				frame.count = image.width / image.height;
				frame.width = image.height;
			}
		}
		
		frame.index = 0;
		
	},

	/**
		@param { CanvasRenderingContext2D } con 

	 	@param {FrameState} state
		 
	 	@param {Provider.Frame} frame
	 */
	draw(con, state, frame){

		if( frame.imageId != null ){

			const image =
				state.resources.img[frame.imageId].element;

			if( image != null && image.complete ){

				const sx = 
					Math.floor(frame.index)*frame.width;

				const sy = 0;
				const sWidth = frame.width;
				const sHeight = frame.width;
				// positioning within the canvas handled by other systems
				const dx = 0;
				const dy = 0;
				const dWidth = frame.width;
				const dHeight = frame.width;

				if( dWidth > 0 && dHeight > 0 ){

					con.drawImage(
						image
						, sx
						, sy
						, sWidth
						, sHeight
						, dx
						, dy
						, dWidth
						, dHeight
					);
				
				}
				
				
			}
		}
	},

	/**
		@param { CanvasRenderingContext2D } con 

	 	@param {FrameState} state

	 	@param {Provider.Frame} frame
	 */
	next(con, state, frame){

		Frame.draw(con, state, frame);

		frame.index = frame.index + frame.playspeed;
		
		if( Math.floor(frame.index) +1 > frame.count ){
			if( frame.repeat ){
				frame.index = 0;
			} else {
				frame.index = frame.count - 1;
			}
		}
	},

	/**
		@param { FrameState } state 
	*/
	system( state ) {
				
		Object.keys(state.frames)
		.forEach(function(id){
			
			const frame = state.frames[id];
			if( id in state.canvas ){

				const canvas = state.canvas[id];
				const con = canvas.context;
	
				con.scale(frame.scale, frame.scale);
				Frame.next(con, state, frame);
			}
		});
	}
	
};

/** 
	@typedef {{ 
		mute: boolean 
		resources: {
			snd: { [k:string]: { element: HTMLAudioElement | null } }
		}
	}} SNDState
*/
const SND = {
	
	/** 
		@param {SNDState} state
		@param {HTMLAudioElement} audio 
	*/
	play(state, audio){
		if( !state.mute ){
			audio.play();
		}
	},
	
	/** @param {HTMLAudioElement} audio */
	pause(audio){
		audio.pause();
	},

	/** 
		@param {SNDState} state
		@param {HTMLAudioElement} audio 
		@param {number} x 
	*/
	volume(state, audio, x){
		if(!state.mute){
			audio.volume = x;
		}
	},

	/**
	 * @param {SNDState} state
	 * @param {boolean} x 
	 */
	setMute(state, x){
	
		state.mute = x;
		LocalStorage.set('provider.mute', String(state.mute));
		// eslint-disable-next-line no-undef
		Object.keys(state.resources.snd)
			.map(function(k){
				return state.resources.snd[k]
			})
			.filter( o => o.element != null )
			
			.forEach(function(o){
				if( state.mute ){
					// @ts-ignore
					o.element.volume = 0;
				} else {
					// typescript still things this is null :O
					// @ts-ignore
					o.element.volume = 1;
				}	
			});
	}
};

/**
	@typedef {
		{ keys: { DOWN: { [k:string]: number } } } & SNDState 
	} KeyState
*/

const Keys = {
	
	ARROW_RIGHT: 39,
	ARROW_DOWN: 40,
	ARROW_UP: 38,
	ARROW_LEFT: 37,
	SPACE: 32,
	F: 70,

	/**
	 *
	 * @param {KeyState} state 
	 */
	init(state){
		/**
		 * @param {KeyboardEvent} e
		 */
		// eslint-disable-next-line no-undef
		window.onkeyup = (e) => {
			if( e.keyCode == 77 /* M */){	
				SND.setMute(state, !state.mute);
			}
			delete state.keys.DOWN[e.keyCode];
		};

		/**
		 * @param {KeyboardEvent} e
		 */
		// eslint-disable-next-line no-undef
		window.onkeydown = e => {
			if( !(e.keyCode in state.keys.DOWN) ){
				state.keys.DOWN[e.keyCode] = Date.now();
			}

			if( e.keyCode > 31 && e.keyCode < 41 ){
				e.preventDefault();
			}
		};

	}
};

/**
	@typedef {{
		verbs: { [k:string]: Provider.Verb[] }
		frames: { [k:string]: Provider.Frame }
		characters: { [k:string]: Provider.Character }
	} & FrameState & SNDState } CharacterState
 */
const Character = {
	
	/**
		@param {{ 
			id:string 
			name: string
			position: string
		}} o

		@returns { Provider.Character }

	 */
	of(o){
		const { id, name, position } = o;
		return { 
			id
			, name
			, imageId: null 
			, position
			, speed: { x: 4, z: 4 }
			, action: 'idle'
			, alive: true
			, respawnId: null
		}
	},


	/**
	 * @param {CharacterState} state
	 * @param {string} id 
	 * @param {string} name 
	 * @param {Provider.Coord} coords 
	 */
	initSimpleCharacter(state, id, name, coords){
		state.verbs[id] = 
			[ Verb('idle', ['left']) ];
	
		
		state.frames[id] = Frame.of();
		state.frames[id].scale = 4;
	
		state.coords[id] = coords;
		
	
		state.characters[id] =
			Character.of({
				id,
				name,
				position: 'left'
			});
	},

	/**
	 * @param { CharacterState } state
	 * @param { Provider.Character } character
	 */
	initSprites( state, character ){

		const verbs = state.verbs[character.id];

		for( let verb of verbs ){
			for( let position of verb.positions ){

				if ( ! (position in verb.images) ){

					// eslint-disable-next-line no-undef
					const image = new Image();

					const src =
						'resources/img/characters/'
							+ character.name
							+ '/'+position
							+ '_'+verb.name+'.png';

					verb.images[position] = src;
					image.src = src;

					state.resources.img[src] = {
						element:image
						,src
					};
				}
			}
		}

	},

	/**
	 * @param { CharacterState } state
	 * @param {Provider.Character} o 
	 */
	update(state, o){
		
		const verbs = state.verbs[o.id];

		for( let verb of verbs ){
			if( 
				o.action == verb.name 
				&& verb.positions.indexOf(o.position) > -1 
			){
				if( !(o.imageId == verb.images[o.position]) ){
					o.imageId = verb.images[o.position];
					
					const frame = state.frames[o.id];

					// todo-james make family/villager fade if they are starving
					frame.alpha = 1;
					Frame.reset(
						state,
						state.frames[o.id], 
						verb.images[o.position]
					);
				}
				break
			}
		}
	},
	/**
	 * @param { CharacterState } state
	 */
	system(state){
		Object.keys(state.characters).forEach(function(k){
			const character = state.characters[k];
			Character.initSprites( state, character );
			Character.update( state, character );
		});
		
	}
};

/**
	@typedef {
		{

			deer: {
				[k:string]: Provider.Deer
			}

			hunter: {
				[k:string]: Provider.Hunter
			}
			
		} & CharacterState
	} DeerState

*/
const Deer = {

	/**
	 * 
	 * @param {string} id 
	 * @returns {Provider.Deer}
	 */
	of(id){
		return {
			spawnRadius: 5
			,id
			,respawnId: null
		}
	},

	/**
	 * @param {DeerState} state 
	 * @param {string} id 
	 */
	init(state, id){
		state.deer[id] = Deer.of(id);
		state.frames[id] = Frame.of();
		state.frames[id].scale = 4;
	
		state.coords[id] = { x: 60, y: 0, z: -100 };
		state.verbs[id] =
			[ Verb('idle', ['left', 'right'])
			, Verb('run', ['right', 'left'])
			, Verb('die', ['right', 'left'])
			];
			
		state.characters[id] =
			Character.of({
				id: id
				,name: 'deer'
				,position: 'left'
			});
	},
	

	/**
	 * @param {DeerState} state
	 * @param {Provider.Deer} deer 
	 * @param {Provider.Hunter} other 
	 */
	// todo pass in an id not an object for other
	canSee(state, deer, other){
		const [me, them] = 
			[ deer.id, other.id ]
				.map(
					id => ({
						c: state.characters[id]
						,p: state.coords[id]
					})
				);
		
		return (
			me.c.position == 'right' 
			&& me.p.x < them.p.x  
			&& them.p.x < me.p.x + 100
			&& me.p.z - 50 < them.p.z
			&& them.p.z < me.p.z + 50

			|| me.c.position == 'left'
			&& me.p.x > them.p.x
			&& them.p.x > me.p.x - 100
			&& me.p.z - 50 < them.p.z
			&& them.p.z < me.p.z + 50
		) 
	},


	/**
	 * @param {DeerState} state
	 * @param {Provider.Deer} deer 
	 * @param {Provider.Hunter} other 
	 */
	act(state, deer, other){
		const [me, them] = 
			[ deer.id, other.id ]
				.map(
					id => ({
						c: state.characters[id]
						,p: state.coords[id]
					})
				);
			
		if( !me.c.alive ){
			me.c.action = 'die';
			state.frames[me.c.id].repeat = false;
		} else if ( Deer.canSee(state, deer, other) ){
			me.c.action = 'run';
			me.c.position = me.c.position == 'left' ? 'right' : 'left';
		} else if (
			me.c.action == 'run'
			&& Util.distance(them.p, me.p) < 150
		) {
			me.p.x = me.p.x + ( 
				me.c.position == 'left' ? -1 : 1 
			) * me.c.speed.x;
		} else if ( me.c.action == 'run' ){
			me.c.position = 
				me.c.position == 'right' ? 'left' : 'right';
			
			me.c.action = 'idle';
		} else {
			me.c.action = 'idle';
		}
	},


	/**
	 * @param {DeerState} state
	 * @param {Provider.Deer} deer 
	 */
	respawn(state, deer){

		const [me] = 
			[ deer.id ]
				.map(
					id => ({
						c: state.characters[id]
						,p: state.coords[id]
					})
				);

		state.characters[deer.id];

		me.p.x = me.p.x + Util.random(deer.spawnRadius);
		me.p.z = Util.randomInt(200);
		me.c.alive = true;
		me.c.action = 'idle';
		me.c.position = 
			me.c.position == 'right' ? 'left' : 'right';
		state.frames[me.c.id].repeat = true;
		deer.spawnRadius = deer.spawnRadius + 10;
	},

	/**
	 * @param {DeerState} state
	 */
	system(state){
		
		Deer.act(state, state.deer[deer], state.hunter[hunter]);
		
		if( 
			state.characters[deer].alive == false 
			&& state.deer[deer].respawnId == null 
		) {

			state.deer[deer].respawnId = 
				// eslint-disable-next-line no-undef
				window.setTimeout( 
					() => {
						Deer.respawn(state, state.deer[deer]);
						state.deer[deer].respawnId = null;
					}
					, 2000 
				);
		}
	}

};


/**
	@typedef {
		{

			deer: {
				[k:string]: Provider.Deer
			}

			hunter: {
				[k:string]: Provider.Hunter
			}
			
		} & CharacterState & KeyState
	} HunterState

*/
const Hunter = {
	/**
	 * 
	 * @param {string} id 
	 * @returns {Provider.Hunter}
	 */
	of(id){
		return {
			day: 0
			,carrying: false
			,family: {
				status: 'healthy'
				,children: 2
				, adults: 2
				, starved:  0		
			}
			,id
			,status: 'peckish'
		}
	},

	/**
	 * 
	 * @param {HunterState} state 
	 * @param {string} id 
	 */
	init(state, id){
		state.verbs[id] = 
			[ Verb('idle', ['front', 'left', 'right', 'back'])
			, Verb('walk',['front'])
			, Verb('walk',['left'])
			, Verb('walk',['right'])
			, Verb('walk',['back'])
			, Verb('attack',['front','left','right','back'])
			, Verb('carry',['front','left','right','back'])
			];
	
		state.hunter[id] = Hunter.of(id);
	
		state.frames[id] = Frame.of();
		state.frames[id].scale = 4;
	
		state.coords[id] = { x: 100, y: 0, z: 40 };
	
		state.characters[id] =
			Character.of({
				id: id
				,name: 'hunter'
				,position: 'left'
			});
	},
	
	/**
	 * @type {Provider.HunterStatus[]}
	 */
	// @ts-ignore
	hunterStatuses: [ 'starving', 'hungry', 'peckish', 'healthy', 'dead' ],
	
	/**
	 * @type {Provider.FamilyStatus[]}
	 */
	// @ts-ignore
	familyStatuses: [ 'starving', 'hungry', 'peckish', 'healthy' ],

	/**
	 * @param {HunterState} state
	 * @param {Provider.Hunter} hunter 
	 * @param {Provider.Deer} deer 
	 */
	kill(state, hunter, deer){
		
		const [me, them] = 
			[ hunter.id, deer.id ]
				.map(
					id => ({
						c: state.characters[id]
						,p: state.coords[id]
					})
				);
		

		if( Util.distance(me.p, them.p) < 60 ){
			if( them.c.alive ){
				them.c.alive = false;
				hunter.carrying = true;
				if ( state.resources.snd.drum2.element != null ){
					state.resources.snd.drum2.element
						.currentTime = 1;
					SND.play(
						state,
						state.resources.snd.drum2.element
					);
				}
			} else {
				if( state.resources.snd.drum4.element != null ){
					state.resources.snd.drum4.element
						.currentTime = 1;
					
					SND.play(
						state,
						state.resources.snd.drum4.element
					);
				}
			}
		} else {
			if( state.resources.snd.drum3.element != null){

				state.resources.snd.drum3.element
					.currentTime = 1;

				SND.play(
					state,
					state.resources.snd.drum3.element
				);
			}

		}
	},

	/**
	 * @param {HunterState} state
	 * @param {Provider.Hunter} hunter 
	 */
	hunger(state, hunter){
		const { id, day, family } = hunter;


		const [me] = 
			[ id ]
				.map(
					id => ({
						c: state.characters[id]
						,p: state.coords[id]
					})
				);
		
		if( hunter.status == 'starving' ){
			if( me.c.alive ){
				me.c.alive = false;
				hunter.status = 'dead';
				// eslint-disable-next-line no-undef, no-console
				console.log( 
					'you lasted '+day+' days but you have starved...' 
				);
			}
		}


		hunter.status = 
			Hunter.hunterStatuses[
				Hunter.hunterStatuses.indexOf(hunter.status) - 1
			]
			|| 'dead';

		if( family.status == 'starving' ){
			if( family.adults > 0 ){
				family.adults --;
				family.starved ++;
			} else if (family.children > 0 ){
				family.children --;
				family.starved ++;
			}
		}

		family.status =
			Hunter.familyStatuses[
				Hunter.familyStatuses.indexOf(family.status) - 1
			] 
			|| family.status;
	},

	/**
	 * @param {HunterState} state
	 * @param {Provider.Hunter} hunter
	 */
	eat(state, hunter){
		
		const { status, family } = hunter;

		const statuses = Hunter.hunterStatuses;

		if( state.resources.snd.drum5.element != null ){
			SND.play(state, state.resources.snd.drum5.element);
		}

		// eslint-disable-next-line no-undef, no-console
		console.log('eat');

		hunter.status = 
			statuses[statuses.indexOf(status) + 1] || 'healthy';

		if( family.status == 'healthy' && family.adults > 0 ){
			family.children ++; 
		}
	},

	/**
	 * @param {HunterState} state
	 * @param {Provider.Hunter} hunter 
	 */
	feed(state, hunter){

		if( state.resources.snd.drum6.element != null ){
			SND.play(state, state.resources.snd.drum6.element);
		}

		hunter.family.status = 
			Hunter.familyStatuses
				[Hunter.hunterStatuses.indexOf(hunter.family.status) + 1] 
				|| 'healthy';

		if( hunter.family.status == 'healthy' && hunter.family.adults > 0 ){
			hunter.family.children ++; 
		}
	},

	/**
	 * @param {HunterState} state
	 * @param {Provider.Hunter} hunter
	 * @param {Provider.Deer} deer
	 */
	act(state, hunter, deer){
		
		const {
			id
			, status
			, carrying
		} = hunter;

		
		const [me] = 
			[ id ]
				.map(
					id => ({
						c: state.characters[id]
						,p: state.coords[id]
					})
				);
		
		const [newSpeed, newPlayspeed] =
			{ 'healthy': [5, 1/3 * 0.5]
			, 'peckish': [3, state.frames[me.c.id].playspeed]
			, 'hungry': [2.5, 1/4 * 0.5]
			, 'starving': [1.5,1/5 * 0.5]
			, 'dead': [0, 0]
			}[ status ] 
			|| [me.c.speed, state.frames[me.c.id].playspeed];

		me.c.speed = {x: newSpeed, z: newSpeed};
		state.frames[me.c.id].playspeed = newPlayspeed;
		
		if( carrying ){
			me.c.action = 'carry';
			if (state.keys.DOWN[Keys.ARROW_UP] ){
				me.c.position = "back";
				me.p.z = me.p.z-1*me.c.speed.z;
			} else if (state.keys.DOWN[Keys.ARROW_DOWN]) {
				me.c.position = "front";
				me.p.z= me.p.z + 1*me.c.speed.z;
			} else if ( state.keys.DOWN[Keys.ARROW_LEFT] ){
				me.c.position = "left";
				me.p.x= me.p.x-1*me.c.speed.x;
			} else if ( state.keys.DOWN[Keys.ARROW_RIGHT] ){
				me.c.position = "right";
				me.p.x= me.p.x + 1*me.c.speed.x;
			} else if (state.keys.DOWN[Keys.F]){

				me.c.action = "walk";
				hunter.carrying = false;
				if (Util.distance(me.p,{x:0,y:0,z:0})<75){
					Hunter.feed(state, hunter);
				} else {
					Hunter.eat(state, hunter);
				}
			}
		} else if ( state.keys.DOWN[Keys.SPACE] ){
			me.c.action = 'attack';
			Hunter.kill( state, hunter, deer );
		} else if ( state.keys.DOWN[Keys.ARROW_UP] ){
			me.c.action = 'walk';
			me.c.position = 'back';
			me.p.z = me.p.z - 1 * me.c.speed.z;
		} else if ( state.keys.DOWN[Keys.ARROW_DOWN] ){
			me.c.action = 'walk';
			me.c.position = 'front';
			me.p.z = me.p.z  +  1 * me.c.speed.z;
		} else if ( state.keys.DOWN[Keys.ARROW_LEFT] ){
			me.c.action = 'walk';
			me.c.position = 'left';
			me.p.x = me.p.x - 1 * me.c.speed.x;
		} else if ( state.keys.DOWN[Keys.ARROW_RIGHT] ){
			me.c.action = 'walk';
			me.c.position = 'right';
			me.p.x = me.p.x  +  1 * me.c.speed.x;
		} else {
			me.c.action = 'idle';
		}

		if (me.c.action == "walk"){
			if( state.resources.snd.walk.element != null ){
				SND.play(state, state.resources.snd.walk.element);
				if (state.resources.snd.walk.element.currentTime>4){
					state.resources.snd.walk.element.currentTime = 0;
				}
			}
		} else {
			if( state.resources.snd.walk.element != null ){
				state.resources.snd.walk.element.pause();  
			}
		}
	},

	/**
	 * @param {HunterState} state
	 */
	system(state){
		
		Object.keys( state.hunter )
		
			.reduce(function(p, me){

				return p.concat(
					Object.keys( state.deer ).map(
						you => ({ me, you })
					)
				)
			}, /** @type { {me:string, you:string}[] } */ ([]) )

			.forEach(function({ me, you }){
				Hunter.act(state, state.hunter[me], state.deer[you]);
			});			
	}
};

const Night = {

	of(){
		return {
			timeOfDay: 0,
			increment: 0.1
		}
	},

	/**
	 * 
	 * @param {Provider.State} state 
	 * @param {string} id 
	 */
	init(state, id){
		state.night[id] = Night.of();
	},

	/**
	 * @param {Provider.State} state 
	 */
	system(state){
		
		Object.keys( state.night ).forEach(function(id){

			Object.keys( state.hunter ).forEach(function(hunterId){

				const c = state.hunter[hunterId];
				state.night[id].timeOfDay = 
					state.night[id].timeOfDay + state.night[id].increment;

				if( state.night[id].timeOfDay > 1 ){
					state.night[id].increment = -0.0125;
				} else if ( 
					state.night[id].timeOfDay < 0 
					&& state.characters[c.id].alive 
				){
					state.night[id].increment = 0.0125;
					c.day = c.day + 1;
					Hunter.hunger(state, c);
		
					if(state.resources.snd.drum1.element != null){
						SND.play( state, state.resources.snd.drum1.element );
					}
		
					if( c.day % 10 == 0 && c.family.children > 0 ){
						c.family.adults = c.family.adults + 1;
						c.family.children = c.family.children - 1;
					}
				}
			});
		});
	}
};

/**
	@typedef {
		{
			loopingSounds: {
				[k:string]: string
			}
		} & SNDState
	} LoopingSoundsState
 */
const LoopingSounds = {

	/**
	* @param {LoopingSoundsState} state 
	*/

	system(state){
		Object.keys(state.loopingSounds).forEach(function(k){
			const sndId = state.loopingSounds[k];
			const sndResource = state.resources.snd[sndId];

			if( sndResource.element != null ){
				if(sndResource.element.currentTime == 0){
					SND.play(state, sndResource.element);
				}
	
				if( sndResource.element.currentTime > 8 ){
					sndResource.element.currentTime = 0;
				}
			}
			
		});
	}
};


/**
	@typedef {{
		spatialSounds: {
			[k:string]: Provider.SpatialSound
		}
		camera: Provider.Camera
	} & SNDState} SpatialSoundState
 */
const SpatialSounds = {

	/**
	 * 
	 * @param {string} id 
	 * @param {Provider.Coord} coords 
	 */
	of(id, coords){
		return {
			snd: id,
			coords
		}
	},

	/**
	 * 
	 * @param {SpatialSoundState} state 
	 */
	system(state){
		Object.keys(state.spatialSounds).forEach(function(k){
			const sndObj = state.spatialSounds[k];	
			const sndResource = state.resources.snd[sndObj.snd];
			const volume = 
				1-Math.min(1, Util.distance(sndObj.coords,state.camera) / 1000 );
			
			if( volume > 0 && volume < 1 ){
				if(sndResource.element != null){
					SND.volume(state, sndResource.element, volume);
				}
			}
		});
	}
};

const DPI = {

	/**
	 * @param {{ camera: Provider.Camera }} state 
	 */
	system(state){
		// eslint-disable-next-line no-undef
		if( window.innerWidth > 800 ){
			state.camera.scale = { x:2, y: 2 };
		} else {
			state.camera.scale = { x:1, y: 1 };
		}
	}
};

const Canvas = {
	/**

	 	@param {{
			 canvas: {
				 [k:string]: {
					 element: HTMLCanvasElement | null
					 context: CanvasRenderingContext2D
				 }
			 }
	 	}} state 
	 */
	system(state){
		Object.keys( state.canvas ).forEach(function(id){
			const canvas = state.canvas[id];

			if( canvas.element != null ){
				
				canvas.element.width = canvas.element.width;
				canvas.context.imageSmoothingEnabled = false;
			}
		});
	}
};


const Camera = {
	/**

	 	@param {{
			camera: Provider.Camera
			coords: {
				[k:string]: Provider.Coord
			}
		}} state 
	 */
	system(state){
		if( state.camera.target != null ){

			const target = state.coords[ state.camera.target ];
			
			if( Util.distance(state.camera, target) > 10 ){
				state.camera.x = 
					state.camera.x + (target.x - state.camera.x) * 0.05;
				state.camera.y = 
					state.camera.y + (target.y - state.camera.y) * 0.05;
				state.camera.z = 
					state.camera.z + (target.z - state.camera.z) * 0.05;
			}
		}
	}
};

const UI = {

	/**
	 	@param { Provider.State } state 
	 */
	system(state){
		const c = state.hunter[hunter];
	
		mithril.render(
			// eslint-disable-next-line no-undef
			document.body
			,mithril('div'
				,{
					style: {
						width: '100%',
						height: '100%',
						backgroundColor: '#EEEEB8',						
					//	overflow: 'hidden'
					}
				}
				,Object.keys(state.night).map(function(id){
					const night = state.night[id];

					return mithril('div'
						,{
							style: {
								width: '100vw',
								height: '100vh',
								top: '0px',
								left: '0px',
								position: 'absolute',
								mixinMode: 'screen',
								opacity: night.timeOfDay,
								backgroundColor: 
									'rgb(0,0,50)'
								
							}
						}
					)
				})
				,mithril('div'
					,{
						style: {
							width: '100%'
							,height: '100%'
							,transitionDuration: '1s'
							,transform:
								
								'scale3d('+[
									state.camera.scale.x
									, state.camera.scale.y
									, 1
								]+')'
						}
					}
					,mithril('div#camera-indicators'
						,{
							style: {
								position: 'absolute'
								,transformStyle: 'preserve-3d'
								,transform: [
									'translateY(50px)'

									,'translate('+[
										'calc( 100vw / 2 - 50%)'
										,'calc( 100vh / 2 - 50%)'
									]+')'
									
									,'perspective(512px)'
									,'rotateX(-15deg)'
									,'translate3d('+[
										-state.camera.x+'px'
										,-state.camera.y+'px'
										,(-state.camera.z)+'px'
									]+')'
								]
								.join(' ')
							}
							
						}
						,mithril('div#ground', {
							style: {
								position: 'absolute'
								, width: '400px'
								, height: '400px'
								, imageRendering: 'crisp-edges'
								// eslint-disable-next-line max-len
								, backgroundImage: 'url(https://cdna.artstation.com/p/assets/images/images/006/295/124/large/sergiu-matei-grass-tile-pixel-art-rpg-top-view-indie-game-dev-matei-sergiu.jpg)'
								, backgroundRepeat: 'repeat'
								, backgroundSize: '25px 25px'
								, opacity: 1
								// , filter: 'brightness(0.5)'
								// , borderRadius: '100%'
								, transform: [
									''
									,'translate(-50%, -50%)'
									,'rotateX(90deg)'
									,'rotateZ(45deg)'
									,'scale(-1, -1)'
									,'scale(8, 8)'	
								]
								.join(' ')
							}
						})
						,mithril('div#mountain', {
							style: {
								position: 'absolute'
								, width: '800px'
								, height: '600px'
								, imageRendering: 'pixelated'
								// eslint-disable-next-line max-len
								, backgroundImage: 'url(https://static3.scirra.net/images/newstore/products/3053/ss1.png)'
								, transform: [
									'translateZ(-10000px)',
									'translateY(-600px)',
									'rotateZ(180deg)',
									'scale(-1, -1)',
									'scale(32, 32)'	
								]
								.join(' ')
							}
						})
					)
					,mithril('div#camera-game'
						,{
							style: {
								position: 'absolute'
								,transformStyle: 'preserve-3d'
								,transform: [
									'translateY(50px)'
									,'translate('+[
										'calc( 100vw / 2 - 50%)'
										,'calc( 100vh / 2 - 50%)'
									]+')'
									
									,'perspective(512px)'
									,'rotateX(-15deg)'
									,'translate3d('+[
										-state.camera.x+'px'
										,-(state.camera.y)+'px'
										,(-state.camera.z)+'px'
									]+')'
								]
								.join(' ')
							}
							
						}
						,mithril('div#feedRadius', {
							style: {
								position: 'absolute'
								, width: '300px'
								, height: '300px'
								, borderRadius: '100%'
								, opacity: '0.8'
								, border: 'solid 5px pink'
								// , transformOrigin: 'top left'
								, transform: [
									''
									,'rotateX(-90deg)'
									,'translate3d(-150px, 0px, -150px)'
									// ,'translate3d(-50%, -50%, 0px)'
								]
								.join(' ')
							}
						})
						,Object.keys(state.frames).map(function(id){
							
							const frame = state.frames[id];
							const coords = state.coords[id];

							// @ts-ignore
							return mithril('canvas', {
								id,
								key: id,
								style: {
									top: '0px',
									left: '0px',
									position: 'absolute',
									opacity: frame.alpha,
									border: 'solid 1px violet',
									transform: [
										'translate(-50%, -100%)'
										,'translate3d('+[
											coords.x+'px',
											coords.y +'px',
											coords.z+'px'
										]+')'
										
									].join(' ')
								},
								width: frame.width * frame.scale,
								height: frame.width * frame.scale,
								/**
								 * @param {{ dom: HTMLCanvasElement }} vnode 
								 */
								onupdate(vnode){
									
									const el = vnode.dom;

									const con =
										el.getContext('2d');

									if( el != null && con != null){
										state.canvas[id] = {
											element: el,
											context: con
										};
									}
								},

								onremove(){
									if( id in state.canvas ){
										delete state.canvas[id];
									}
								}
							})
						})
					)
				)
				,mithril('.absolute.description'
					,{ style:
						{ margin: '10px'
						, top: '0px'
						, left: '0px'
						, padding: '10px'
						}
					}
					,mithril('h1', 'Provider')
					,mithril('p#dayDisplay', 'Day: '+c.day || 1)
				)
				,mithril('#game.absolute'
					,{ style:
						{ margin: '10px'
						, bottom: '0px'
						, left: '0px'
						}
					}
					,mithril('#info'
						,{ style:
							{ padding: '10px' 
							}
						}
						,mithril('p#familyDisplay'
							, 'Your village is '+c.family.status
						)
						,mithril('p#youDisplay'
							, 'You are '+c.status
						)
						,mithril('p#gameDisplay'
							,'You have '
								+ c.family.adults+ ' elders and '
								+ c.family.children
								+ ' children.  '+c.family.starved
								+ ' of your village have starved.'
						)
						,mithril('br')
						,mithril('p#adviceDisplay'
							, c.carrying
							? Util.distance( 
								state.coords[c.id], {x:0,y:0,z:0}
							) > 75
								? 'Eat: (F)'
								: 'Feed Village: (F)'
							: 'Swing: (Spacebar), Hunt: (Arrow Keys)'
						)
					)
				)
				,mithril('.description.absolute'
					,{ style:
						{ margin: '10px'
						, top: '0px'
						, right: '0px'
						, padding: '10px'
						}
					}
					,mithril('p', 'Code and Art by',mithril('h4', mithril('b', 'James Forbes')))
				)
			)
		);
	}
};


const Villager = {
	/**
	 	@param {HunterState} state 
	 */
	system(state){
		const c = state.hunter[hunter];
	
		{
			const exists = 'v2' in state.characters;
			const shouldExist = c.family.children + c.family.adults > 0; 

			if( shouldExist && !exists ){
				Character.initSimpleCharacter(
					state, 'v2', 'villager', { x: -30, y: 0, z: -20 } 
				);
			} else if(!shouldExist && exists) {
				Object.keys(state).forEach(function(component){
					// @ts-ignore
					// eslint-disable-next-line fp/no-mutation
					delete state[component].v2;
				});
			}
		}

		{
			const exists = 'v' in state.characters;
			const shouldExist = c.family.children+c.family.adults > 4;

			if( shouldExist && !exists ){
				Character.initSimpleCharacter(
					state, 'v', 'villager', { x: 0, y: 0, z: -40 } 
				);
			} else if(!shouldExist && exists) {
				Object.keys(state).forEach(function(component){
					// @ts-ignore
					// eslint-disable-next-line fp/no-mutation
					delete state[component].v;
				});
			}
		}
	
		{
			const exists = 'v3' in state.characters;
			const shouldExist = c.family.children+c.family.adults > 8;

			if( shouldExist && !exists ){
				Character.initSimpleCharacter(
					state, 'v3', 'villager', { x: 30, y: 0, z: -20 } 
				);
			} else if(!shouldExist && exists) {
				Object.keys(state).forEach(function(component){
					// @ts-ignore
					// eslint-disable-next-line fp/no-mutation
					delete state[component].v3;
				});
			}
		}
	}
};

const Game = {

	paused: false,
	
	restartID: 0,
	/**
	 * 
	 * @param {Provider.State} state 
	 */	
	init(state){

		// @ts-ignore
		// eslint-disable-next-line no-undef
		window.state = state;

		// eslint-disable-next-line no-undef
		requestAnimationFrame( () => Game.system(state) );

		// eslint-disable-next-line no-undef
		setInterval( () => Night.system(state), 62.5 );

		Keys.init(state);
		Night.init(state, night);


		Deer.init(state, deer);
		Hunter.init(state, hunter);

		Character.initSimpleCharacter(
			state, 
			'f', 
			'fire', 
			{ x:0, y:20, z:0 }
		);
		
		
		state.camera.x = 0;//state.coords[hunter].x 
			// + Util.even() * Util.random() * 10000
		state.camera.y = -1000;
			// + 50 + Util.random() * 10000
		state.camera.z = 3000;//state.coords[hunter].z
			// + Util.even() * Util.random() * 10000

		Game.initAudioResources(state);
		state.spatialSounds.fire = {
			snd: 'fire'
			,coords: state.coords.f
		};
			
		state.loopingSounds.fire = 'fire';

		UI.system(state);
	},


	/**
	 * @param {Provider.State} state 
	 */
	initAudioResources(state){

		SND.setMute(state, state.mute);
		
		Object.keys(state.resources.snd)
			.forEach(function(id){
				const o = state.resources.snd[id];

				// eslint-disable-next-line no-undef
				o.element = new Audio();
				o.element.src = o.src;
			});
	},

	/**
	 * @param {Provider.State} state 
	 */
	system(state){

		// eslint-disable-next-line no-undef
		if ( state.resources.snd.fire.element != null ){
			SND.play( state, state.resources.snd.fire.element );
		}

		const c = state.hunter[hunter];
		state.camera.target = c.id;

		if( !Game.paused ){
			Camera.system(state);
			Canvas.system(state);
			DPI.system(state);
			Villager.system(state);
			Deer.system(state);
			Hunter.system(state);
			Character.system(state);
			Frame.system(state);
			LoopingSounds.system(state);
			SpatialSounds.system(state);
			Game.status(state);
		}
		
		UI.system(state);

		// eslint-disable-next-line no-undef
		requestAnimationFrame( () => Game.system(state) );
	},

	/**
	 * @param {Provider.State} state 
	 */
	status(state){
		const c = state.hunter[hunter];
		if( !state.characters[c.id].alive ){
	
			//eslint-disable-next-line no-undef
			Game.paused = true;

			if( state.resources.snd.fire.element != null ){
				SND.pause( state.resources.snd.fire.element );
			}
			if( state.resources.snd.walk.element != null ){
				SND.pause( state.resources.snd.walk.element );
			}
			
			//eslint-disable-next-line no-undef
			Game.restartID = window.setTimeout(() => Game.restart(state),8000);
		}
	},

	/**
	 * @param {Provider.State} state 
	 */
	restart(state){
		const c = state.hunter[hunter];
		const d = state.deer[deer];

		c.day = 1;
		c.carrying = false;
		c.family = {
			status: 'healthy'
			,children: 2
			,adults: 2
			,starved: 0
		};
		c.status = 'peckish';

		state.coords[hunter].x = 100 * Util.random() * Util.even();
		state.coords[hunter].z = 40 * Util.random() * Util.even();
		state.coords[deer].x = -60;
		state.coords[deer].z = -100;

		state.camera.x = state.coords[hunter].x;
		state.camera.z = state.coords[hunter].z - 10000;

		d.spawnRadius = 5;
		state.characters[c.id].alive = true;
		// eslint-disable-next-line no-undef
		Game.paused = false;
		// eslint-disable-next-line no-undef
	}
};

Game.init({
	keys: {
		DOWN: {}
	}
	,mute: LocalStorage.get('provider.mute') == 'true'
	,resources: {
		snd: {
			fire: { src: 'resources/snd/fire.wav', element: null }
			,walk: { src: 'resources/snd/walk.wav', element: null }
			,drum1: { src: 'resources/snd/drum1.wav', element: null }
			,drum2: { src: 'resources/snd/drum2.wav', element: null }
			,drum3: { src: 'resources/snd/drum3.wav', element: null }
			,drum4: { src: 'resources/snd/drum4.wav', element: null }
			,drum5: { src: 'resources/snd/drum5.wav', element: null }
			,drum6: { src: 'resources/snd/drum6.wav', element: null }
		}
		,img: {}
	}
	,coords: {}
	,verbs: {}
	,characters: {}
	,frames: {}
	,camera: { 
		x: 0
		, y: 0
		, z: 0
		, scale: { x: 1, y: 1 }
		, target: null
	}
	,night: {}
	,hunter: {}
	,deer: {}
	,spatialSounds:{}
	,loopingSounds: {}
	,canvas: {}

});
