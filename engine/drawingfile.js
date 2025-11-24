/*
 * (c) Copyright Ascensio System SIA 2010-2023
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-6 Ernesta Birznieka-Upish
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */

(function(window, undefined) {

	function getMemoryPathIE(name)
	{
		if (self["AscViewer"] && self["AscViewer"]["baseUrl"])
			return self["AscViewer"]["baseUrl"] + name;
		return name;
	}

	var baseFontsPath = "../../../../fonts/";

	var FS = undefined;

	// correct fetch for desktop application

var printErr = undefined;
var print    = undefined;

var fetch = ("undefined" !== typeof window) ? window.fetch : (("undefined" !== typeof self) ? self.fetch : null);
var getBinaryPromise = null;

function internal_isLocal()
{
	if (window.navigator && window.navigator.userAgent.toLowerCase().indexOf("ascdesktopeditor") < 0)
		return false;
	if (window.location && window.location.protocol == "file:")
		return true;
	if (window.document && window.document.currentScript && 0 == window.document.currentScript.src.indexOf("file:///"))
		return true;
	return false;
}

if (internal_isLocal())
{
	fetch = undefined; // fetch not support file:/// scheme
	getBinaryPromise = function()
	{
		var wasmPath = "ascdesktop://fonts/" + wasmBinaryFile.substr(8);
		return new Promise(function (resolve, reject)
		{
			var xhr = new XMLHttpRequest();
			xhr.open('GET', wasmPath, true);
			xhr.responseType = 'arraybuffer';

			if (xhr.overrideMimeType)
				xhr.overrideMimeType('text/plain; charset=x-user-defined');
			else
				xhr.setRequestHeader('Accept-Charset', 'x-user-defined');

			xhr.onload = function ()
			{
				if (this.status == 200)
					resolve(new Uint8Array(this.response));
			};
			xhr.send(null);
		});
	}
}
else
{
	getBinaryPromise = function() { return getBinaryPromise2.apply(undefined, arguments); }
}


	//polyfill

	(function(){

	if (undefined !== String.prototype.fromUtf8 &&
		undefined !== String.prototype.toUtf8)
		return;

	var STRING_UTF8_BUFFER_LENGTH = 1024;
	var STRING_UTF8_BUFFER = new ArrayBuffer(STRING_UTF8_BUFFER_LENGTH);

	/**
	 * Read string from utf8
	 * @param {Uint8Array} buffer
	 * @param {number} [start=0]
	 * @param {number} [len]
	 * @returns {string}
	 */
	String.prototype.fromUtf8 = function(buffer, start, len) {
		if (undefined === start)
			start = 0;
		if (undefined === len)
			len = buffer.length - start;

		var result = "";
		var index  = start;
		var end = start + len;
		while (index < end)
		{
			var u0 = buffer[index++];
			if (!(u0 & 128))
			{
				result += String.fromCharCode(u0);
				continue;
			}
			var u1 = buffer[index++] & 63;
			if ((u0 & 224) == 192)
			{
				result += String.fromCharCode((u0 & 31) << 6 | u1);
				continue;
			}
			var u2 = buffer[index++] & 63;
			if ((u0 & 240) == 224)
				u0 = (u0 & 15) << 12 | u1 << 6 | u2;
			else
				u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | buffer[index++] & 63;
			if (u0 < 65536)
				result += String.fromCharCode(u0);
			else
			{
				var ch = u0 - 65536;
				result += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
			}
		}
		return result;
	};

	/**
	 * Convert string to utf8 array
	 * @returns {Uint8Array}
	 */
	String.prototype.toUtf8 = function(isNoEndNull, isUseBuffer) {
		var inputLen = this.length;
		var testLen  = 6 * inputLen + 1;
		var tmpStrings = (isUseBuffer && testLen < STRING_UTF8_BUFFER_LENGTH) ? STRING_UTF8_BUFFER : new ArrayBuffer(testLen);

		var code  = 0;
		var index = 0;

		var outputIndex = 0;
		var outputDataTmp = new Uint8Array(tmpStrings);
		var outputData = outputDataTmp;

		while (index < inputLen)
		{
			code = this.charCodeAt(index++);
			if (code >= 0xD800 && code <= 0xDFFF && index < inputLen)
				code = 0x10000 + (((code & 0x3FF) << 10) | (0x03FF & this.charCodeAt(index++)));

			if (code < 0x80)
				outputData[outputIndex++] = code;
			else if (code < 0x0800)
			{
				outputData[outputIndex++] = 0xC0 | (code >> 6);
				outputData[outputIndex++] = 0x80 | (code & 0x3F);
			}
			else if (code < 0x10000)
			{
				outputData[outputIndex++] = 0xE0 | (code >> 12);
				outputData[outputIndex++] = 0x80 | ((code >> 6) & 0x3F);
				outputData[outputIndex++] = 0x80 | (code & 0x3F);
			}
			else if (code < 0x1FFFFF)
			{
				outputData[outputIndex++] = 0xF0 | (code >> 18);
				outputData[outputIndex++] = 0x80 | ((code >> 12) & 0x3F);
				outputData[outputIndex++] = 0x80 | ((code >> 6) & 0x3F);
				outputData[outputIndex++] = 0x80 | (code & 0x3F);
			}
			else if (code < 0x3FFFFFF)
			{
				outputData[outputIndex++] = 0xF8 | (code >> 24);
				outputData[outputIndex++] = 0x80 | ((code >> 18) & 0x3F);
				outputData[outputIndex++] = 0x80 | ((code >> 12) & 0x3F);
				outputData[outputIndex++] = 0x80 | ((code >> 6) & 0x3F);
				outputData[outputIndex++] = 0x80 | (code & 0x3F);
			}
			else if (code < 0x7FFFFFFF)
			{
				outputData[outputIndex++] = 0xFC | (code >> 30);
				outputData[outputIndex++] = 0x80 | ((code >> 24) & 0x3F);
				outputData[outputIndex++] = 0x80 | ((code >> 18) & 0x3F);
				outputData[outputIndex++] = 0x80 | ((code >> 12) & 0x3F);
				outputData[outputIndex++] = 0x80 | ((code >> 6) & 0x3F);
				outputData[outputIndex++] = 0x80 | (code & 0x3F);
			}
		}

		if (isNoEndNull !== true)
			outputData[outputIndex++] = 0;

		return new Uint8Array(tmpStrings, 0, outputIndex);
	};

	function StringPointer(pointer, len)
	{
		this.ptr = pointer;
		this.length = len;
	}
	StringPointer.prototype.free = function()
	{
		if (0 !== this.ptr)
			Module["_free"](this.ptr);
	};

	String.prototype.toUtf8Pointer = function(isNoEndNull) {
		var tmp = this.toUtf8(isNoEndNull, true);
		var pointer = Module["_malloc"](tmp.length);
		if (0 == pointer)
			return null;

		Module["HEAP8"].set(tmp, pointer);
		return new StringPointer(pointer, tmp.length);		
	};

})();


	// include: shell.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module != 'undefined' ? Module : {};

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)


// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];
var thisProgram = './this.program';
var quit_ = (status, toThrow) => {
  throw toThrow;
};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

var ENVIRONMENT_IS_WEB = true;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;

if (Module['ENVIRONMENT']) {
  throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)');
}

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var read_,
    readAsync,
    readBinary;

if (ENVIRONMENT_IS_SHELL) {

  if ((typeof process == 'object' && typeof require === 'function') || typeof window == 'object' || typeof importScripts == 'function') throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  if (typeof read != 'undefined') {
    read_ = read;
  }

  readBinary = (f) => {
    if (typeof readbuffer == 'function') {
      return new Uint8Array(readbuffer(f));
    }
    let data = read(f, 'binary');
    assert(typeof data == 'object');
    return data;
  };

  readAsync = (f, onload, onerror) => {
    setTimeout(() => onload(readBinary(f)));
  };

  if (typeof clearTimeout == 'undefined') {
    globalThis.clearTimeout = (id) => {};
  }

  if (typeof setTimeout == 'undefined') {
    // spidermonkey lacks setTimeout but we use it above in readAsync.
    globalThis.setTimeout = (f) => (typeof f == 'function') ? f() : abort();
  }

  if (typeof scriptArgs != 'undefined') {
    arguments_ = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    arguments_ = arguments;
  }

  if (typeof quit == 'function') {
    quit_ = (status, toThrow) => {
      // Unlike node which has process.exitCode, d8 has no such mechanism. So we
      // have no way to set the exit code and then let the program exit with
      // that code when it naturally stops running (say, when all setTimeouts
      // have completed). For that reason, we must call `quit` - the only way to
      // set the exit code - but quit also halts immediately.  To increase
      // consistency with node (and the web) we schedule the actual quit call
      // using a setTimeout to give the current stack and any exception handlers
      // a chance to run.  This enables features such as addOnPostRun (which
      // expected to be able to run code after main returns).
      setTimeout(() => {
        if (!(toThrow instanceof ExitStatus)) {
          let toLog = toThrow;
          if (toThrow && typeof toThrow == 'object' && toThrow.stack) {
            toLog = [toThrow, toThrow.stack];
          }
          err(`exiting due to exception: ${toLog}`);
        }
        quit(status);
      });
      throw toThrow;
    };
  }

  if (typeof print != 'undefined') {
    // Prefer to use print/printErr where they exist, as they usually work better.
    if (typeof console == 'undefined') console = /** @type{!Console} */({});
    console.log = /** @type{!function(this:Console, ...*): undefined} */ (print);
    console.warn = console.error = /** @type{!function(this:Console, ...*): undefined} */ (typeof printErr != 'undefined' ? printErr : print);
  }

} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) { // Check worker, not web, since window could be polyfilled
    scriptDirectory = self.location.href;
  } else if (typeof document != 'undefined' && document.currentScript) { // web
    scriptDirectory = document.currentScript.src;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
  // and scriptDirectory will correctly be replaced with an empty string.
  // If scriptDirectory contains a query (starting with ?) or a fragment (starting with #),
  // they are removed because they could contain a slash.
  if (scriptDirectory.indexOf('blob:') !== 0) {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf('/')+1);
  } else {
    scriptDirectory = '';
  }

  if (!(typeof window == 'object' || typeof importScripts == 'function')) throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  // Differentiate the Web Worker from the Node Worker case, as reading must
  // be done differently.
  {
// include: web_or_worker_shell_read.js
read_ = (url) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  }

  if (ENVIRONMENT_IS_WORKER) {
    readBinary = (url) => {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.responseType = 'arraybuffer';
      xhr.send(null);
      return new Uint8Array(/** @type{!ArrayBuffer} */(xhr.response));
    };
  }

  readAsync = (url, onload, onerror) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        onload(xhr.response);
        return;
      }
      onerror();
    };
    xhr.onerror = onerror;
    xhr.send(null);
  }

// end include: web_or_worker_shell_read.js
  }
} else
{
  throw new Error('environment detection error');
}

var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.error.bind(console);

// Merge back in the overrides
Object.assign(Module, moduleOverrides);
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = null;
checkIncomingModuleAPI();

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.

if (Module['arguments']) arguments_ = Module['arguments'];legacyModuleProp('arguments', 'arguments_');

if (Module['thisProgram']) thisProgram = Module['thisProgram'];legacyModuleProp('thisProgram', 'thisProgram');

if (Module['quit']) quit_ = Module['quit'];legacyModuleProp('quit', 'quit_');

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
// Assertions on removed incoming Module JS APIs.
assert(typeof Module['memoryInitializerPrefixURL'] == 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['pthreadMainPrefixURL'] == 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['cdInitializerPrefixURL'] == 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['filePackagePrefixURL'] == 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['read'] == 'undefined', 'Module.read option was removed (modify read_ in JS)');
assert(typeof Module['readAsync'] == 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
assert(typeof Module['readBinary'] == 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
assert(typeof Module['setWindowTitle'] == 'undefined', 'Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)');
assert(typeof Module['TOTAL_MEMORY'] == 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');
legacyModuleProp('asm', 'wasmExports');
legacyModuleProp('read', 'read_');
legacyModuleProp('readAsync', 'readAsync');
legacyModuleProp('readBinary', 'readBinary');
legacyModuleProp('setWindowTitle', 'setWindowTitle');
var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var FETCHFS = 'FETCHFS is no longer included by default; build with -lfetchfs.js';
var ICASEFS = 'ICASEFS is no longer included by default; build with -licasefs.js';
var JSFILEFS = 'JSFILEFS is no longer included by default; build with -ljsfilefs.js';
var OPFS = 'OPFS is no longer included by default; build with -lopfs.js';

var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';

assert(!ENVIRONMENT_IS_WORKER, "worker environment detected but not enabled at build time.  Add 'worker' to `-sENVIRONMENT` to enable.");

assert(!ENVIRONMENT_IS_NODE, "node environment detected but not enabled at build time.  Add 'node' to `-sENVIRONMENT` to enable.");

assert(!ENVIRONMENT_IS_SHELL, "shell environment detected but not enabled at build time.  Add 'shell' to `-sENVIRONMENT` to enable.");


// end include: shell.js
// include: preamble.js
// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary; 
if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];legacyModuleProp('wasmBinary', 'wasmBinary');

if (typeof WebAssembly != 'object') {
  abort('no native wasm support detected');
}

// Wasm globals

var wasmMemory;

//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

// In STRICT mode, we only define assert() when ASSERTIONS is set.  i.e. we
// don't define it at all in release modes.  This matches the behaviour of
// MINIMAL_RUNTIME.
// TODO(sbc): Make this the default even without STRICT enabled.
/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed' + (text ? ': ' + text : ''));
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.

// Memory management

var HEAP,
/** @type {!Int8Array} */
  HEAP8,
/** @type {!Uint8Array} */
  HEAPU8,
/** @type {!Int16Array} */
  HEAP16,
/** @type {!Uint16Array} */
  HEAPU16,
/** @type {!Int32Array} */
  HEAP32,
/** @type {!Uint32Array} */
  HEAPU32,
/** @type {!Float32Array} */
  HEAPF32,
/** @type {!Float64Array} */
  HEAPF64;

function updateMemoryViews() {
  var b = wasmMemory.buffer;
  Module['HEAP8'] = HEAP8 = new Int8Array(b);
  Module['HEAP16'] = HEAP16 = new Int16Array(b);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(b);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(b);
  Module['HEAP32'] = HEAP32 = new Int32Array(b);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(b);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(b);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(b);
}

assert(!Module['STACK_SIZE'], 'STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time')

assert(typeof Int32Array != 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined,
       'JS engine does not provide full typed array support');

// If memory is defined in wasm, the user can't provide it, or set INITIAL_MEMORY
assert(!Module['wasmMemory'], 'Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally');
assert(!Module['INITIAL_MEMORY'], 'Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically');

// include: runtime_stack_check.js
// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // If the stack ends at address zero we write our cookies 4 bytes into the
  // stack.  This prevents interference with SAFE_HEAP and ASAN which also
  // monitor writes to address zero.
  if (max == 0) {
    max += 4;
  }
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  HEAPU32[((max)>>2)] = 0x02135467;
  HEAPU32[(((max)+(4))>>2)] = 0x89BACDFE;
  // Also test the global address 0 for integrity.
  HEAPU32[((0)>>2)] = 1668509029;
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  // See writeStackCookie().
  if (max == 0) {
    max += 4;
  }
  var cookie1 = HEAPU32[((max)>>2)];
  var cookie2 = HEAPU32[(((max)+(4))>>2)];
  if (cookie1 != 0x02135467 || cookie2 != 0x89BACDFE) {
    abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${ptrToString(cookie2)} ${ptrToString(cookie1)}`);
  }
  // Also test the global address 0 for integrity.
  if (HEAPU32[((0)>>2)] != 0x63736d65 /* 'emsc' */) {
    abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
  }
}
// end include: runtime_stack_check.js
// include: runtime_assertions.js
// Endianness check
(function() {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 0x6373;
  if (h8[0] !== 0x73 || h8[1] !== 0x63) throw 'Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)';
})();

// end include: runtime_assertions.js
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__=[function(){window["AscViewer"] && window["AscViewer"]["onLoadModule"] && window["AscViewer"]["onLoadModule"]();}]; // functions called after the main() is called

var runtimeInitialized = false;

function preRun() {
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;

  checkStackCookie();

  
  callRuntimeCallbacks(__ATINIT__);
}

function postRun() {
  checkStackCookie();

  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnExit(cb) {
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

// include: runtime_math.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc

assert(Math.imul, 'This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.fround, 'This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.clz32, 'This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.trunc, 'This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
// end include: runtime_math.js
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
}

function addRunDependency(id) {
  runDependencies++;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval != 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(() => {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err('still waiting on run dependencies:');
          }
          err(`dependency: ${dep}`);
        }
        if (shown) {
          err('(end of list)');
        }
      }, 10000);
    }
  } else {
    err('warning: run dependency added without ID');
  }
}

function removeRunDependency(id) {
  runDependencies--;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

/** @param {string|number=} what */
function abort(what) {
  if (Module['onAbort']) {
    Module['onAbort'](what);
  }

  what = 'Aborted(' + what + ')';
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);

  ABORT = true;
  EXITSTATUS = 1;

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.

  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // defintion for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */
  var e = new WebAssembly.RuntimeError(what);

  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

// include: memoryprofiler.js
// end include: memoryprofiler.js
// show errors on likely calls to FS when it was not included
var FS = {
  error() {
    abort('Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with -sFORCE_FILESYSTEM');
  },
  init() { FS.error() },
  createDataFile() { FS.error() },
  createPreloadedFile() { FS.error() },
  createLazyFile() { FS.error() },
  open() { FS.error() },
  mkdev() { FS.error() },
  registerDevice() { FS.error() },
  analyzePath() { FS.error() },

  ErrnoError() { FS.error() },
};
Module['FS_createDataFile'] = FS.createDataFile;
Module['FS_createPreloadedFile'] = FS.createPreloadedFile;

// include: URIUtils.js
// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

/**
 * Indicates whether filename is a base64 data URI.
 * @noinline
 */
var isDataURI = (filename) => filename.startsWith(dataURIPrefix);

/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */
var isFileURI = (filename) => filename.startsWith('file://');
// end include: URIUtils.js
function createExportWrapper(name) {
  return function() {
    assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
    var f = wasmExports[name];
    assert(f, `exported native function \`${name}\` not found`);
    return f.apply(null, arguments);
  };
}

// include: runtime_exceptions.js
// Base Emscripten EH error class
class EmscriptenEH extends Error {}

class EmscriptenSjLj extends EmscriptenEH {}

class CppException extends EmscriptenEH {
  constructor(excPtr) {
    super(excPtr);
    this.excPtr = excPtr;
    const excInfo = getExceptionMessage(excPtr);
    this.name = excInfo[0];
    this.message = excInfo[1];
  }
}
// end include: runtime_exceptions.js
var wasmBinaryFile;
  wasmBinaryFile = 'drawingfile.wasm';
  if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile);
  }

function getBinarySync(file) {
  if (file == wasmBinaryFile && wasmBinary) {
    return new Uint8Array(wasmBinary);
  }
  if (readBinary) {
    return readBinary(file);
  }
  throw "both async and sync fetching of the wasm failed";
}

function getBinaryPromise2(binaryFile) {
  // If we don't have the binary yet, try to load it asynchronously.
  // Fetch has some additional restrictions over XHR, like it can't be used on a file:// url.
  // See https://github.com/github/fetch/pull/92#issuecomment-140665932
  // Cordova or Electron apps are typically loaded from a file:// url.
  // So use fetch if it is available and the url is not a file, otherwise fall back to XHR.
  if (!wasmBinary
      && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
    if (typeof fetch == 'function'
    ) {
      return fetch(binaryFile, { credentials: 'same-origin' }).then((response) => {
        if (!response['ok']) {
          throw "failed to load wasm binary file at '" + binaryFile + "'";
        }
        return response['arrayBuffer']();
      }).catch(() => getBinarySync(binaryFile));
    }
  }

  // Otherwise, getBinarySync should be able to get it synchronously
  return Promise.resolve().then(() => getBinarySync(binaryFile));
}

function instantiateArrayBuffer(binaryFile, imports, receiver) {
  return getBinaryPromise(binaryFile).then((binary) => {
    return WebAssembly.instantiate(binary, imports);
  }).then((instance) => {
    return instance;
  }).then(receiver, (reason) => {
    err(`failed to asynchronously prepare wasm: ${reason}`);

    // Warn on some common problems.
    if (isFileURI(wasmBinaryFile)) {
      err(`warning: Loading from a file URI (${wasmBinaryFile}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`);
    }
    abort(reason);
  });
}

function instantiateAsync(binary, binaryFile, imports, callback) {
  if (!binary &&
      typeof WebAssembly.instantiateStreaming == 'function' &&
      !isDataURI(binaryFile) &&
      typeof fetch == 'function') {
    return fetch(binaryFile, { credentials: 'same-origin' }).then((response) => {
      // Suppress closure warning here since the upstream definition for
      // instantiateStreaming only allows Promise<Repsponse> rather than
      // an actual Response.
      // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure is fixed.
      /** @suppress {checkTypes} */
      var result = WebAssembly.instantiateStreaming(response, imports);

      return result.then(
        callback,
        function(reason) {
          // We expect the most common failure cause to be a bad MIME type for the binary,
          // in which case falling back to ArrayBuffer instantiation should work.
          err(`wasm streaming compile failed: ${reason}`);
          err('falling back to ArrayBuffer instantiation');
          return instantiateArrayBuffer(binaryFile, imports, callback);
        });
    });
  }
  return instantiateArrayBuffer(binaryFile, imports, callback);
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm() {
  // prepare imports
  var info = {
    'env': wasmImports,
    'wasi_snapshot_preview1': wasmImports,
  };
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    wasmExports = instance.exports;

    

    wasmMemory = wasmExports['memory'];
    
    assert(wasmMemory, "memory not found in wasm exports");
    // This assertion doesn't hold when emscripten is run in --post-link
    // mode.
    // TODO(sbc): Read INITIAL_MEMORY out of the wasm file in post-link mode.
    //assert(wasmMemory.buffer.byteLength === 16777216);
    updateMemoryViews();

    wasmTable = wasmExports['__indirect_function_table'];
    
    assert(wasmTable, "table not found in wasm exports");

    addOnInit(wasmExports['__wasm_call_ctors']);

    removeRunDependency('wasm-instantiate');
    return wasmExports;
  }
  // wait for the pthread pool (if any)
  addRunDependency('wasm-instantiate');

  // Prefer streaming instantiation if available.
  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
    trueModule = null;
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above PTHREADS-enabled path.
    receiveInstance(result['instance']);
  }

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
  if (Module['instantiateWasm']) {

    try {
      return Module['instantiateWasm'](info, receiveInstance);
    } catch(e) {
      err(`Module.instantiateWasm callback failed with error: ${e}`);
        return false;
    }
  }

  instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult);
  return {}; // no exports yet; we'll fill them in later
}

// Globals used by JS i64 conversions (see makeSetValue)
var tempDouble;
var tempI64;

// include: runtime_debug.js
function legacyModuleProp(prop, newName, incomming=true) {
  if (!Object.getOwnPropertyDescriptor(Module, prop)) {
    Object.defineProperty(Module, prop, {
      configurable: true,
      get() {
        let extra = incomming ? ' (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)' : '';
        abort(`\`Module.${prop}\` has been replaced by \`${newName}\`` + extra);

      }
    });
  }
}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort(`\`Module.${prop}\` was supplied but \`${prop}\` not included in INCOMING_MODULE_JS_API`);
  }
}

// forcing the filesystem exports a few things by default
function isExportedByForceFilesystem(name) {
  return name === 'FS_createPath' ||
         name === 'FS_createDataFile' ||
         name === 'FS_createPreloadedFile' ||
         name === 'FS_unlink' ||
         name === 'addRunDependency' ||
         // The old FS has some functionality that WasmFS lacks.
         name === 'FS_createLazyFile' ||
         name === 'FS_createDevice' ||
         name === 'removeRunDependency';
}

function missingGlobal(sym, msg) {
  if (typeof globalThis !== 'undefined') {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get() {
        warnOnce('`' + sym + '` is not longer defined by emscripten. ' + msg);
        return undefined;
      }
    });
  }
}

missingGlobal('buffer', 'Please use HEAP8.buffer or wasmMemory.buffer');
missingGlobal('asm', 'Please use wasmExports instead');

function missingLibrarySymbol(sym) {
  if (typeof globalThis !== 'undefined' && !Object.getOwnPropertyDescriptor(globalThis, sym)) {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get() {
        // Can't `abort()` here because it would break code that does runtime
        // checks.  e.g. `if (typeof SDL === 'undefined')`.
        var msg = '`' + sym + '` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line';
        // DEFAULT_LIBRARY_FUNCS_TO_INCLUDE requires the name as it appears in
        // library.js, which means $name for a JS name with no prefix, or name
        // for a JS name like _name.
        var librarySymbol = sym;
        if (!librarySymbol.startsWith('_')) {
          librarySymbol = '$' + sym;
        }
        msg += " (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE='" + librarySymbol + "')";
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        warnOnce(msg);
        return undefined;
      }
    });
  }
  // Any symbol that is not included from the JS libary is also (by definition)
  // not exported on the Module object.
  unexportedRuntimeSymbol(sym);
}

function unexportedRuntimeSymbol(sym) {
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get() {
        var msg = "'" + sym + "' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)";
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        abort(msg);
      }
    });
  }
}

// Used by XXXXX_DEBUG settings to output debug messages.
function dbg(text) {
  // TODO(sbc): Make this configurable somehow.  Its not always convenient for
  // logging to show up as warnings.
  console.warn.apply(console, arguments);
}
// end include: runtime_debug.js
// === Body ===

function js_get_stream_id(data,status) { return self.AscViewer.CheckStreamId(data, status); }
function js_free_id(data) { self.AscViewer.Free(data); return 1; }


// end include: preamble.js

  /** @constructor */
  function ExitStatus(status) {
      this.name = 'ExitStatus';
      this.message = `Program terminated with exit(${status})`;
      this.status = status;
    }

  var callRuntimeCallbacks = (callbacks) => {
      while (callbacks.length > 0) {
        // Pass the module as the first argument.
        callbacks.shift()(Module);
      }
    };

  var decrementExceptionRefcount = (ptr) => ___cxa_decrement_exception_refcount(ptr);

  
  
  var withStackSave = (f) => {
      var stack = stackSave();
      var ret = f();
      stackRestore(stack);
      return ret;
    };
  
  var UTF8Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder('utf8') : undefined;
  
    /**
     * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
     * array that contains uint8 values, returns a copy of that string as a
     * Javascript String object.
     * heapOrArray is either a regular array, or a JavaScript typed array view.
     * @param {number} idx
     * @param {number=} maxBytesToRead
     * @return {string}
     */
  var UTF8ArrayToString = (heapOrArray, idx, maxBytesToRead) => {
      var endIdx = idx + maxBytesToRead;
      var endPtr = idx;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on
      // null terminator by itself.  Also, use the length info to avoid running tiny
      // strings through TextDecoder, since .subarray() allocates garbage.
      // (As a tiny code save trick, compare endPtr against endIdx using a negation,
      // so that undefined means Infinity)
      while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
  
      if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
      }
      var str = '';
      // If building with TextDecoder, we have already computed the string length
      // above, so test loop end condition against that
      while (idx < endPtr) {
        // For UTF8 byte structure, see:
        // http://en.wikipedia.org/wiki/UTF-8#Description
        // https://www.ietf.org/rfc/rfc2279.txt
        // https://tools.ietf.org/html/rfc3629
        var u0 = heapOrArray[idx++];
        if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 0xF0) == 0xE0) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
          if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte ' + ptrToString(u0) + ' encountered when deserializing a UTF-8 string in wasm memory to a JS string!');
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
        }
  
        if (u0 < 0x10000) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 0x10000;
          str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        }
      }
      return str;
    };
  
    /**
     * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
     * emscripten HEAP, returns a copy of that string as a Javascript String object.
     *
     * @param {number} ptr
     * @param {number=} maxBytesToRead - An optional length that specifies the
     *   maximum number of bytes to read. You can omit this parameter to scan the
     *   string until the first 0 byte. If maxBytesToRead is passed, and the string
     *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
     *   string will cut short at that byte index (i.e. maxBytesToRead will not
     *   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
     *   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
     *   JS JIT optimizations off, so it is worth to consider consistently using one
     * @return {string}
     */
  var UTF8ToString = (ptr, maxBytesToRead) => {
      assert(typeof ptr == 'number', `UTF8ToString expects a number (got ${typeof ptr})`);
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
    };
  var getExceptionMessageCommon = (ptr) => withStackSave(() => {
      var type_addr_addr = stackAlloc(4);
      var message_addr_addr = stackAlloc(4);
      ___get_exception_message(ptr, type_addr_addr, message_addr_addr);
      var type_addr = HEAPU32[((type_addr_addr)>>2)];
      var message_addr = HEAPU32[((message_addr_addr)>>2)];
      var type = UTF8ToString(type_addr);
      _free(type_addr);
      var message;
      if (message_addr) {
        message = UTF8ToString(message_addr);
        _free(message_addr);
      }
      return [type, message];
    });
  var getExceptionMessage = (ptr) => getExceptionMessageCommon(ptr);
  Module['getExceptionMessage'] = getExceptionMessage;

  
    /**
     * @param {number} ptr
     * @param {string} type
     */
  function getValue(ptr, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': abort('to do getValue(i64) use WASM_BIGINT');
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      case '*': return HEAPU32[((ptr)>>2)];
      default: abort(`invalid type for getValue: ${type}`);
    }
  }

  var incrementExceptionRefcount = (ptr) => ___cxa_increment_exception_refcount(ptr);

  var noExitRuntime = Module['noExitRuntime'] || true;

  var ptrToString = (ptr) => {
      assert(typeof ptr === 'number');
      // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
      ptr >>>= 0;
      return '0x' + ptr.toString(16).padStart(8, '0');
    };

  
    /**
     * @param {number} ptr
     * @param {number} value
     * @param {string} type
     */
  function setValue(ptr, value, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': HEAP8[((ptr)>>0)] = value; break;
      case 'i8': HEAP8[((ptr)>>0)] = value; break;
      case 'i16': HEAP16[((ptr)>>1)] = value; break;
      case 'i32': HEAP32[((ptr)>>2)] = value; break;
      case 'i64': abort('to do setValue(i64) use WASM_BIGINT');
      case 'float': HEAPF32[((ptr)>>2)] = value; break;
      case 'double': HEAPF64[((ptr)>>3)] = value; break;
      case '*': HEAPU32[((ptr)>>2)] = value; break;
      default: abort(`invalid type for setValue: ${type}`);
    }
  }

  var warnOnce = (text) => {
      if (!warnOnce.shown) warnOnce.shown = {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text);
      }
    };

  var ___assert_fail = (condition, filename, line, func) => {
      abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [filename ? UTF8ToString(filename) : 'unknown filename', line, func ? UTF8ToString(func) : 'unknown function']);
    };

  var exceptionCaught =  [];
  
  
  var uncaughtExceptionCount = 0;
  var ___cxa_begin_catch = (ptr) => {
      var info = new ExceptionInfo(ptr);
      if (!info.get_caught()) {
        info.set_caught(true);
        uncaughtExceptionCount--;
      }
      info.set_rethrown(false);
      exceptionCaught.push(info);
      ___cxa_increment_exception_refcount(info.excPtr);
      return info.get_exception_ptr();
    };

  
  var exceptionLast = 0;
  
  
  var ___cxa_end_catch = () => {
      // Clear state flag.
      _setThrew(0, 0);
      assert(exceptionCaught.length > 0);
      // Call destructor if one is registered then clear it.
      var info = exceptionCaught.pop();
  
      ___cxa_decrement_exception_refcount(info.excPtr);
      exceptionLast = 0; // XXX in decRef?
    };

  
  /** @constructor */
  function ExceptionInfo(excPtr) {
      this.excPtr = excPtr;
      this.ptr = excPtr - 24;
  
      this.set_type = function(type) {
        HEAPU32[(((this.ptr)+(4))>>2)] = type;
      };
  
      this.get_type = function() {
        return HEAPU32[(((this.ptr)+(4))>>2)];
      };
  
      this.set_destructor = function(destructor) {
        HEAPU32[(((this.ptr)+(8))>>2)] = destructor;
      };
  
      this.get_destructor = function() {
        return HEAPU32[(((this.ptr)+(8))>>2)];
      };
  
      this.set_caught = function(caught) {
        caught = caught ? 1 : 0;
        HEAP8[(((this.ptr)+(12))>>0)] = caught;
      };
  
      this.get_caught = function() {
        return HEAP8[(((this.ptr)+(12))>>0)] != 0;
      };
  
      this.set_rethrown = function(rethrown) {
        rethrown = rethrown ? 1 : 0;
        HEAP8[(((this.ptr)+(13))>>0)] = rethrown;
      };
  
      this.get_rethrown = function() {
        return HEAP8[(((this.ptr)+(13))>>0)] != 0;
      };
  
      // Initialize native structure fields. Should be called once after allocated.
      this.init = function(type, destructor) {
        this.set_adjusted_ptr(0);
        this.set_type(type);
        this.set_destructor(destructor);
      }
  
      this.set_adjusted_ptr = function(adjustedPtr) {
        HEAPU32[(((this.ptr)+(16))>>2)] = adjustedPtr;
      };
  
      this.get_adjusted_ptr = function() {
        return HEAPU32[(((this.ptr)+(16))>>2)];
      };
  
      // Get pointer which is expected to be received by catch clause in C++ code. It may be adjusted
      // when the pointer is casted to some of the exception object base classes (e.g. when virtual
      // inheritance is used). When a pointer is thrown this method should return the thrown pointer
      // itself.
      this.get_exception_ptr = function() {
        // Work around a fastcomp bug, this code is still included for some reason in a build without
        // exceptions support.
        var isPointer = ___cxa_is_pointer_type(this.get_type());
        if (isPointer) {
          return HEAPU32[((this.excPtr)>>2)];
        }
        var adjusted = this.get_adjusted_ptr();
        if (adjusted !== 0) return adjusted;
        return this.excPtr;
      };
    }
  
  var ___resumeException = (ptr) => {
      if (!exceptionLast) {
        exceptionLast = new CppException(ptr);
      }
      throw exceptionLast;
    };
  
  
  var findMatchingCatch = (args) => {
      var thrown =
        exceptionLast && exceptionLast.excPtr;
      if (!thrown) {
        // just pass through the null ptr
        setTempRet0(0);
        return 0;
      }
      var info = new ExceptionInfo(thrown);
      info.set_adjusted_ptr(thrown);
      var thrownType = info.get_type();
      if (!thrownType) {
        // just pass through the thrown ptr
        setTempRet0(0);
        return thrown;
      }
  
      // can_catch receives a **, add indirection
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var arg in args) {
        var caughtType = args[arg];
  
        if (caughtType === 0 || caughtType === thrownType) {
          // Catch all clause matched or exactly the same type is caught
          break;
        }
        var adjusted_ptr_addr = info.ptr + 16;
        if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
          setTempRet0(caughtType);
          return thrown;
        }
      }
      setTempRet0(thrownType);
      return thrown;
    };
  var ___cxa_find_matching_catch_2 = () => findMatchingCatch([]);

  var ___cxa_find_matching_catch_3 = (arg0) => findMatchingCatch([arg0]);

  var ___cxa_find_matching_catch_4 = (arg0,arg1) => findMatchingCatch([arg0,arg1]);

  
  
  var ___cxa_rethrow = () => {
      var info = exceptionCaught.pop();
      if (!info) {
        abort('no exception to throw');
      }
      var ptr = info.excPtr;
      if (!info.get_rethrown()) {
        // Only pop if the corresponding push was through rethrow_primary_exception
        exceptionCaught.push(info);
        info.set_rethrown(true);
        info.set_caught(false);
        uncaughtExceptionCount++;
      }
      exceptionLast = new CppException(ptr);
      throw exceptionLast;
    };

  
  
  var ___cxa_throw = (ptr, type, destructor) => {
      var info = new ExceptionInfo(ptr);
      // Initialize ExceptionInfo content after it was allocated in __cxa_allocate_exception.
      info.init(type, destructor);
      exceptionLast = new CppException(ptr);
      uncaughtExceptionCount++;
      throw exceptionLast;
    };

  var ___cxa_uncaught_exceptions = () => uncaughtExceptionCount;


  var setErrNo = (value) => {
      HEAP32[((___errno_location())>>2)] = value;
      return value;
    };
  
  var SYSCALLS = {
  varargs:undefined,
  get() {
        assert(SYSCALLS.varargs != undefined);
        // the `+` prepended here is necessary to convince the JSCompiler that varargs is indeed a number.
        var ret = HEAP32[((+SYSCALLS.varargs)>>2)];
        SYSCALLS.varargs += 4;
        return ret;
      },
  getp() { return SYSCALLS.get() },
  getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },
  };
  function ___syscall_fcntl64(fd, cmd, varargs) {
  SYSCALLS.varargs = varargs;
  
      return 0;
    }

  var ___syscall_fstat64 = (fd, buf) => {
  abort('it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM');
  };

  var lengthBytesUTF8 = (str) => {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
        // unit, not a Unicode code point of the character! So decode
        // UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var c = str.charCodeAt(i); // possibly a lead surrogate
        if (c <= 0x7F) {
          len++;
        } else if (c <= 0x7FF) {
          len += 2;
        } else if (c >= 0xD800 && c <= 0xDFFF) {
          len += 4; ++i;
        } else {
          len += 3;
        }
      }
      return len;
    };
  
  var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
      assert(typeof str === 'string', `stringToUTF8Array expects a string (got ${typeof str})`);
      // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
      // undefined and false each don't write out any bytes.
      if (!(maxBytesToWrite > 0))
        return 0;
  
      var startIdx = outIdx;
      var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
        // unit, not a Unicode code point of the character! So decode
        // UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
        // and https://www.ietf.org/rfc/rfc2279.txt
        // and https://tools.ietf.org/html/rfc3629
        var u = str.charCodeAt(i); // possibly a lead surrogate
        if (u >= 0xD800 && u <= 0xDFFF) {
          var u1 = str.charCodeAt(++i);
          u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
        }
        if (u <= 0x7F) {
          if (outIdx >= endIdx) break;
          heap[outIdx++] = u;
        } else if (u <= 0x7FF) {
          if (outIdx + 1 >= endIdx) break;
          heap[outIdx++] = 0xC0 | (u >> 6);
          heap[outIdx++] = 0x80 | (u & 63);
        } else if (u <= 0xFFFF) {
          if (outIdx + 2 >= endIdx) break;
          heap[outIdx++] = 0xE0 | (u >> 12);
          heap[outIdx++] = 0x80 | ((u >> 6) & 63);
          heap[outIdx++] = 0x80 | (u & 63);
        } else {
          if (outIdx + 3 >= endIdx) break;
          if (u > 0x10FFFF) warnOnce('Invalid Unicode code point ' + ptrToString(u) + ' encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).');
          heap[outIdx++] = 0xF0 | (u >> 18);
          heap[outIdx++] = 0x80 | ((u >> 12) & 63);
          heap[outIdx++] = 0x80 | ((u >> 6) & 63);
          heap[outIdx++] = 0x80 | (u & 63);
        }
      }
      // Null-terminate the pointer to the buffer.
      heap[outIdx] = 0;
      return outIdx - startIdx;
    };
  var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
      assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
      return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
    };
  
  var ___syscall_getcwd = (buf, size) => {
  abort('it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM');
  };

  
  var ___syscall_getdents64 = (fd, dirp, count) => {
  abort('it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM');
  };

  function ___syscall_ioctl(fd, op, varargs) {
  SYSCALLS.varargs = varargs;
  
      return 0;
    }

  var ___syscall_lstat64 = (path, buf) => {
  abort('it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM');
  };

  var ___syscall_mkdirat = (dirfd, path, mode) => {
  abort('it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM');
  };

  var ___syscall_newfstatat = (dirfd, path, buf, flags) => {
  abort('it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM');
  };

  function ___syscall_openat(dirfd, path, flags, varargs) {
  SYSCALLS.varargs = varargs;
  
  abort('it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM');
  }

  
  
  var ___syscall_readlinkat = (dirfd, path, buf, bufsize) => {
  abort('it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM');
  };

  var ___syscall_rmdir = (path) => {
  abort('it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM');
  };

  var ___syscall_stat64 = (path, buf) => {
  abort('it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM');
  };

  var ___syscall_unlinkat = (dirfd, path, flags) => {
  abort('it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM');
  };

  var readI53FromI64 = (ptr) => {
      return HEAPU32[((ptr)>>2)] + HEAP32[(((ptr)+(4))>>2)] * 4294967296;
    };
  
  var ___syscall_utimensat = (dirfd, path, times, flags) => {
  abort('it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM');
  };

  var nowIsMonotonic = true;;
  var __emscripten_get_now_is_monotonic = () => nowIsMonotonic;

  var __emscripten_throw_longjmp = () => {
      throw new EmscriptenSjLj;
    };

  var convertI32PairToI53Checked = (lo, hi) => {
      assert(lo == (lo >>> 0) || lo == (lo|0)); // lo should either be a i32 or a u32
      assert(hi === (hi|0));                    // hi should be a i32
      return ((hi + 0x200000) >>> 0 < 0x400001 - !!lo) ? (lo >>> 0) + hi * 4294967296 : NaN;
    };
  function __gmtime_js(time_low, time_high,tmPtr) {
    var time = convertI32PairToI53Checked(time_low, time_high);;
  
    
      var date = new Date(time * 1000);
      HEAP32[((tmPtr)>>2)] = date.getUTCSeconds();
      HEAP32[(((tmPtr)+(4))>>2)] = date.getUTCMinutes();
      HEAP32[(((tmPtr)+(8))>>2)] = date.getUTCHours();
      HEAP32[(((tmPtr)+(12))>>2)] = date.getUTCDate();
      HEAP32[(((tmPtr)+(16))>>2)] = date.getUTCMonth();
      HEAP32[(((tmPtr)+(20))>>2)] = date.getUTCFullYear()-1900;
      HEAP32[(((tmPtr)+(24))>>2)] = date.getUTCDay();
      var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
      var yday = ((date.getTime() - start) / (1000 * 60 * 60 * 24))|0;
      HEAP32[(((tmPtr)+(28))>>2)] = yday;
    ;
  }

  var isLeapYear = (year) => year%4 === 0 && (year%100 !== 0 || year%400 === 0);
  
  var MONTH_DAYS_LEAP_CUMULATIVE = [0,31,60,91,121,152,182,213,244,274,305,335];
  
  var MONTH_DAYS_REGULAR_CUMULATIVE = [0,31,59,90,120,151,181,212,243,273,304,334];
  var ydayFromDate = (date) => {
      var leap = isLeapYear(date.getFullYear());
      var monthDaysCumulative = (leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE);
      var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1; // -1 since it's days since Jan 1
  
      return yday;
    };
  
  
  var __mktime_js = function(tmPtr) {
  
    var ret = (() => { 
      var date = new Date(HEAP32[(((tmPtr)+(20))>>2)] + 1900,
                          HEAP32[(((tmPtr)+(16))>>2)],
                          HEAP32[(((tmPtr)+(12))>>2)],
                          HEAP32[(((tmPtr)+(8))>>2)],
                          HEAP32[(((tmPtr)+(4))>>2)],
                          HEAP32[((tmPtr)>>2)],
                          0);
  
      // There's an ambiguous hour when the time goes back; the tm_isdst field is
      // used to disambiguate it.  Date() basically guesses, so we fix it up if it
      // guessed wrong, or fill in tm_isdst with the guess if it's -1.
      var dst = HEAP32[(((tmPtr)+(32))>>2)];
      var guessedOffset = date.getTimezoneOffset();
      var start = new Date(date.getFullYear(), 0, 1);
      var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
      var winterOffset = start.getTimezoneOffset();
      var dstOffset = Math.min(winterOffset, summerOffset); // DST is in December in South
      if (dst < 0) {
        // Attention: some regions don't have DST at all.
        HEAP32[(((tmPtr)+(32))>>2)] = Number(summerOffset != winterOffset && dstOffset == guessedOffset);
      } else if ((dst > 0) != (dstOffset == guessedOffset)) {
        var nonDstOffset = Math.max(winterOffset, summerOffset);
        var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
        // Don't try setMinutes(date.getMinutes() + ...) -- it's messed up.
        date.setTime(date.getTime() + (trueOffset - guessedOffset)*60000);
      }
  
      HEAP32[(((tmPtr)+(24))>>2)] = date.getDay();
      var yday = ydayFromDate(date)|0;
      HEAP32[(((tmPtr)+(28))>>2)] = yday;
      // To match expected behavior, update fields from date
      HEAP32[((tmPtr)>>2)] = date.getSeconds();
      HEAP32[(((tmPtr)+(4))>>2)] = date.getMinutes();
      HEAP32[(((tmPtr)+(8))>>2)] = date.getHours();
      HEAP32[(((tmPtr)+(12))>>2)] = date.getDate();
      HEAP32[(((tmPtr)+(16))>>2)] = date.getMonth();
      HEAP32[(((tmPtr)+(20))>>2)] = date.getYear();
  
      return date.getTime() / 1000;
     })();
    return (setTempRet0((tempDouble = ret,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)), ret>>>0);
  };

  
  
  function __mmap_js(len,prot,flags,fd,offset_low, offset_high,allocated,addr) {
    var offset = convertI32PairToI53Checked(offset_low, offset_high);;
  
    
      return -52;
    ;
  }

  
  
  function __munmap_js(addr,len,prot,flags,fd,offset_low, offset_high) {
    var offset = convertI32PairToI53Checked(offset_low, offset_high);;
  
    
    ;
  }

  
  
  var stringToNewUTF8 = (str) => {
      var size = lengthBytesUTF8(str) + 1;
      var ret = _malloc(size);
      if (ret) stringToUTF8(str, ret, size);
      return ret;
    };
  var __tzset_js = (timezone, daylight, tzname) => {
      // TODO: Use (malleable) environment variables instead of system settings.
      var currentYear = new Date().getFullYear();
      var winter = new Date(currentYear, 0, 1);
      var summer = new Date(currentYear, 6, 1);
      var winterOffset = winter.getTimezoneOffset();
      var summerOffset = summer.getTimezoneOffset();
  
      // Local standard timezone offset. Local standard time is not adjusted for daylight savings.
      // This code uses the fact that getTimezoneOffset returns a greater value during Standard Time versus Daylight Saving Time (DST).
      // Thus it determines the expected output during Standard Time, and it compares whether the output of the given date the same (Standard) or less (DST).
      var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
  
      // timezone is specified as seconds west of UTC ("The external variable
      // `timezone` shall be set to the difference, in seconds, between
      // Coordinated Universal Time (UTC) and local standard time."), the same
      // as returned by stdTimezoneOffset.
      // See http://pubs.opengroup.org/onlinepubs/009695399/functions/tzset.html
      HEAPU32[((timezone)>>2)] = stdTimezoneOffset * 60;
  
      HEAP32[((daylight)>>2)] = Number(winterOffset != summerOffset);
  
      function extractZone(date) {
        var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
        return match ? match[1] : "GMT";
      };
      var winterName = extractZone(winter);
      var summerName = extractZone(summer);
      var winterNamePtr = stringToNewUTF8(winterName);
      var summerNamePtr = stringToNewUTF8(summerName);
      if (summerOffset < winterOffset) {
        // Northern hemisphere
        HEAPU32[((tzname)>>2)] = winterNamePtr;
        HEAPU32[(((tzname)+(4))>>2)] = summerNamePtr;
      } else {
        HEAPU32[((tzname)>>2)] = summerNamePtr;
        HEAPU32[(((tzname)+(4))>>2)] = winterNamePtr;
      }
    };

  var _abort = () => {
      abort('native code called abort()');
    };

  var _emscripten_date_now = () => Date.now();

  var _emscripten_get_now;
      // Modern environment where performance.now() is supported:
      // N.B. a shorter form "_emscripten_get_now = performance.now;" is
      // unfortunately not allowed even in current browsers (e.g. FF Nightly 75).
      _emscripten_get_now = () => performance.now();
  ;

  var _emscripten_memcpy_js = (dest, src, num) => HEAPU8.copyWithin(dest, src, src + num);

  var getHeapMax = () =>
      // Stay one Wasm page short of 4GB: while e.g. Chrome is able to allocate
      // full 4GB Wasm memories, the size will wrap back to 0 bytes in Wasm side
      // for any code that deals with heap sizes, which would require special
      // casing all heap size related code to treat 0 specially.
      2147483648;
  
  var growMemory = (size) => {
      var b = wasmMemory.buffer;
      var pages = (size - b.byteLength + 65535) / 65536;
      try {
        // round size grow request up to wasm page size (fixed 64KB per spec)
        wasmMemory.grow(pages); // .grow() takes a delta compared to the previous size
        updateMemoryViews();
        return 1 /*success*/;
      } catch(e) {
        err(`growMemory: Attempted to grow heap from ${b.byteLength} bytes to ${size} bytes, but got error: ${e}`);
      }
      // implicit 0 return to save code size (caller will cast "undefined" into 0
      // anyhow)
    };
  var _emscripten_resize_heap = (requestedSize) => {
      var oldSize = HEAPU8.length;
      // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
      requestedSize >>>= 0;
      // With multithreaded builds, races can happen (another thread might increase the size
      // in between), so return a failure, and let the caller retry.
      assert(requestedSize > oldSize);
  
      // Memory resize rules:
      // 1.  Always increase heap size to at least the requested size, rounded up
      //     to next page multiple.
      // 2a. If MEMORY_GROWTH_LINEAR_STEP == -1, excessively resize the heap
      //     geometrically: increase the heap size according to
      //     MEMORY_GROWTH_GEOMETRIC_STEP factor (default +20%), At most
      //     overreserve by MEMORY_GROWTH_GEOMETRIC_CAP bytes (default 96MB).
      // 2b. If MEMORY_GROWTH_LINEAR_STEP != -1, excessively resize the heap
      //     linearly: increase the heap size by at least
      //     MEMORY_GROWTH_LINEAR_STEP bytes.
      // 3.  Max size for the heap is capped at 2048MB-WASM_PAGE_SIZE, or by
      //     MAXIMUM_MEMORY, or by ASAN limit, depending on which is smallest
      // 4.  If we were unable to allocate as much memory, it may be due to
      //     over-eager decision to excessively reserve due to (3) above.
      //     Hence if an allocation fails, cut down on the amount of excess
      //     growth, in an attempt to succeed to perform a smaller allocation.
  
      // A limit is set for how much we can grow. We should not exceed that
      // (the wasm binary specifies it, so if we tried, we'd fail anyhow).
      var maxHeapSize = getHeapMax();
      if (requestedSize > maxHeapSize) {
        err(`Cannot enlarge memory, requested ${requestedSize} bytes, but the limit is ${maxHeapSize} bytes!`);
        return false;
      }
  
      var alignUp = (x, multiple) => x + (multiple - x % multiple) % multiple;
  
      // Loop through potential heap size increases. If we attempt a too eager
      // reservation that fails, cut down on the attempted size and reserve a
      // smaller bump instead. (max 3 times, chosen somewhat arbitrarily)
      for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown); // ensure geometric growth
        // but limit overreserving (default to capping at +96MB overgrowth at most)
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296 );
  
        var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
  
        var replacement = growMemory(newSize);
        if (replacement) {
  
          return true;
        }
      }
      err(`Failed to grow the heap from ${oldSize} bytes to ${newSize} bytes, not enough memory!`);
      return false;
    };

  var ENV = {
  };
  
  var getExecutableName = () => {
      return thisProgram || './this.program';
    };
  var getEnvStrings = () => {
      if (!getEnvStrings.strings) {
        // Default values.
        // Browser language detection #8751
        var lang = ((typeof navigator == 'object' && navigator.languages && navigator.languages[0]) || 'C').replace('-', '_') + '.UTF-8';
        var env = {
          'USER': 'web_user',
          'LOGNAME': 'web_user',
          'PATH': '/',
          'PWD': '/',
          'HOME': '/home/web_user',
          'LANG': lang,
          '_': getExecutableName()
        };
        // Apply the user-provided values, if any.
        for (var x in ENV) {
          // x is a key in ENV; if ENV[x] is undefined, that means it was
          // explicitly set to be so. We allow user code to do that to
          // force variables with default values to remain unset.
          if (ENV[x] === undefined) delete env[x];
          else env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
          strings.push(`${x}=${env[x]}`);
        }
        getEnvStrings.strings = strings;
      }
      return getEnvStrings.strings;
    };
  
  var stringToAscii = (str, buffer) => {
      for (var i = 0; i < str.length; ++i) {
        assert(str.charCodeAt(i) === (str.charCodeAt(i) & 0xff));
        HEAP8[((buffer++)>>0)] = str.charCodeAt(i);
      }
      // Null-terminate the string
      HEAP8[((buffer)>>0)] = 0;
    };
  
  var _environ_get = (__environ, environ_buf) => {
      var bufSize = 0;
      getEnvStrings().forEach((string, i) => {
        var ptr = environ_buf + bufSize;
        HEAPU32[(((__environ)+(i*4))>>2)] = ptr;
        stringToAscii(string, ptr);
        bufSize += string.length + 1;
      });
      return 0;
    };

  
  var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
      var strings = getEnvStrings();
      HEAPU32[((penviron_count)>>2)] = strings.length;
      var bufSize = 0;
      strings.forEach((string) => bufSize += string.length + 1);
      HEAPU32[((penviron_buf_size)>>2)] = bufSize;
      return 0;
    };

  
  var runtimeKeepaliveCounter = 0;
  var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
  
  var _proc_exit = (code) => {
      EXITSTATUS = code;
      if (!keepRuntimeAlive()) {
        if (Module['onExit']) Module['onExit'](code);
        ABORT = true;
      }
      quit_(code, new ExitStatus(code));
    };
  
  /** @suppress {duplicate } */
  /** @param {boolean|number=} implicit */
  var exitJS = (status, implicit) => {
      EXITSTATUS = status;
  
      checkUnflushedContent();
  
      // if exit() was called explicitly, warn the user if the runtime isn't actually being shut down
      if (keepRuntimeAlive() && !implicit) {
        var msg = `program exited (with status: ${status}), but keepRuntimeAlive() is set (counter=${runtimeKeepaliveCounter}) due to an async operation, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)`;
        err(msg);
      }
  
      _proc_exit(status);
    };
  var _exit = exitJS;

  var _fd_close = (fd) => {
      abort('fd_close called without SYSCALLS_REQUIRE_FILESYSTEM');
    };

  var _fd_read = (fd, iov, iovcnt, pnum) => {
      abort('fd_read called without SYSCALLS_REQUIRE_FILESYSTEM');
    };

  
  function _fd_seek(fd,offset_low, offset_high,whence,newOffset) {
    var offset = convertI32PairToI53Checked(offset_low, offset_high);;
  
    
      return 70;
    ;
  }

  var printCharBuffers = [null,[],[]];
  
  var printChar = (stream, curr) => {
      var buffer = printCharBuffers[stream];
      assert(buffer);
      if (curr === 0 || curr === 10) {
        (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
        buffer.length = 0;
      } else {
        buffer.push(curr);
      }
    };
  
  var flush_NO_FILESYSTEM = () => {
      // flush anything remaining in the buffers during shutdown
      _fflush(0);
      if (printCharBuffers[1].length) printChar(1, 10);
      if (printCharBuffers[2].length) printChar(2, 10);
    };
  
  
  var _fd_write = (fd, iov, iovcnt, pnum) => {
      // hack to support printf in SYSCALLS_REQUIRE_FILESYSTEM=0
      var num = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        for (var j = 0; j < len; j++) {
          printChar(fd, HEAPU8[ptr+j]);
        }
        num += len;
      }
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    };

  var _llvm_eh_typeid_for = (type) => type;

  
  var arraySum = (array, index) => {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]) {
        // no-op
      }
      return sum;
    };
  
  
  var MONTH_DAYS_LEAP = [31,29,31,30,31,30,31,31,30,31,30,31];
  
  var MONTH_DAYS_REGULAR = [31,28,31,30,31,30,31,31,30,31,30,31];
  var addDays = (date, days) => {
      var newDate = new Date(date.getTime());
      while (days > 0) {
        var leap = isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR)[currentMonth];
  
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
  
      return newDate;
    };
  
  
  
  
  /** @type {function(string, boolean=, number=)} */
  function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array;
  }
  
  var writeArrayToMemory = (array, buffer) => {
      assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)')
      HEAP8.set(array, buffer);
    };
  
  var _strftime = (s, maxsize, format, tm) => {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
  
      var tm_zone = HEAPU32[(((tm)+(40))>>2)];
  
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)],
        tm_gmtoff: HEAP32[(((tm)+(36))>>2)],
        tm_zone: tm_zone ? UTF8ToString(tm_zone) : ''
      };
  
      var pattern = UTF8ToString(format);
  
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate time representation
        // Modified Conversion Specifiers
        '%Ec': '%c',                      // Replaced by the locale's alternative appropriate date and time representation.
        '%EC': '%C',                      // Replaced by the name of the base year (period) in the locale's alternative representation.
        '%Ex': '%m/%d/%y',                // Replaced by the locale's alternative date representation.
        '%EX': '%H:%M:%S',                // Replaced by the locale's alternative time representation.
        '%Ey': '%y',                      // Replaced by the offset from %EC (year only) in the locale's alternative representation.
        '%EY': '%Y',                      // Replaced by the full alternative year representation.
        '%Od': '%d',                      // Replaced by the day of the month, using the locale's alternative numeric symbols, filled as needed with leading zeros if there is any alternative symbol for zero; otherwise, with leading <space> characters.
        '%Oe': '%e',                      // Replaced by the day of the month, using the locale's alternative numeric symbols, filled as needed with leading <space> characters.
        '%OH': '%H',                      // Replaced by the hour (24-hour clock) using the locale's alternative numeric symbols.
        '%OI': '%I',                      // Replaced by the hour (12-hour clock) using the locale's alternative numeric symbols.
        '%Om': '%m',                      // Replaced by the month using the locale's alternative numeric symbols.
        '%OM': '%M',                      // Replaced by the minutes using the locale's alternative numeric symbols.
        '%OS': '%S',                      // Replaced by the seconds using the locale's alternative numeric symbols.
        '%Ou': '%u',                      // Replaced by the weekday as a number in the locale's alternative representation (Monday=1).
        '%OU': '%U',                      // Replaced by the week number of the year (Sunday as the first day of the week, rules corresponding to %U ) using the locale's alternative numeric symbols.
        '%OV': '%V',                      // Replaced by the week number of the year (Monday as the first day of the week, rules corresponding to %V ) using the locale's alternative numeric symbols.
        '%Ow': '%w',                      // Replaced by the number of the weekday (Sunday=0) using the locale's alternative numeric symbols.
        '%OW': '%W',                      // Replaced by the week number of the year (Monday as the first day of the week) using the locale's alternative numeric symbols.
        '%Oy': '%y',                      // Replaced by the year (offset from %C ) using the locale's alternative numeric symbols.
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
  
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
      function leadingSomething(value, digits, character) {
        var str = typeof value == 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      }
  
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      }
  
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        }
  
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      }
  
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      }
  
      function getWeekBasedYear(date) {
          var thisDate = addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            }
            return thisDate.getFullYear();
          }
          return thisDate.getFullYear()-1;
      }
  
      var EXPANSION_RULES_2 = {
        '%a': (date) => WEEKDAYS[date.tm_wday].substring(0,3) ,
        '%A': (date) => WEEKDAYS[date.tm_wday],
        '%b': (date) => MONTHS[date.tm_mon].substring(0,3),
        '%B': (date) => MONTHS[date.tm_mon],
        '%C': (date) => {
          var year = date.tm_year+1900;
          return leadingNulls((year/100)|0,2);
        },
        '%d': (date) => leadingNulls(date.tm_mday, 2),
        '%e': (date) => leadingSomething(date.tm_mday, 2, ' '),
        '%g': (date) => {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year.
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes
          // January 4th, which is also the week that includes the first Thursday of the year, and
          // is also the first week that contains at least four days in the year.
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of
          // the last week of the preceding year; thus, for Saturday 2nd January 1999,
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th,
          // or 31st is a Monday, it and any following days are part of week 1 of the following year.
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
  
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': (date) => getWeekBasedYear(date),
        '%H': (date) => leadingNulls(date.tm_hour, 2),
        '%I': (date) => {
          var twelveHour = date.tm_hour;
          if (twelveHour == 0) twelveHour = 12;
          else if (twelveHour > 12) twelveHour -= 12;
          return leadingNulls(twelveHour, 2);
        },
        '%j': (date) => {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday + arraySum(isLeapYear(date.tm_year+1900) ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': (date) => leadingNulls(date.tm_mon+1, 2),
        '%M': (date) => leadingNulls(date.tm_min, 2),
        '%n': () => '\n',
        '%p': (date) => {
          if (date.tm_hour >= 0 && date.tm_hour < 12) {
            return 'AM';
          }
          return 'PM';
        },
        '%S': (date) => leadingNulls(date.tm_sec, 2),
        '%t': () => '\t',
        '%u': (date) => date.tm_wday || 7,
        '%U': (date) => {
          var days = date.tm_yday + 7 - date.tm_wday;
          return leadingNulls(Math.floor(days / 7), 2);
        },
        '%V': (date) => {
          // Replaced by the week number of the year (Monday as the first day of the week)
          // as a decimal number [01,53]. If the week containing 1 January has four
          // or more days in the new year, then it is considered week 1.
          // Otherwise, it is the last week of the previous year, and the next week is week 1.
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var val = Math.floor((date.tm_yday + 7 - (date.tm_wday + 6) % 7 ) / 7);
          // If 1 Jan is just 1-3 days past Monday, the previous week
          // is also in this year.
          if ((date.tm_wday + 371 - date.tm_yday - 2) % 7 <= 2) {
            val++;
          }
          if (!val) {
            val = 52;
            // If 31 December of prev year a Thursday, or Friday of a
            // leap year, then the prev year has 53 weeks.
            var dec31 = (date.tm_wday + 7 - date.tm_yday - 1) % 7;
            if (dec31 == 4 || (dec31 == 5 && isLeapYear(date.tm_year%400-1))) {
              val++;
            }
          } else if (val == 53) {
            // If 1 January is not a Thursday, and not a Wednesday of a
            // leap year, then this year has only 52 weeks.
            var jan1 = (date.tm_wday + 371 - date.tm_yday) % 7;
            if (jan1 != 4 && (jan1 != 3 || !isLeapYear(date.tm_year)))
              val = 1;
          }
          return leadingNulls(val, 2);
        },
        '%w': (date) => date.tm_wday,
        '%W': (date) => {
          var days = date.tm_yday + 7 - ((date.tm_wday + 6) % 7);
          return leadingNulls(Math.floor(days / 7), 2);
        },
        '%y': (date) => {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
        '%Y': (date) => date.tm_year+1900,
        '%z': (date) => {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ).
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich).
          var off = date.tm_gmtoff;
          var ahead = off >= 0;
          off = Math.abs(off) / 60;
          // convert from minutes into hhmm format (which means 60 minutes = 100 units)
          off = (off / 60)*100 + (off % 60);
          return (ahead ? '+' : '-') + String("0000" + off).slice(-4);
        },
        '%Z': (date) => date.tm_zone,
        '%%': () => '%'
      };
  
      // Replace %% with a pair of NULLs (which cannot occur in a C string), then
      // re-inject them after processing.
      pattern = pattern.replace(/%%/g, '\0\0')
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.includes(rule)) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
      pattern = pattern.replace(/\0\0/g, '%')
  
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      }
  
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    };
  var _strftime_l = (s, maxsize, format, tm, loc) => {
      return _strftime(s, maxsize, format, tm); // no locale support yet
    };

  var _system = (command) => {
      // int system(const char *command);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/system.html
      // Can't call external programs.
      if (!command) return 0; // no shell available
      setErrNo(52);
      return -1;
    };

  var wasmTableMirror = [];
  
  var wasmTable;
  var getWasmTableEntry = (funcPtr) => {
      var func = wasmTableMirror[funcPtr];
      if (!func) {
        if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
      }
      assert(wasmTable.get(funcPtr) == func, "JavaScript-side Wasm function table mirror is out of date!");
      return func;
    };
function checkIncomingModuleAPI() {
  ignoredModuleProp('fetchSettings');
}
var wasmImports = {
  /** @export */
  __assert_fail: ___assert_fail,
  /** @export */
  __cxa_begin_catch: ___cxa_begin_catch,
  /** @export */
  __cxa_end_catch: ___cxa_end_catch,
  /** @export */
  __cxa_find_matching_catch_2: ___cxa_find_matching_catch_2,
  /** @export */
  __cxa_find_matching_catch_3: ___cxa_find_matching_catch_3,
  /** @export */
  __cxa_find_matching_catch_4: ___cxa_find_matching_catch_4,
  /** @export */
  __cxa_rethrow: ___cxa_rethrow,
  /** @export */
  __cxa_throw: ___cxa_throw,
  /** @export */
  __cxa_uncaught_exceptions: ___cxa_uncaught_exceptions,
  /** @export */
  __resumeException: ___resumeException,
  /** @export */
  __syscall_fcntl64: ___syscall_fcntl64,
  /** @export */
  __syscall_fstat64: ___syscall_fstat64,
  /** @export */
  __syscall_getcwd: ___syscall_getcwd,
  /** @export */
  __syscall_getdents64: ___syscall_getdents64,
  /** @export */
  __syscall_ioctl: ___syscall_ioctl,
  /** @export */
  __syscall_lstat64: ___syscall_lstat64,
  /** @export */
  __syscall_mkdirat: ___syscall_mkdirat,
  /** @export */
  __syscall_newfstatat: ___syscall_newfstatat,
  /** @export */
  __syscall_openat: ___syscall_openat,
  /** @export */
  __syscall_readlinkat: ___syscall_readlinkat,
  /** @export */
  __syscall_rmdir: ___syscall_rmdir,
  /** @export */
  __syscall_stat64: ___syscall_stat64,
  /** @export */
  __syscall_unlinkat: ___syscall_unlinkat,
  /** @export */
  __syscall_utimensat: ___syscall_utimensat,
  /** @export */
  _emscripten_get_now_is_monotonic: __emscripten_get_now_is_monotonic,
  /** @export */
  _emscripten_throw_longjmp: __emscripten_throw_longjmp,
  /** @export */
  _gmtime_js: __gmtime_js,
  /** @export */
  _mktime_js: __mktime_js,
  /** @export */
  _mmap_js: __mmap_js,
  /** @export */
  _munmap_js: __munmap_js,
  /** @export */
  _tzset_js: __tzset_js,
  /** @export */
  abort: _abort,
  /** @export */
  emscripten_date_now: _emscripten_date_now,
  /** @export */
  emscripten_get_now: _emscripten_get_now,
  /** @export */
  emscripten_memcpy_js: _emscripten_memcpy_js,
  /** @export */
  emscripten_resize_heap: _emscripten_resize_heap,
  /** @export */
  environ_get: _environ_get,
  /** @export */
  environ_sizes_get: _environ_sizes_get,
  /** @export */
  exit: _exit,
  /** @export */
  fd_close: _fd_close,
  /** @export */
  fd_read: _fd_read,
  /** @export */
  fd_seek: _fd_seek,
  /** @export */
  fd_write: _fd_write,
  /** @export */
  invoke_di: invoke_di,
  /** @export */
  invoke_didd: invoke_didd,
  /** @export */
  invoke_dii: invoke_dii,
  /** @export */
  invoke_diii: invoke_diii,
  /** @export */
  invoke_diiii: invoke_diiii,
  /** @export */
  invoke_diiiiiiiii: invoke_diiiiiiiii,
  /** @export */
  invoke_ff: invoke_ff,
  /** @export */
  invoke_fi: invoke_fi,
  /** @export */
  invoke_fif: invoke_fif,
  /** @export */
  invoke_fiii: invoke_fiii,
  /** @export */
  invoke_i: invoke_i,
  /** @export */
  invoke_idddd: invoke_idddd,
  /** @export */
  invoke_idddiii: invoke_idddiii,
  /** @export */
  invoke_ii: invoke_ii,
  /** @export */
  invoke_iid: invoke_iid,
  /** @export */
  invoke_iidd: invoke_iidd,
  /** @export */
  invoke_iidddd: invoke_iidddd,
  /** @export */
  invoke_iidddddd: invoke_iidddddd,
  /** @export */
  invoke_iiddddddddiiii: invoke_iiddddddddiiii,
  /** @export */
  invoke_iiddddddiiii: invoke_iiddddddiiii,
  /** @export */
  invoke_iiddddiii: invoke_iiddddiii,
  /** @export */
  invoke_iiddiii: invoke_iiddiii,
  /** @export */
  invoke_iiddiiidd: invoke_iiddiiidd,
  /** @export */
  invoke_iiddiiiiiiiii: invoke_iiddiiiiiiiii,
  /** @export */
  invoke_iidi: invoke_iidi,
  /** @export */
  invoke_iif: invoke_iif,
  /** @export */
  invoke_iii: invoke_iii,
  /** @export */
  invoke_iiidddd: invoke_iiidddd,
  /** @export */
  invoke_iiiddddd: invoke_iiiddddd,
  /** @export */
  invoke_iiidddddd: invoke_iiidddddd,
  /** @export */
  invoke_iiidddiii: invoke_iiidddiii,
  /** @export */
  invoke_iiiddiii: invoke_iiiddiii,
  /** @export */
  invoke_iiidiiii: invoke_iiidiiii,
  /** @export */
  invoke_iiiff: invoke_iiiff,
  /** @export */
  invoke_iiifff: invoke_iiifff,
  /** @export */
  invoke_iiiffff: invoke_iiiffff,
  /** @export */
  invoke_iiii: invoke_iiii,
  /** @export */
  invoke_iiiidd: invoke_iiiidd,
  /** @export */
  invoke_iiiidddd: invoke_iiiidddd,
  /** @export */
  invoke_iiiii: invoke_iiiii,
  /** @export */
  invoke_iiiiid: invoke_iiiiid,
  /** @export */
  invoke_iiiiiddddiiiiidddd: invoke_iiiiiddddiiiiidddd,
  /** @export */
  invoke_iiiiiddiii: invoke_iiiiiddiii,
  /** @export */
  invoke_iiiiifi: invoke_iiiiifi,
  /** @export */
  invoke_iiiiii: invoke_iiiiii,
  /** @export */
  invoke_iiiiiiddiiiii: invoke_iiiiiiddiiiii,
  /** @export */
  invoke_iiiiiii: invoke_iiiiiii,
  /** @export */
  invoke_iiiiiiii: invoke_iiiiiiii,
  /** @export */
  invoke_iiiiiiiidd: invoke_iiiiiiiidd,
  /** @export */
  invoke_iiiiiiiii: invoke_iiiiiiiii,
  /** @export */
  invoke_iiiiiiiiidddd: invoke_iiiiiiiiidddd,
  /** @export */
  invoke_iiiiiiiiii: invoke_iiiiiiiiii,
  /** @export */
  invoke_iiiiiiiiiii: invoke_iiiiiiiiiii,
  /** @export */
  invoke_iiiiiiiiiiii: invoke_iiiiiiiiiiii,
  /** @export */
  invoke_iiiiiiiiiiiii: invoke_iiiiiiiiiiiii,
  /** @export */
  invoke_iiiiiiiiiiiiiiiiiiiiiiiiiii: invoke_iiiiiiiiiiiiiiiiiiiiiiiiiii,
  /** @export */
  invoke_ji: invoke_ji,
  /** @export */
  invoke_jii: invoke_jii,
  /** @export */
  invoke_jiiii: invoke_jiiii,
  /** @export */
  invoke_jiiji: invoke_jiiji,
  /** @export */
  invoke_jij: invoke_jij,
  /** @export */
  invoke_v: invoke_v,
  /** @export */
  invoke_vdi: invoke_vdi,
  /** @export */
  invoke_vdii: invoke_vdii,
  /** @export */
  invoke_vi: invoke_vi,
  /** @export */
  invoke_vid: invoke_vid,
  /** @export */
  invoke_vidd: invoke_vidd,
  /** @export */
  invoke_viddd: invoke_viddd,
  /** @export */
  invoke_vidddd: invoke_vidddd,
  /** @export */
  invoke_vidddddd: invoke_vidddddd,
  /** @export */
  invoke_vidddddddd: invoke_vidddddddd,
  /** @export */
  invoke_viddddiiiiiii: invoke_viddddiiiiiii,
  /** @export */
  invoke_vidddi: invoke_vidddi,
  /** @export */
  invoke_viddi: invoke_viddi,
  /** @export */
  invoke_viddii: invoke_viddii,
  /** @export */
  invoke_vidi: invoke_vidi,
  /** @export */
  invoke_vif: invoke_vif,
  /** @export */
  invoke_vifff: invoke_vifff,
  /** @export */
  invoke_viffff: invoke_viffff,
  /** @export */
  invoke_viffffi: invoke_viffffi,
  /** @export */
  invoke_viffiiii: invoke_viffiiii,
  /** @export */
  invoke_vifi: invoke_vifi,
  /** @export */
  invoke_vii: invoke_vii,
  /** @export */
  invoke_viid: invoke_viid,
  /** @export */
  invoke_viiddddddi: invoke_viiddddddi,
  /** @export */
  invoke_viiddiiiii: invoke_viiddiiiii,
  /** @export */
  invoke_viidi: invoke_viidi,
  /** @export */
  invoke_viidii: invoke_viidii,
  /** @export */
  invoke_viif: invoke_viif,
  /** @export */
  invoke_viiff: invoke_viiff,
  /** @export */
  invoke_viii: invoke_viii,
  /** @export */
  invoke_viiid: invoke_viiid,
  /** @export */
  invoke_viiiddiii: invoke_viiiddiii,
  /** @export */
  invoke_viiiddiiiii: invoke_viiiddiiiii,
  /** @export */
  invoke_viiiddiiiiii: invoke_viiiddiiiiii,
  /** @export */
  invoke_viiidi: invoke_viiidi,
  /** @export */
  invoke_viiidiiiddddd: invoke_viiidiiiddddd,
  /** @export */
  invoke_viiif: invoke_viiif,
  /** @export */
  invoke_viiii: invoke_viiii,
  /** @export */
  invoke_viiiid: invoke_viiiid,
  /** @export */
  invoke_viiiiddii: invoke_viiiiddii,
  /** @export */
  invoke_viiiidii: invoke_viiiidii,
  /** @export */
  invoke_viiiii: invoke_viiiii,
  /** @export */
  invoke_viiiiid: invoke_viiiiid,
  /** @export */
  invoke_viiiiiddddddiddii: invoke_viiiiiddddddiddii,
  /** @export */
  invoke_viiiiiddddii: invoke_viiiiiddddii,
  /** @export */
  invoke_viiiiiff: invoke_viiiiiff,
  /** @export */
  invoke_viiiiii: invoke_viiiiii,
  /** @export */
  invoke_viiiiiiff: invoke_viiiiiiff,
  /** @export */
  invoke_viiiiiii: invoke_viiiiiii,
  /** @export */
  invoke_viiiiiiidddii: invoke_viiiiiiidddii,
  /** @export */
  invoke_viiiiiiii: invoke_viiiiiiii,
  /** @export */
  invoke_viiiiiiiii: invoke_viiiiiiiii,
  /** @export */
  invoke_viiiiiiiiii: invoke_viiiiiiiiii,
  /** @export */
  invoke_viiiiiiiiiiiddd: invoke_viiiiiiiiiiiddd,
  /** @export */
  invoke_viiiiiiiiiiii: invoke_viiiiiiiiiiii,
  /** @export */
  invoke_viiiiiiiiiiiiii: invoke_viiiiiiiiiiiiii,
  /** @export */
  invoke_viiiiiiiiiiiiiii: invoke_viiiiiiiiiiiiiii,
  /** @export */
  invoke_viiij: invoke_viiij,
  /** @export */
  invoke_viij: invoke_viij,
  /** @export */
  js_free_id: js_free_id,
  /** @export */
  js_get_stream_id: js_get_stream_id,
  /** @export */
  llvm_eh_typeid_for: _llvm_eh_typeid_for,
  /** @export */
  strftime_l: _strftime_l,
  /** @export */
  system: _system
};
var wasmExports = createWasm();
var ___wasm_call_ctors = createExportWrapper('__wasm_call_ctors');
var _free = Module['_free'] = createExportWrapper('free');
var _malloc = Module['_malloc'] = createExportWrapper('malloc');
var ___cxa_free_exception = createExportWrapper('__cxa_free_exception');
var _fflush = Module['_fflush'] = createExportWrapper('fflush');
var setTempRet0 = createExportWrapper('setTempRet0');
var ___errno_location = createExportWrapper('__errno_location');
var _InitializeFontsBin = Module['_InitializeFontsBin'] = createExportWrapper('InitializeFontsBin');
var _InitializeFontsBase64 = Module['_InitializeFontsBase64'] = createExportWrapper('InitializeFontsBase64');
var _InitializeFontsRanges = Module['_InitializeFontsRanges'] = createExportWrapper('InitializeFontsRanges');
var _SetFontBinary = Module['_SetFontBinary'] = createExportWrapper('SetFontBinary');
var _IsFontBinaryExist = Module['_IsFontBinaryExist'] = createExportWrapper('IsFontBinaryExist');
var _Open = Module['_Open'] = createExportWrapper('Open');
var _GetType = Module['_GetType'] = createExportWrapper('GetType');
var _GetErrorCode = Module['_GetErrorCode'] = createExportWrapper('GetErrorCode');
var _Close = Module['_Close'] = createExportWrapper('Close');
var _GetInfo = Module['_GetInfo'] = createExportWrapper('GetInfo');
var _GetPixmap = Module['_GetPixmap'] = createExportWrapper('GetPixmap');
var _GetGlyphs = Module['_GetGlyphs'] = createExportWrapper('GetGlyphs');
var _GetLinks = Module['_GetLinks'] = createExportWrapper('GetLinks');
var _GetStructure = Module['_GetStructure'] = createExportWrapper('GetStructure');
var _GetInteractiveFormsInfo = Module['_GetInteractiveFormsInfo'] = createExportWrapper('GetInteractiveFormsInfo');
var _GetInteractiveFormsFonts = Module['_GetInteractiveFormsFonts'] = createExportWrapper('GetInteractiveFormsFonts');
var _GetInteractiveFormsAP = Module['_GetInteractiveFormsAP'] = createExportWrapper('GetInteractiveFormsAP');
var _GetButtonIcons = Module['_GetButtonIcons'] = createExportWrapper('GetButtonIcons');
var _GetAnnotationsInfo = Module['_GetAnnotationsInfo'] = createExportWrapper('GetAnnotationsInfo');
var _GetAnnotationsAP = Module['_GetAnnotationsAP'] = createExportWrapper('GetAnnotationsAP');
var _GetFontBinary = Module['_GetFontBinary'] = createExportWrapper('GetFontBinary');
var _DestroyTextInfo = Module['_DestroyTextInfo'] = createExportWrapper('DestroyTextInfo');
var _IsNeedCMap = Module['_IsNeedCMap'] = createExportWrapper('IsNeedCMap');
var _SetCMapData = Module['_SetCMapData'] = createExportWrapper('SetCMapData');
var _ScanPage = Module['_ScanPage'] = createExportWrapper('ScanPage');
var _SplitPages = Module['_SplitPages'] = createExportWrapper('SplitPages');
var _MergePages = Module['_MergePages'] = createExportWrapper('MergePages');
var _UnmergePages = Module['_UnmergePages'] = createExportWrapper('UnmergePages');
var _RedactPage = Module['_RedactPage'] = createExportWrapper('RedactPage');
var _UndoRedact = Module['_UndoRedact'] = createExportWrapper('UndoRedact');
var _GetImageBase64 = Module['_GetImageBase64'] = createExportWrapper('GetImageBase64');
var _GetImageBase64Len = Module['_GetImageBase64Len'] = createExportWrapper('GetImageBase64Len');
var _GetImageBase64Ptr = Module['_GetImageBase64Ptr'] = createExportWrapper('GetImageBase64Ptr');
var _GetImageBase64Free = Module['_GetImageBase64Free'] = createExportWrapper('GetImageBase64Free');
var _setThrew = createExportWrapper('setThrew');
var _emscripten_stack_init = () => (_emscripten_stack_init = wasmExports['emscripten_stack_init'])();
var _emscripten_stack_get_free = () => (_emscripten_stack_get_free = wasmExports['emscripten_stack_get_free'])();
var _emscripten_stack_get_base = () => (_emscripten_stack_get_base = wasmExports['emscripten_stack_get_base'])();
var _emscripten_stack_get_end = () => (_emscripten_stack_get_end = wasmExports['emscripten_stack_get_end'])();
var stackSave = createExportWrapper('stackSave');
var stackRestore = createExportWrapper('stackRestore');
var stackAlloc = createExportWrapper('stackAlloc');
var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports['emscripten_stack_get_current'])();
var ___cxa_decrement_exception_refcount = createExportWrapper('__cxa_decrement_exception_refcount');
var ___cxa_increment_exception_refcount = createExportWrapper('__cxa_increment_exception_refcount');
var ___get_exception_message = Module['___get_exception_message'] = createExportWrapper('__get_exception_message');
var ___cxa_can_catch = createExportWrapper('__cxa_can_catch');
var ___cxa_is_pointer_type = createExportWrapper('__cxa_is_pointer_type');
var dynCall_ji = Module['dynCall_ji'] = createExportWrapper('dynCall_ji');
var dynCall_jiiji = Module['dynCall_jiiji'] = createExportWrapper('dynCall_jiiji');
var dynCall_jij = Module['dynCall_jij'] = createExportWrapper('dynCall_jij');
var dynCall_vij = Module['dynCall_vij'] = createExportWrapper('dynCall_vij');
var dynCall_viiij = Module['dynCall_viiij'] = createExportWrapper('dynCall_viiij');
var dynCall_iiiijii = Module['dynCall_iiiijii'] = createExportWrapper('dynCall_iiiijii');
var dynCall_jii = Module['dynCall_jii'] = createExportWrapper('dynCall_jii');
var dynCall_iiiji = Module['dynCall_iiiji'] = createExportWrapper('dynCall_iiiji');
var dynCall_viij = Module['dynCall_viij'] = createExportWrapper('dynCall_viij');
var dynCall_iijji = Module['dynCall_iijji'] = createExportWrapper('dynCall_iijji');
var dynCall_iiiij = Module['dynCall_iiiij'] = createExportWrapper('dynCall_iiiij');
var dynCall_jiji = Module['dynCall_jiji'] = createExportWrapper('dynCall_jiji');
var dynCall_iiji = Module['dynCall_iiji'] = createExportWrapper('dynCall_iiji');
var dynCall_jji = Module['dynCall_jji'] = createExportWrapper('dynCall_jji');
var dynCall_iji = Module['dynCall_iji'] = createExportWrapper('dynCall_iji');
var dynCall_viijii = Module['dynCall_viijii'] = createExportWrapper('dynCall_viijii');
var dynCall_jiiii = Module['dynCall_jiiii'] = createExportWrapper('dynCall_jiiii');
var dynCall_iiiiij = Module['dynCall_iiiiij'] = createExportWrapper('dynCall_iiiiij');
var dynCall_iiiiijj = Module['dynCall_iiiiijj'] = createExportWrapper('dynCall_iiiiijj');
var dynCall_iiiiiijj = Module['dynCall_iiiiiijj'] = createExportWrapper('dynCall_iiiiiijj');
var ___start_em_js = Module['___start_em_js'] = 3201688;
var ___stop_em_js = Module['___stop_em_js'] = 3201857;
function invoke_vi(index,a1) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ii(index,a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vii(index,a1,a2) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vif(index,a1,a2) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_i(index) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)();
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iidddd(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iidddddd(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_v(index) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)();
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viddi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_di(index,a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_dii(index,a1,a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ff(index,a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vidi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiifi(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iidi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vid(index,a1,a2) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vidd(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiidddd(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iidd(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiidd(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fi(index,a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiifff(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiff(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiif(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vifi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vidddddddd(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_diiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_idddiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_diiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_didd(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiddiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiidddd(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_diii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viddd(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiiiiiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18,a19,a20,a21,a22,a23,a24,a25,a26) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18,a19,a20,a21,a22,a23,a24,a25,a26);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiddiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viidi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiddiiidd(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiddiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiidddii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiiiddd(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viidii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiddddii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiddii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vifff(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iid(index,a1,a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_idddd(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viffff(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiddiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iif(index,a1,a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viffffi(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiff(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiff(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiffff(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiff(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viid(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiidiiiddddd(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiddiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vidddd(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiid(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiidddddd(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiidd(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiddddddiddii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vidddddd(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viffiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiidddd(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viddii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiidiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiddiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiddiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiddddiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiddddddiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiddddddddiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiddddiiiiidddd(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiddddd(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiidddiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiddddddi(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiidi(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiid(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vdii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiid(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiid(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viif(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vdi(index,a1,a2) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fif(index,a1,a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vidddi(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiddiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viddddiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiidii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiddiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ji(index,a1) {
  var sp = stackSave();
  try {
    return dynCall_ji(index,a1);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiij(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    dynCall_viiij(index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jiiji(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return dynCall_jiiji(index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jij(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return dynCall_jij(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jii(index,a1,a2) {
  var sp = stackSave();
  try {
    return dynCall_jii(index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viij(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    dynCall_viij(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jiiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return dynCall_jiiii(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}


// include: postamble.js
// === Auto-generated postamble setup entry stuff ===

var missingLibrarySymbols = [
  'writeI53ToI64',
  'writeI53ToI64Clamped',
  'writeI53ToI64Signaling',
  'writeI53ToU64Clamped',
  'writeI53ToU64Signaling',
  'readI53FromU64',
  'convertI32PairToI53',
  'convertU32PairToI53',
  'zeroMemory',
  'inetPton4',
  'inetNtop4',
  'inetPton6',
  'inetNtop6',
  'readSockaddr',
  'writeSockaddr',
  'getHostByName',
  'initRandomFill',
  'randomFill',
  'getCallstack',
  'emscriptenLog',
  'convertPCtoSourceLocation',
  'readEmAsmArgs',
  'jstoi_q',
  'jstoi_s',
  'listenOnce',
  'autoResumeAudioContext',
  'dynCallLegacy',
  'getDynCaller',
  'dynCall',
  'handleException',
  'runtimeKeepalivePush',
  'runtimeKeepalivePop',
  'callUserCallback',
  'maybeExit',
  'asmjsMangle',
  'asyncLoad',
  'alignMemory',
  'mmapAlloc',
  'handleAllocatorInit',
  'HandleAllocator',
  'getNativeTypeSize',
  'STACK_SIZE',
  'STACK_ALIGN',
  'POINTER_SIZE',
  'ASSERTIONS',
  'getCFunc',
  'ccall',
  'cwrap',
  'uleb128Encode',
  'sigToWasmTypes',
  'generateFuncType',
  'convertJsFunctionToWasm',
  'getEmptyTableSlot',
  'updateTableMap',
  'getFunctionAddress',
  'addFunction',
  'removeFunction',
  'reallyNegative',
  'unSign',
  'strLen',
  'reSign',
  'formatString',
  'intArrayToString',
  'AsciiToString',
  'UTF16ToString',
  'stringToUTF16',
  'lengthBytesUTF16',
  'UTF32ToString',
  'stringToUTF32',
  'lengthBytesUTF32',
  'stringToUTF8OnStack',
  'registerKeyEventCallback',
  'maybeCStringToJsString',
  'findEventTarget',
  'findCanvasEventTarget',
  'getBoundingClientRect',
  'fillMouseEventData',
  'registerMouseEventCallback',
  'registerWheelEventCallback',
  'registerUiEventCallback',
  'registerFocusEventCallback',
  'fillDeviceOrientationEventData',
  'registerDeviceOrientationEventCallback',
  'fillDeviceMotionEventData',
  'registerDeviceMotionEventCallback',
  'screenOrientation',
  'fillOrientationChangeEventData',
  'registerOrientationChangeEventCallback',
  'fillFullscreenChangeEventData',
  'registerFullscreenChangeEventCallback',
  'JSEvents_requestFullscreen',
  'JSEvents_resizeCanvasForFullscreen',
  'registerRestoreOldStyle',
  'hideEverythingExceptGivenElement',
  'restoreHiddenElements',
  'setLetterbox',
  'softFullscreenResizeWebGLRenderTarget',
  'doRequestFullscreen',
  'fillPointerlockChangeEventData',
  'registerPointerlockChangeEventCallback',
  'registerPointerlockErrorEventCallback',
  'requestPointerLock',
  'fillVisibilityChangeEventData',
  'registerVisibilityChangeEventCallback',
  'registerTouchEventCallback',
  'fillGamepadEventData',
  'registerGamepadEventCallback',
  'registerBeforeUnloadEventCallback',
  'fillBatteryEventData',
  'battery',
  'registerBatteryEventCallback',
  'setCanvasElementSize',
  'getCanvasElementSize',
  'demangle',
  'demangleAll',
  'jsStackTrace',
  'stackTrace',
  'checkWasiClock',
  'wasiRightsToMuslOFlags',
  'wasiOFlagsToMuslOFlags',
  'createDyncallWrapper',
  'safeSetTimeout',
  'setImmediateWrapped',
  'clearImmediateWrapped',
  'polyfillSetImmediate',
  'getPromise',
  'makePromise',
  'idsToPromises',
  'makePromiseCallback',
  'setMainLoop',
  'getSocketFromFD',
  'getSocketAddress',
  'heapObjectForWebGLType',
  'heapAccessShiftForWebGLHeap',
  'webgl_enable_ANGLE_instanced_arrays',
  'webgl_enable_OES_vertex_array_object',
  'webgl_enable_WEBGL_draw_buffers',
  'webgl_enable_WEBGL_multi_draw',
  'emscriptenWebGLGet',
  'computeUnpackAlignedImageSize',
  'colorChannelsInGlTextureFormat',
  'emscriptenWebGLGetTexPixelData',
  '__glGenObject',
  'emscriptenWebGLGetUniform',
  'webglGetUniformLocation',
  'webglPrepareUniformLocationsBeforeFirstUse',
  'webglGetLeftBracePos',
  'emscriptenWebGLGetVertexAttrib',
  '__glGetActiveAttribOrUniform',
  'writeGLArray',
  'registerWebGlEventCallback',
  'runAndAbortIfError',
  'SDL_unicode',
  'SDL_ttfContext',
  'SDL_audio',
  'ALLOC_NORMAL',
  'ALLOC_STACK',
  'allocate',
  'writeStringToMemory',
  'writeAsciiToMemory',
];
missingLibrarySymbols.forEach(missingLibrarySymbol)

var unexportedSymbols = [
  'run',
  'addOnPreRun',
  'addOnInit',
  'addOnPreMain',
  'addOnExit',
  'addOnPostRun',
  'addRunDependency',
  'removeRunDependency',
  'FS_createFolder',
  'FS_createPath',
  'FS_createLazyFile',
  'FS_createLink',
  'FS_createDevice',
  'FS_readFile',
  'out',
  'err',
  'callMain',
  'abort',
  'wasmMemory',
  'wasmExports',
  'stackAlloc',
  'stackSave',
  'stackRestore',
  'getTempRet0',
  'setTempRet0',
  'writeStackCookie',
  'checkStackCookie',
  'readI53FromI64',
  'convertI32PairToI53Checked',
  'ptrToString',
  'exitJS',
  'getHeapMax',
  'growMemory',
  'ENV',
  'MONTH_DAYS_REGULAR',
  'MONTH_DAYS_LEAP',
  'MONTH_DAYS_REGULAR_CUMULATIVE',
  'MONTH_DAYS_LEAP_CUMULATIVE',
  'isLeapYear',
  'ydayFromDate',
  'arraySum',
  'addDays',
  'ERRNO_CODES',
  'ERRNO_MESSAGES',
  'setErrNo',
  'DNS',
  'Protocols',
  'Sockets',
  'timers',
  'warnOnce',
  'UNWIND_CACHE',
  'readEmAsmArgsArray',
  'getExecutableName',
  'keepRuntimeAlive',
  'wasmTable',
  'noExitRuntime',
  'freeTableIndexes',
  'functionsInTableMap',
  'setValue',
  'getValue',
  'PATH',
  'PATH_FS',
  'UTF8Decoder',
  'UTF8ArrayToString',
  'UTF8ToString',
  'stringToUTF8Array',
  'stringToUTF8',
  'lengthBytesUTF8',
  'intArrayFromString',
  'stringToAscii',
  'UTF16Decoder',
  'stringToNewUTF8',
  'writeArrayToMemory',
  'JSEvents',
  'specialHTMLTargets',
  'currentFullscreenStrategy',
  'restoreOldWindowedStyle',
  'ExitStatus',
  'getEnvStrings',
  'flush_NO_FILESYSTEM',
  'promiseMap',
  'uncaughtExceptionCount',
  'exceptionLast',
  'exceptionCaught',
  'ExceptionInfo',
  'findMatchingCatch',
  'getExceptionMessageCommon',
  'incrementExceptionRefcount',
  'decrementExceptionRefcount',
  'getExceptionMessage',
  'Browser',
  'wget',
  'SYSCALLS',
  'tempFixedLengthArray',
  'miniTempWebGLFloatBuffers',
  'miniTempWebGLIntBuffers',
  'GL',
  'emscripten_webgl_power_preferences',
  'AL',
  'GLUT',
  'EGL',
  'GLEW',
  'IDBStore',
  'SDL',
  'SDL_gfx',
  'allocateUTF8',
  'allocateUTF8OnStack',
];
unexportedSymbols.forEach(unexportedRuntimeSymbol);



var calledRun;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
};

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  _emscripten_stack_init();
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  writeStackCookie();
}

function run() {

  if (runDependencies > 0) {
    return;
  }

    stackCheckInit();

  preRun();

  // a preRun added a dependency, run will be called later
  if (runDependencies > 0) {
    return;
  }

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    if (calledRun) return;
    calledRun = true;
    Module['calledRun'] = true;

    if (ABORT) return;

    initRuntime();

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    assert(!Module['_main'], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
  checkStackCookie();
}

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = (x) => {
    has = true;
  }
  try { // it doesn't matter if it fails
    flush_NO_FILESYSTEM();
  } catch(e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.');
    warnOnce('(this may also be due to not including full filesystem support - try building with -sFORCE_FILESYSTEM)');
  }
}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

run();


// end include: postamble.js


	/*
 * (c) Copyright Ascensio System SIA 2010-2023
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-6 Ernesta Birznieka-Upish
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */

function CBinaryReader(data, start, size)
{
	this.data = data;
	this.pos = start;
	this.limit = start + size;
}
CBinaryReader.prototype.readByte = function()
{
	let val = this.data[this.pos];
	this.pos += 1;
	return val;
};
CBinaryReader.prototype.readShort = function()
{
	let val = this.data[this.pos] | this.data[this.pos + 1] << 8;
	this.pos += 2;
	return val;
};
CBinaryReader.prototype.readInt = function()
{
	let val = this.data[this.pos] | this.data[this.pos + 1] << 8 | this.data[this.pos + 2] << 16 | this.data[this.pos + 3] << 24;
	this.pos += 4;
	return val;
};
CBinaryReader.prototype.readDouble = function()
{
	return this.readInt() / 100;
};
CBinaryReader.prototype.readDouble2 = function()
{
	return this.readInt() / 10000;
};
CBinaryReader.prototype.readDouble3 = function()
{
	return this.readInt() / 100000;
};
CBinaryReader.prototype.readString = function()
{
	let len = this.readInt();
	let val = String.prototype.fromUtf8(this.data, this.pos, len);
	this.pos += len;
	return val;
};
CBinaryReader.prototype.readString2 = function()
{
	let len = this.readShort();
	let val = "";
	for (let i = 0; i < len; ++i)
	{
		let c = this.readShort();
		val += String.fromCharCode(c);
	}
	return val;
};
CBinaryReader.prototype.readData = function()
{
	let len = this.readInt() - 4;
	let val = this.data.slice(this.pos, this.pos + len);
	this.pos += len;
	return val;
};
CBinaryReader.prototype.isValid = function()
{
	return (this.pos < this.limit) ? true : false;
};
CBinaryReader.prototype.Skip = function(nPos)
{
	this.pos += nPos;
};

function CBinaryWriter()
{
	this.size = 100000;
	this.dataSize = 0;
	this.buffer = new Uint8Array(this.size);
}
CBinaryWriter.prototype.checkAlloc = function(addition)
{
	if ((this.dataSize + addition) <= this.size)
		return;

	let newSize = Math.max(this.size * 2, this.size + addition);
	let newBuffer = new Uint8Array(newSize);
	newBuffer.set(this.buffer, 0);

	this.size = newSize;
	this.buffer = newBuffer;
};
CBinaryWriter.prototype.writeUint = function(value)
{
	this.checkAlloc(4);
	let val = (value>2147483647)?value-4294967296:value;
	this.buffer[this.dataSize++] = (val) & 0xFF;
	this.buffer[this.dataSize++] = (val >>> 8) & 0xFF;
	this.buffer[this.dataSize++] = (val >>> 16) & 0xFF;
	this.buffer[this.dataSize++] = (val >>> 24) & 0xFF;
};
CBinaryWriter.prototype.writeString = function(value)
{
	let valueUtf8 = value.toUtf8();
	this.checkAlloc(valueUtf8.length);
	this.buffer.set(valueUtf8, this.dataSize);
	this.dataSize += valueUtf8.length;
};


	/*
 * (c) Copyright Ascensio System SIA 2010-2023
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-6 Ernesta Birznieka-Upish
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */

var UpdateFontsSource = {
	Undefined   : 0,
	Page        : 1,
	Annotation  : 2,
	Forms       : 4
};

function CFile()
{
	this.nativeFile = 0;
	this.stream = -1;
	this.stream_size = 0;
	this.type = -1;
	this.pages = [];
	this.info = null;
	this._isNeedPassword = false;

	// for async fonts loader
	this.fontPageIndex = -1;
	this.fontPageUpdateType = UpdateFontsSource.Undefined;
	this.fontStreams = {};

	this.scannedImages = {};
}

/*
 * (c) Copyright Ascensio System SIA 2010-2023
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-6 Ernesta Birznieka-Upish
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */

function CWasmPointer()
{
	this.ptr = 0;		
}
CWasmPointer.prototype.free = function()
{
	Module["_free"](this.ptr);
	this.ptr = 0;
};
CWasmPointer.prototype.getMemory = function(isCopy)
{
	if (!this.ptr)
		return null;
	
	let lenArr = new Int32Array(Module["HEAP8"].buffer, this.ptr, 1);
	if (!lenArr)
	{
		this.free();
		return null;
	}

	let len = lenArr[0];
	if (len <= 4)
	{
		this.free();
		return null;
	}

	len -= 4;
	
	let noCopyArray = new Uint8Array(Module["HEAP8"].buffer, this.ptr + 4, len);
	if (!isCopy)
		return noCopyArray;

	let copyArray = new Uint8Array(len);
	copyArray.set(noCopyArray);

	return copyArray;
};
CWasmPointer.prototype.getReader = function()
{
	let noCopyArray = this.getMemory(false);
	if (!noCopyArray)
		return null;
	
	return new CBinaryReader(noCopyArray, 0, noCopyArray.length);
};

var g_module_pointer = new CWasmPointer();

// js interface
CFile.prototype._free = function(ptr)
{
	Module["_free"](ptr);
};
CFile.prototype._getUint8Array = function(ptr, len)
{
	return new Uint8Array(Module["HEAP8"].buffer, ptr, len);
};
CFile.prototype._getUint8ClampedArray = function(ptr, len)
{
	return new Uint8ClampedArray(Module["HEAP8"].buffer, ptr, len);
};

// FILE
CFile.prototype._openFile = function(buffer, password)
{
	if (buffer)
	{
		let data = new Uint8Array(buffer);
		this.stream_size = data.length;
		this.stream = Module["_malloc"](this.stream_size);
		Module["HEAP8"].set(data, this.stream);
	}

	let passwordPtr = 0;
	if (password)
	{
		let passwordBuf = password.toUtf8();
		passwordPtr = Module["_malloc"](passwordBuf.length);
		Module["HEAP8"].set(passwordBuf, passwordPtr);
	}

	this.nativeFile = Module["_Open"](this.stream, this.stream_size, passwordPtr);

	if (passwordPtr)
		Module["_free"](passwordPtr);
	return this.nativeFile > 0 ? true : false;
};

CFile.prototype._closeFile = function()
{
	Module["_Close"](this.nativeFile);
};

CFile.prototype._getType = function()
{
	return Module["_GetType"](this.nativeFile);
};

CFile.prototype._getError = function()
{
	return Module["_GetErrorCode"](this.nativeFile);
};

CFile.prototype._SplitPages = function(memoryBuffer, arrayBufferChanges)
{
	let changesPtr = 0;
	let changesLen = 0;
	if (arrayBufferChanges)
	{
		let changes = new Uint8Array(arrayBufferChanges);
		changesLen = changes.length;
		changesPtr = Module["_malloc"](changesLen);
		Module["HEAP8"].set(changes, changesPtr);
	}

	let pointer = Module["_malloc"](memoryBuffer.length * 4);
	Module["HEAP32"].set(memoryBuffer, pointer >> 2);
	let ptr = Module["_SplitPages"](this.nativeFile, pointer, memoryBuffer.length, changesPtr, changesLen);
	Module["_free"](pointer);
	if (changesPtr)
		Module["_free"](changesPtr);

	g_module_pointer.ptr = ptr;
	return g_module_pointer;
};

CFile.prototype._MergePages = function(buffer, maxID, prefixForm)
{
	if (!buffer)
		return false;

	let data = (undefined !== buffer.byteLength) ? new Uint8Array(buffer) : buffer;
	let stream2 = Module["_malloc"](data.length);
	Module["HEAP8"].set(data, stream2);

	if (!maxID)
		maxID = 0;

	let prefixPtr = 0;
	if (prefixForm)
	{
		let prefixBuf = prefixForm.toUtf8();
		prefixPtr = Module["_malloc"](prefixBuf.length);
		Module["HEAP8"].set(prefixBuf, prefixPtr);
	}

	let bRes = Module["_MergePages"](this.nativeFile, stream2, data.length, maxID, prefixPtr);
	stream2 = 0; // Success or not, stream2 is either taken or freed

	if (prefixPtr)
		Module["_free"](prefixPtr);

	return bRes == 1;
};

CFile.prototype._UndoMergePages = function()
{
	return Module["_UnmergePages"](this.nativeFile) == 1;
};

CFile.prototype._RedactPage = function(pageIndex, arrRedactBox, arrayBufferFiller)
{
	let changesPtr = 0;
	let changesLen = 0;
	if (arrayBufferFiller)
	{
		let changes = new Uint8Array(arrayBufferFiller);
		changesLen = changes.length;
		changesPtr = Module["_malloc"](changesLen);
		Module["HEAP8"].set(changes, changesPtr);
	}

	let memoryBuffer = new Int32Array(arrRedactBox.length);
	for (let i = 0; i < arrRedactBox.length; i++)
        memoryBuffer[i] = Math.round(arrRedactBox[i] * 10000);

	let pointer = Module["_malloc"](memoryBuffer.length * 4);
	Module["HEAP32"].set(memoryBuffer, pointer >> 2);

	let bRes = Module["_RedactPage"](this.nativeFile, pageIndex, pointer, memoryBuffer.length / 8, changesPtr, changesLen);
	changesPtr = 0; // Success or not, changesPtr is either taken or freed

	Module["_free"](pointer);

	return bRes == 1;
};

CFile.prototype._UndoRedact = function()
{
	return Module["_UndoRedact"](this.nativeFile) == 1;
};

// FONTS
CFile.prototype._isNeedCMap = function()
{
	let isNeed = Module["_IsNeedCMap"](this.nativeFile);
	return (isNeed === 1) ? true : false;
};

CFile.prototype._setCMap = function(memoryBuffer)
{
	let pointer = Module["_malloc"](memoryBuffer.length);
	Module.HEAP8.set(memoryBuffer, pointer);
	Module["_SetCMapData"](this.nativeFile, pointer, memoryBuffer.length);
};

CFile.prototype._getFontByID = function(ID)
{
	if (ID === undefined)
		return null;

	let idBuffer = ID.toUtf8();
	let idPointer = Module["_malloc"](idBuffer.length);
	Module["HEAP8"].set(idBuffer, idPointer);
	g_module_pointer.ptr = Module["_GetFontBinary"](this.nativeFile, idPointer);
	Module["_free"](idPointer);

	let reader = g_module_pointer.getReader();
	if (!reader)
		return null;

	let nFontLength = reader.readInt();
	let np1 = reader.readInt();
	let np2 = reader.readInt();
	let pFontPointer = np2 << 32 | np1;

	let res = new Uint8Array(Module["HEAP8"].buffer, pFontPointer, nFontLength);
	g_module_pointer.free();
	return res;
};

CFile.prototype._getInteractiveFormsFonts = function(type)
{
	g_module_pointer.ptr = Module["_GetInteractiveFormsFonts"](this.nativeFile, type);
	return g_module_pointer;
};

// INFO DOCUMENT
CFile.prototype._getInfo = function()
{
	g_module_pointer.ptr = Module["_GetInfo"](this.nativeFile);
	return g_module_pointer;
};

CFile.prototype._getStructure = function()
{
	g_module_pointer.ptr = Module["_GetStructure"](this.nativeFile);
	return g_module_pointer;
};

CFile.prototype._getLinks = function(pageIndex)
{
	g_module_pointer.ptr = Module["_GetLinks"](this.nativeFile, pageIndex);
	return g_module_pointer;
};

// WIDGETS & ANNOTATIONS
CFile.prototype._getInteractiveFormsInfo = function()
{
	g_module_pointer.ptr = Module["_GetInteractiveFormsInfo"](this.nativeFile);
	return g_module_pointer;
};

CFile.prototype._getAnnotationsInfo = function(pageIndex)
{
	g_module_pointer.ptr = Module["_GetAnnotationsInfo"](this.nativeFile, pageIndex === undefined ? -1 : pageIndex);
	return g_module_pointer;
};

CFile.prototype._getButtonIcons = function(backgroundColor, pageIndex, isBase64, nWidget, nView)
{
	g_module_pointer.ptr = Module["_GetButtonIcons"](this.nativeFile, 
		backgroundColor === undefined ? 0xFFFFFF : backgroundColor, 
		pageIndex, 
		isBase64 ? 1 : 0, 
		nWidget === undefined ? -1 : nWidget, 
		nView);
	return g_module_pointer;
};

CFile.prototype._getAnnotationsAP = function(width, height, backgroundColor, pageIndex, nAnnot, nView)
{
	g_module_pointer.ptr = Module["_GetAnnotationsAP"](this.nativeFile, 
		width, 
		height,
		backgroundColor === undefined ? 0xFFFFFF : backgroundColor,
		pageIndex,
		nAnnot === undefined ? -1 : nAnnot,
		nView);
	return g_module_pointer;
};

CFile.prototype._getInteractiveFormsAP = function(width, height, backgroundColor, pageIndex, nWidget, nView, nButtonView)
{
	g_module_pointer.ptr = Module["_GetInteractiveFormsAP"](this.nativeFile, 
		width, 
		height,
		backgroundColor === undefined ? 0xFFFFFF : backgroundColor,
		pageIndex,
		nWidget === undefined ? -1 : nWidget,
		nView, nButtonView);
	return g_module_pointer;
};

// SCAN PAGES
CFile.prototype._scanPage = function(page, mode)
{
	g_module_pointer.ptr = Module["_ScanPage"](this.nativeFile, page, (mode === undefined) ? 0 : mode);
	return g_module_pointer;
};

CFile.prototype._getImageBase64 = function(rId)
{
	let strPtr = Module["_GetImageBase64"](this.nativeFile, rId);
	if (0 == strPtr)
		return "error";
	let len = Module["_GetImageBase64Len"](strPtr);
	let ptr = Module["_GetImageBase64Ptr"](strPtr);

	var buffer = new Uint8Array(Module["HEAP8"].buffer, ptr, len);
	let result = String.prototype.fromUtf8(buffer, 0, len);
	Module["_GetImageBase64Free"](strPtr);
	return result;
};

// TEXT
CFile.prototype._getGlyphs = function(pageIndex)
{
	let ptr = Module["_GetGlyphs"](this.nativeFile, pageIndex);
	if (!ptr)
		return null;

	let ptrArray = new Int32Array(Module["HEAP8"].buffer, ptr, 5);
	let len = ptrArray[0];
	len -= 20;

	let res = {};
	res.info = [ptrArray[1], ptrArray[2], ptrArray[3], ptrArray[4]];

	if (len > 0)
	{
		let textCommandsSrc = new Uint8Array(Module["HEAP8"].buffer, ptr + 20, len);
		res.result = new Uint8Array(len);
		res.result.set(textCommandsSrc);
	}
	else
		res.result = [];

	return res;
};

CFile.prototype._destroyTextInfo = function()
{
	Module["_DestroyTextInfo"]();
};

// RASTER
CFile.prototype._getPixmap = function(pageIndex, width, height, backgroundColor)
{
	return Module["_GetPixmap"](this.nativeFile, pageIndex, width, height, backgroundColor === undefined ? 0xFFFFFF : backgroundColor);
};

// STATIC FUNCTIONS
CFile.prototype._InitializeFonts = function(basePath) 
{
	if (undefined !== basePath && "" !== basePath)
		baseFontsPath = basePath;
	if (!window["g_fonts_selection_bin"])
		return;
	let memoryBuffer = window["g_fonts_selection_bin"].toUtf8();
	let pointer = Module["_malloc"](memoryBuffer.length);
	Module.HEAP8.set(memoryBuffer, pointer);
	Module["_InitializeFontsBase64"](pointer, memoryBuffer.length);
	Module["_free"](pointer);
	delete window["g_fonts_selection_bin"];

	// ranges
	let rangesBuffer = new CBinaryWriter();
	let ranges = AscFonts.getSymbolRanges();

	let rangesCount = ranges.length;
	rangesBuffer.writeUint(rangesCount);
	for (let i = 0; i < rangesCount; i++)
	{
		rangesBuffer.writeString(ranges[i].getName());
		rangesBuffer.writeUint(ranges[i].getStart());
		rangesBuffer.writeUint(ranges[i].getEnd());
	}

	let rangesFinalLen = rangesBuffer.dataSize;
	let rangesFinal = new Uint8Array(rangesBuffer.buffer.buffer, 0, rangesFinalLen);
	pointer = Module["_malloc"](rangesFinalLen);
	Module.HEAP8.set(rangesFinal, pointer);
	Module["_InitializeFontsRanges"](pointer, rangesFinalLen);
	Module["_free"](pointer);
};

CFile.prototype._CheckStreamId = function(data, status) 
{
	let drawingFile = self.drawingFile;
	if (!drawingFile)
		return;

	let lenArray = new Int32Array(Module["HEAP8"].buffer, data, 4);
	let len = lenArray[0];
	len -= 4;

	let buffer = new Uint8Array(Module["HEAP8"].buffer, data + 4, len);
	let reader = new CBinaryReader(buffer, 0, len);

	let name = reader.readString();
	let style = 0;
	if (reader.readInt() != 0)
		style |= 1;//AscFonts.FontStyle.FontStyleBold;
	if (reader.readInt() != 0)
		style |= 2;//AscFonts.FontStyle.FontStyleItalic;

	let file = AscFonts.pickFont(name, style);
	let fileId = file.GetID();
	let fileStatus = file.GetStatus();

	if (fileStatus === 0)
	{
		// font was loaded
		fontToMemory(file, true);
	}
	else
	{
		drawingFile.fontStreams[fileId] = drawingFile.fontStreams[fileId] || {};
		drawingFile.fontStreams[fileId].pages = drawingFile.fontStreams[fileId].pages || [];
		addToArrayAsDictionary(drawingFile.fontStreams[fileId].pages, drawingFile.fontPageIndex);
		addToArrayAsDictionary(drawingFile.pages[drawingFile.fontPageIndex].fonts, fileId);

		drawingFile.pages[drawingFile.fontPageIndex].fontsUpdateType |= drawingFile.fontPageUpdateType;

		// font can be loading in editor
		if (undefined === file.externalCallback)
		{
			let _t = file;
			file.externalCallback = function() {
				fontToMemory(_t, true);

				let pages = drawingFile.fontStreams[fileId].pages;
				delete drawingFile.fontStreams[fileId];

				let pagesRepaint_Page        = [];
				let pagesRepaint_Annotation  = [];
				let pagesRepaint_Forms       = [];

				for (let i = 0, len = pages.length; i < len; i++)
				{
					let pageNum = pages[i];
					let pageObj = drawingFile.pages[pageNum];
					let fonts = pageObj.fonts;
					
					for (let j = 0, len_fonts = fonts.length; j < len_fonts; j++)
					{
						if (fonts[j] == fileId)
						{
							fonts.splice(j, 1);
							break;
						}
					}

					if (0 == fonts.length)
					{
						if (pageObj.fontsUpdateType & UpdateFontsSource.Page)
							pagesRepaint_Page.push(pageNum);

						if (pageObj.fontsUpdateType & UpdateFontsSource.Annotation)
							pagesRepaint_Annotation.push(pageNum);

						if (pageObj.fontsUpdateType & UpdateFontsSource.Forms)
							pagesRepaint_Forms.push(pageNum);

						pageObj.fontsUpdateType = UpdateFontsSource.Undefined;
					}
				}

				if (pagesRepaint_Page.length > 0 && drawingFile.onRepaintPages)
					drawingFile.onRepaintPages(pagesRepaint_Page);

				if (pagesRepaint_Annotation.length > 0 && drawingFile.onRepaintAnnotations)
					drawingFile.onRepaintAnnotations(pagesRepaint_Annotation);

				if (pagesRepaint_Forms.length > 0 && drawingFile.onRepaintForms)
					drawingFile.onRepaintForms(pagesRepaint_Forms);

				delete _t.externalCallback;
			};

			if (2 !== file.LoadFontAsync)
				file.LoadFontAsync(baseFontsPath, null);
		}
	}

	let memoryBuffer = fileId.toUtf8();
	let pointer = Module["_malloc"](memoryBuffer.length);
	Module.HEAP8.set(memoryBuffer, pointer);
	Module["HEAP8"][status] = (fileStatus == 0) ? 1 : 0;
	return pointer;
};


CFile.prototype.lockPageNumForFontsLoader = function(pageIndex, type)
{
	this.fontPageIndex = pageIndex;
	this.fontPageUpdateType = type;
};
CFile.prototype.unlockPageNumForFontsLoader = function()
{
	this.fontPageIndex = -1;
	drawingFile.fontPageUpdateType = UpdateFontsSource.Undefined;
};

CFile.prototype["getPages"] = function()
{
	return this.pages;
};

CFile.prototype["openForms"] = function()
{
};

CFile.prototype["getDocumentInfo"] = function()
{
	return this.info;
};

CFile.prototype["getStartID"] = function()
{
	return this.StartID;
};

// FILE
CFile.prototype["loadFromData"] = function(arrayBuffer)
{
	let isSuccess = this._openFile(arrayBuffer);
	let error = this._getError(); // 0 - ok, 4 - password, else: error
	this.type = this._getType();

	self.drawingFile = this;
	if (!error)
		this.getInfo();
	this._isNeedPassword = (4 === error) ? true : false;
	return error;
};
CFile.prototype["loadFromDataWithPassword"] = function(password)
{
	if (0 != this.nativeFile)
		this._closeFile();

	let isSuccess = this._openFile(undefined, password);
	let error = this._getError(); // 0 - ok, 4 - password, else: error
	this.type = this._getType();

	self.drawingFile = this;
	if (!error)
		this.getInfo();
	this._isNeedPassword = (4 === error) ? true : false;
	return error;
};

CFile.prototype["getType"] = function()
{
	return this.type;
};

CFile.prototype["close"] = function()
{
	this._closeFile();
	this.nativeFile = 0;
	this.pages = [];
	this.info = null;
	this.StartID = null;
	if (this.stream > 0)
		this._free(this.stream);
	this.stream = -1;
	self.drawingFile = null;
};

CFile.prototype["getFileBinary"] = function()
{
	if (0 >= this.stream)
		return "";
	return new Uint8Array(Module["HEAP8"].buffer, this.stream, this.stream_size);
};

CFile.prototype["isNeedPassword"] = function()
{
	return this._isNeedPassword;
};
CFile.prototype["SplitPages"] = function(arrOriginIndex, arrayBufferChanges)
{
	let ptr = this._SplitPages(arrOriginIndex, arrayBufferChanges);
	let res = ptr.getMemory(true);
	ptr.free();
	return res;
};
CFile.prototype["MergePages"] = function(arrayBuffer, maxID, prefixForm)
{
	return this._MergePages(arrayBuffer, maxID, prefixForm);
};
CFile.prototype["UndoMergePages"] = function()
{
	return this._UndoMergePages();
};
CFile.prototype["RedactPage"] = function(originIndex, arrRedactBox, arrayBufferFiller)
{
	return this._RedactPage(originIndex, arrRedactBox, arrayBufferFiller);
};
CFile.prototype["UndoRedact"] = function()
{
	return this._UndoRedact();
};

// INFO DOCUMENT
CFile.prototype.getInfo = function()
{
	if (!this.nativeFile)
		return false;

	let ptr = this._getInfo();
	let reader = ptr.getReader();
	if (!reader) return false;

	this.StartID = reader.readInt();

	let _pages = reader.readInt();
	for (let i = 0; i < _pages; i++)
	{
		let rec = {};
		rec["W"] = reader.readInt();
		rec["H"] = reader.readInt();
		rec["Dpi"] = reader.readInt();
		rec["Rotate"] = reader.readInt();
		rec["originIndex"] = i;
		rec.fonts = [];
		rec.fontsUpdateType = UpdateFontsSource.Undefined;
		rec.text = null;
		this.pages.push(rec);
	}
	let json_info = reader.readString();
	try
	{
		this.info = JSON.parse(json_info);
	} catch(err) {}

	ptr.free();
	return this.pages.length > 0;
};
CFile.prototype.getPagesInfo = function()
{
	if (!this.nativeFile)
		return [];

	let ptr = this._getInfo();
	let reader = ptr.getReader();
	if (!reader) return [];

	// change StartID
	this.StartID = reader.readInt();

	let _pages = [];
	let nPages = reader.readInt();
	for (let i = 0; i < nPages; i++)
	{
		let rec = {};
		rec["W"] = reader.readInt();
		rec["H"] = reader.readInt();
		rec["Dpi"] = reader.readInt();
		rec["Rotate"] = reader.readInt();
		rec["originIndex"] = i;
		rec.fonts = [];
		rec.fontsUpdateType = UpdateFontsSource.Undefined;
		rec.text = null;
		_pages.push(rec);
	}
	// skip json_info

	ptr.free();
	return _pages;
};

CFile.prototype["getStructure"] = function()
{
	let ptr = this._getStructure();
	let reader = ptr.getReader();

	if (!reader) return [];

	let res = [];
	while (reader.isValid())
	{
		let rec = {};
		rec["page"]  = reader.readInt();
		rec["level"] = reader.readInt();
		rec["y"]  = reader.readDouble();
		rec["description"] = reader.readString();
		res.push(rec);
	}

	ptr.free();
	return res;
};

CFile.prototype["getLinks"] = function(originIndex)
{
	let ptr = this._getLinks(originIndex);
	let reader = ptr.getReader();

	if (!reader) return [];

	let res = [];
	while (reader.isValid())
	{
		let rec = {};
		rec["link"] = reader.readString();
		rec["dest"] = reader.readDouble();
		rec["x"] = reader.readDouble();
		rec["y"] = reader.readDouble();
		rec["w"] = reader.readDouble();
		rec["h"] = reader.readDouble();
		res.push(rec);
	}

	ptr.free();
	return res;
};

// TEXT
CFile.prototype["getGlyphs"] = function(originIndex)
{
	let pageIndex = this.pages.findIndex(function(page) {
		return page.originIndex == originIndex;
	});
	let page = this.pages[pageIndex];
	if (page.fonts.length > 0)
	{
		// waiting fonts
		return null;
	}

	this.lockPageNumForFontsLoader(pageIndex, UpdateFontsSource.Page);
	let res = this._getGlyphs(originIndex);
	// there is no need to delete the result; this buffer is used as a text buffer 
	// for text commands on other pages. After receiving ALL text pages, 
	// you need to call destroyTextInfo()
	this.unlockPageNumForFontsLoader();

	if (page.fonts.length > 0)
	{
		// waiting fonts
		res = null;
		return null;
	}

	if (res && this.onUpdateStatistics)
		this.onUpdateStatistics(res.info[0], res.info[1], res.info[2], res.info[3]);

	return res.result || null;
};
CFile.prototype["destroyTextInfo"] = function()
{
	this._destroyTextInfo();
};

// FONTS
CFile.prototype.getWidgetFonts = function(type)
{
	let ptr = this._getInteractiveFormsFonts(type);
	let reader = ptr.getReader();
	if (!reader) return [];

	let res = [];
	while (reader.isValid())
	{
		let n = reader.readInt();
		for (let i = 0; i < n; ++i)
			res.push(reader.readString());
	}

	ptr.free();
	return res;
};

CFile.prototype["getInteractiveFormsEmbeddedFonts"] = function()
{
	return this.getWidgetFonts(1);
};

CFile.prototype["getInteractiveFormsStandardFonts"] = function()
{
	return this.getWidgetFonts(2);
};

CFile.prototype["getFontByID"] = function(ID)
{
	return this._getFontByID(ID);
};

CFile.prototype["setCMap"] = function(memoryBuffer)
{
	if (!this.nativeFile)
		return;

	this._setCMap(memoryBuffer);
};

CFile.prototype["isNeedCMap"] = function()
{
	return this._isNeedCMap();
};

// WIDGETS & ANNOTATIONS
function readAction(reader, rec, readDoubleFunc, readStringFunc)
{
	let SType = reader.readByte();
	// 0 - Unknown, 1 - GoTo, 2 - GoToR, 3 - GoToE, 4 - Launch
	// 5 - Thread, 6 - URI, 7 - Sound, 8 - Movie, 9 - Hide
	// 10 - Named, 11 - SubmitForm, 12 - ResetForm, 13 - ImportData
	// 14 - JavaScript, 15 - SetOCGState, 16 - Rendition
	// 17 - Trans, 18 - GoTo3DView
	rec["S"] = SType;
	if (SType == 14)
	{
		rec["JS"] = readStringFunc.call(reader);
	}
	else if (SType == 1)
	{
		rec["page"] = reader.readInt();
		rec["kind"] = reader.readByte();
		// 0 - XYZ
		// 1 - Fit
		// 2 - FitH
		// 3 - FitV
		// 4 - FitR
		// 5 - FitB
		// 6 - FitBH
		// 7 - FitBV
		switch (rec["kind"])
		{
			case 0:
			case 2:
			case 3:
			case 6:
			case 7:
			{
				let nFlag = reader.readByte();
				if (nFlag & (1 << 0))
					rec["left"] = readDoubleFunc.call(reader);
				if (nFlag & (1 << 1))
					rec["top"]  = readDoubleFunc.call(reader);
				if (nFlag & (1 << 2))
					rec["zoom"] = readDoubleFunc.call(reader);
				break;
			}
			case 4:
			{
				rec["left"]   = readDoubleFunc.call(reader);
				rec["bottom"] = readDoubleFunc.call(reader);
				rec["right"]  = readDoubleFunc.call(reader);
				rec["top"]    = readDoubleFunc.call(reader);
				break;
			}
			case 1:
			case 5:
			default:
				break;
		}
	}
	else if (SType == 10)
	{
		rec["N"] = readStringFunc.call(reader);
	}
	else if (SType == 6)
	{
		rec["URI"] = readStringFunc.call(reader);
	}
	else if (SType == 9)
	{
		rec["H"] = reader.readByte();
		let m = reader.readInt();
	    rec["T"] = [];
		// array of annotation names - rec["name"]
	    for (let j = 0; j < m; ++j)
			rec["T"].push(readStringFunc.call(reader));
	}
	else if (SType == 12)
	{
		rec["Flags"] = reader.readInt();
		let m = reader.readInt();
	    rec["Fields"] = [];
		// array of annotation names - rec["name"]
	    for (let j = 0; j < m; ++j)
			rec["Fields"].push(readStringFunc.call(reader));
	}
	let NextAction = reader.readByte();
	if (NextAction)
	{
		rec["Next"] = {};
		readAction(reader, rec["Next"], readDoubleFunc, readStringFunc);
	}
}
function readAnnot(reader, rec, readDoubleFunc, readDouble2Func, readStringFunc, isRead = false)
{
	rec["AP"] = {};
	// Annot
	// number for relations with AP
	rec["AP"]["i"] = reader.readInt();
	rec["annotflag"] = reader.readInt();
	// 12.5.3
	let bHidden = (rec["annotflag"] >> 1) & 1; // Hidden
	let bPrint = (rec["annotflag"] >> 2) & 1; // Print
	rec["noZoom"] = (rec["annotflag"] >> 3) & 1; // NoZoom
	rec["noRotate"] = (rec["annotflag"] >> 4) & 1; // NoRotate
	let bNoView = (rec["annotflag"] >> 5) & 1; // NoView
	rec["locked"] = (rec["annotflag"] >> 7) & 1; // Locked
	rec["ToggleNoView"] = (rec["annotflag"] >> 8) & 1; // ToggleNoView
	rec["lockedC"] = (rec["annotflag"] >> 9) & 1; // LockedContents
	// 0 - visible, 1 - hidden, 2 - noPrint, 3 - noView
	rec["display"] = 0;
	if (bHidden)
		rec["display"] = 1;
	else
	{
		if (bPrint)
		{
			if (bNoView)
				rec["display"] = 3;
			else
				rec["display"] = 0;
		}
		else
		{
			if (bNoView)
				rec["display"] = 0; // ??? no hidden, but noView and no print
			else
				rec["display"] = 2;
		}
	}
	rec["page"] = reader.readInt();
	// offsets like getStructure and viewer.navigate
	rec["rect"] = {};
	rec["rect"]["x1"] = readDouble2Func.call(reader);
	rec["rect"]["y1"] = readDouble2Func.call(reader);
	rec["rect"]["x2"] = readDouble2Func.call(reader);
	rec["rect"]["y2"] = readDouble2Func.call(reader);
	let flags = reader.readInt();
	// Unique name - NM
	if (flags & (1 << 0))
		rec["UniqueName"] = readStringFunc.call(reader);
	// Alternate annotation text - Contents
	if (flags & (1 << 1))
		rec["Contents"] = readStringFunc.call(reader);
	// Border effect - BE
	if (flags & (1 << 2))
	{
		rec["BE"] = {};
		rec["BE"]["S"] = reader.readByte();
		rec["BE"]["I"] = readDoubleFunc.call(reader);
	}
	// Special annotation color - С
	if (flags & (1 << 3))
	{
		let n = reader.readInt();
		rec["C"] = [];
		for (let i = 0; i < n; ++i)
			rec["C"].push(readDouble2Func.call(reader));
	}
	// Border/BS
	if (flags & (1 << 4))
	{
		// 0 - solid, 1 - beveled, 2 - dashed, 3 - inset, 4 - underline
		rec["border"] = reader.readByte();
		rec["borderWidth"] = readDoubleFunc.call(reader);
		// Border Dash Pattern
		if (rec["border"] == 2)
		{
			let n = reader.readInt();
			rec["dashed"] = [];
			for (let i = 0; i < n; ++i)
				rec["dashed"].push(readDoubleFunc.call(reader));
		}
	}
	// Date of last change - M
	if (flags & (1 << 5))
		rec["LastModified"] = readStringFunc.call(reader);
	// AP
	if (flags & (1 << 6))
	{
		if (isRead)
			rec["AP"]["render"] = reader.readData(); // TODO use Render - Uint8Array
		else
			rec["AP"]["have"] = (flags >> 6) & 1;
	}
	// User ID
	if (flags & (1 << 7))
		rec["OUserID"] = readStringFunc.call(reader);
	// if (flags & (1 << 8))
	// 	reader.readInt();
	if (flags & (1 << 9))
		rec["meta"] = readStringFunc.call(reader);
}
function readAnnotAP(reader, AP)
{
	// number for relations with AP
	AP["i"] = reader.readInt();
	AP["x"] = reader.readDouble();
	AP["y"] = reader.readDouble();
	AP["w"] = reader.readInt();
	AP["h"] = reader.readInt();
	let n = reader.readInt();
	for (let i = 0; i < n; ++i)
	{
		let APType = reader.readString();
		if (!AP[APType])
			AP[APType] = {};
		let APi = AP[APType];
		let ASType = reader.readString();
		if (ASType)
		{
			AP[APType][ASType] = {};
			APi = AP[APType][ASType];
		}
		let np1 = reader.readInt();
		let np2 = reader.readInt();
		// this memory needs to be deleted
		APi["retValue"] = np2 << 32 | np1;
		// 0 - Normal, 1 - Multiply, 2 - Screen, 3 - Overlay, 4 - Darken, 5 - Lighten, 6 - ColorDodge, 7 - ColorBurn, 8 - HardLight,
		// 9 - SoftLight, 10 - Difference, 11 - Exclusion, 12 - Hue, 13 - Saturation, 14 - Color, 15 - Luminosity
		APi["BlendMode"] = reader.readByte();
	}
}
function readAnnotType(reader, rec, readDoubleFunc, readDouble2Func, readStringFunc, isRead = false)
{
	// Markup
	let flags = 0;
	if ((rec["type"] < 18 && rec["type"] != 1 && rec["type"] != 15) || rec["type"] == 25)
	{
		flags = reader.readInt();
		if (flags & (1 << 0))
			rec["Popup"] = reader.readInt();
		// T
		if (flags & (1 << 1))
			rec["User"] = readStringFunc.call(reader);
		// CA
		if (flags & (1 << 2))
			rec["CA"] = readDoubleFunc.call(reader);
		// RC
		if (flags & (1 << 3))
		{
			let n = reader.readInt();
			rec["RC"] = [];
			for (let i = 0; i < n; ++i)
			{
				let oFont = {};
				// 0 - left, 1 - centered, 2 - right, 3 - justify
				oFont["alignment"] = reader.readByte();
				let nFontFlag = reader.readInt();
				oFont["bold"] = (nFontFlag >> 0) & 1;
				oFont["italic"] = (nFontFlag >> 1) & 1;
				oFont["strikethrough"] = (nFontFlag >> 3) & 1;
				oFont["underlined"] = (nFontFlag >> 4) & 1;
				if (nFontFlag & (1 << 5))
					oFont["vertical"] = readDoubleFunc.call(reader);
				if (nFontFlag & (1 << 6))
					oFont["actual"] = readStringFunc.call(reader);
				oFont["size"] = readDoubleFunc.call(reader);
				oFont["color"] = [];
				oFont["color"].push(readDouble2Func.call(reader));
				oFont["color"].push(readDouble2Func.call(reader));
				oFont["color"].push(readDouble2Func.call(reader));
				oFont["name"] = readStringFunc.call(reader);
				oFont["text"] = readStringFunc.call(reader);
				rec["RC"].push(oFont);
			}
		}
		// CreationDate
		if (flags & (1 << 4))
			rec["CreationDate"] = readStringFunc.call(reader);
		// IRT
		if (flags & (1 << 5))
			rec["RefTo"] = reader.readInt();
		// RT
		// 0 - R, 1 - Group
		if (flags & (1 << 6))
			rec["RefToReason"] = reader.readByte();
		// Subj
		if (flags & (1 << 7))
			rec["Subj"] = readStringFunc.call(reader);
	}
	// Text
	if (rec["type"] == 0)
	{
		// Background color - C->IC
		if (rec["C"])
		{
			rec["IC"] = rec["C"];
			delete rec["C"];
		}
		rec["Open"] = (flags >> 15) & 1;
		// icon - Name
		// 0 - Check, 1 - Checkmark, 2 - Circle, 3 - Comment, 4 - Cross, 5 - CrossHairs, 6 - Help, 7 - Insert, 8 - Key, 9 - NewParagraph, 10 - Note, 11 - Paragraph, 12 - RightArrow, 13 - RightPointer, 14 - Star, 15 - UpArrow, 16 - UpLeftArrow
		if (flags & (1 << 16))
			rec["Icon"] = reader.readByte();
		// StateModel
		// 0 - Marked, 1 - Review
		if (flags & (1 << 17))
			rec["StateModel"] = reader.readByte();
		// State
		// 0 - Marked, 1 - Unmarked, 2 - Accepted, 3 - Rejected, 4 - Cancelled, 5 - Completed, 6 - None
		if (flags & (1 << 18))
			rec["State"] = reader.readByte();
		
	}
	// Line
	else if (rec["type"] == 3)
	{
		// L
		rec["L"] = [];
		for (let i = 0; i < 4; ++i)
			rec["L"].push(readDoubleFunc.call(reader));
		// LE
		// 0 - Square, 1 - Circle, 2 - Diamond, 3 - OpenArrow, 4 - ClosedArrow, 5 - None, 6 - Butt, 7 - ROpenArrow, 8 - RClosedArrow, 9 - Slash
		if (flags & (1 << 15))
		{
			rec["LE"] = [];
			rec["LE"].push(reader.readByte());
			rec["LE"].push(reader.readByte());
		}
		// IC
		if (flags & (1 << 16))
		{
			let n = reader.readInt();
			rec["IC"] = [];
			for (let i = 0; i < n; ++i)
				rec["IC"].push(readDouble2Func.call(reader));
		}
		// LL
		if (flags & (1 << 17))
			rec["LL"] = readDoubleFunc.call(reader);
		// LLE
		if (flags & (1 << 18))
			rec["LLE"] = readDoubleFunc.call(reader);
		// Cap
		rec["Cap"] = (flags >> 19) & 1;
		// IT
		// 0 - LineDimension, 1 - LineArrow
		if (flags & (1 << 20))
			rec["IT"] = reader.readByte();
		// LLO
		if (flags & (1 << 21))
			rec["LLO"] = readDoubleFunc.call(reader);
		// CP
		// 0 - Inline, 1 - Top
		if (flags & (1 << 22))
			rec["CP"] = reader.readByte();
		// CO
		if (flags & (1 << 23))
		{
			rec["CO"] = [];
			rec["CO"].push(readDoubleFunc.call(reader));
			rec["CO"].push(readDoubleFunc.call(reader));
		}
	}
	// Ink
	else if (rec["type"] == 14)
	{
		// offsets like getStructure and viewer.navigate
		let n = reader.readInt();
		rec["InkList"] = [];
		for (let i = 0; i < n; ++i)
		{
			rec["InkList"][i] = [];
			let m = reader.readInt();
			for (let j = 0; j < m; ++j)
				rec["InkList"][i].push(readDoubleFunc.call(reader));
		}
	}
	// Highlight, Underline, Squiggly, Strikeout
	else if (rec["type"] > 7 && rec["type"] < 12)
	{
		// QuadPoints
		let n = reader.readInt();
		rec["QuadPoints"] = [];
		for (let i = 0; i < n; ++i)
			rec["QuadPoints"].push(readDoubleFunc.call(reader));
	}
	// Square, Circle
	else if (rec["type"] == 4 || rec["type"] == 5)
	{
		// Rect and RD differences
		if (flags & (1 << 15))
		{
			rec["RD"] = [];
			for (let i = 0; i < 4; ++i)
				rec["RD"].push(readDoubleFunc.call(reader));
		}
		// IC
		if (flags & (1 << 16))
		{
			let n = reader.readInt();
			rec["IC"] = [];
			for (let i = 0; i < n; ++i)
				rec["IC"].push(readDouble2Func.call(reader));
		}
	}
	// Polygon, PolyLine
	else if (rec["type"] == 6 || rec["type"] == 7)
	{
		let nVertices = reader.readInt();
		rec["Vertices"] = [];
		for (let i = 0; i < nVertices; ++i)
			rec["Vertices"].push(readDoubleFunc.call(reader));
		// LE
		// 0 - Square, 1 - Circle, 2 - Diamond, 3 - OpenArrow, 4 - ClosedArrow, 5 - None, 6 - Butt, 7 - ROpenArrow, 8 - RClosedArrow, 9 - Slash
		if (flags & (1 << 15))
		{
			rec["LE"] = [];
			rec["LE"].push(reader.readByte());
			rec["LE"].push(reader.readByte());
		}
		// IC
		if (flags & (1 << 16))
		{
			let n = reader.readInt();
			rec["IC"] = [];
			for (let i = 0; i < n; ++i)
				rec["IC"].push(readDouble2Func.call(reader));
		}
		// IT
		// 0 - PolygonCloud, 1 - PolyLineDimension, 2 - PolygonDimension
		if (flags & (1 << 20))
			rec["IT"] = reader.readByte();
	}
	// Popup
	else if (rec["type"] == 15)
	{
		flags = reader.readInt();
		rec["Open"] = (flags >> 0) & 1;
		// Link to parent-annotation
		if (flags & (1 << 1))
			rec["PopupParent"] = reader.readInt();
	}
	// FreeText
	else if (rec["type"] == 2)
	{
		// Background color - C->IC
		if (!isRead && rec["C"])
		{
			rec["IC"] = rec["C"];
			delete rec["C"];
		}
		// 0 - left-justified, 1 - centered, 2 - right-justified
		rec["alignment"] = reader.readByte();
		rec["Rotate"] = reader.readInt();
		// Rect and RD differences
		if (flags & (1 << 15))
		{
			rec["RD"] = [];
			for (let i = 0; i < 4; ++i)
				rec["RD"].push(readDoubleFunc.call(reader));
		}
		// CL
		if (flags & (1 << 16))
		{
			let n = reader.readInt();
			rec["CL"] = [];
			for (let i = 0; i < n; ++i)
				rec["CL"].push(readDoubleFunc.call(reader));
		}
		// Default style (CSS2 format) - DS
		if (flags & (1 << 17))
			rec["defaultStyle"] = readStringFunc.call(reader);
		// LE
		// 0 - Square, 1 - Circle, 2 - Diamond, 3 - OpenArrow, 4 - ClosedArrow, 5 - None, 6 - Butt, 7 - ROpenArrow, 8 - RClosedArrow, 9 - Slash
		if (flags & (1 << 18))
			rec["LE"] = reader.readByte();
		// IT
		// 0 - FreeText, 1 - FreeTextCallout, 2 - FreeTextTypeWriter
		if (flags & (1 << 20))
			rec["IT"] = reader.readByte();
		// Border color - from DA (write to C)
		if (flags & (1 << 21))
		{
			let n = reader.readInt();
			if (isRead)
			{
				rec["IC"] = [];
				for (let i = 0; i < n; ++i)
					rec["IC"].push(readDouble2Func.call(reader));
			}
			else
			{
				rec["C"] = [];
				for (let i = 0; i < n; ++i)
					rec["C"].push(readDouble2Func.call(reader));
			}
		}
	}
	// Caret
	else if (rec["type"] == 13)
	{
		// Rect and RD differenses
		if (flags & (1 << 15))
		{
			rec["RD"] = [];
			for (let i = 0; i < 4; ++i)
				rec["RD"].push(readDoubleFunc.call(reader));
		}
		// Sy
		// 0 - None, 1 - P, 2 - S
		if (flags & (1 << 16))
			rec["Sy"] = reader.readByte();
	}
	// FileAttachment
	else if (rec["type"] == 16)
	{
		if (flags & (1 << 15))
			rec["Icon"] = readStringFunc.call(reader);
		if (flags & (1 << 16))
			rec["FS"] = readStringFunc.call(reader);
		if (flags & (1 << 17))
		{
			rec["F"] = {};
			rec["F"]["FileName"] = readStringFunc.call(reader);
		}
		if (flags & (1 << 18))
		{
			rec["UF"] = {};
			rec["UF"]["FileName"] = readStringFunc.call(reader);
		}
		if (flags & (1 << 19))
		{
			rec["DOS"] = {};
			rec["DOS"]["FileName"] = readStringFunc.call(reader);
		}
		if (flags & (1 << 20))
		{
			rec["Mac"] = {};
			rec["Mac"]["FileName"] = readStringFunc.call(reader);
		}
		if (flags & (1 << 21))
		{
			rec["Unix"] = {};
			rec["Unix"]["FileName"] = readStringFunc.call(reader);
		}
		if (flags & (1 << 22))
		{
			rec["ID"] = [];
			rec["ID"].push(readStringFunc.call(reader));
			rec["ID"].push(readStringFunc.call(reader));
		}
		rec["V"] = flags & (1 << 23);
		if (flags & (1 << 24))
		{
			if (isRead)
			{

			}
			else
			{
				let flag = reader.readInt();
				if (flag & (1 << 0))
				{
					let n = reader.readInt();
					let np1 = reader.readInt();
					let np2 = reader.readInt();
					let pPoint = np2 << 32 | np1;
					rec["F"]["File"] = new Uint8Array(Module["HEAP8"].buffer, pPoint, n);
					Module["_free"](pPoint);
				}
				if (flag & (1 << 1))
				{
					let n = reader.readInt();
					let np1 = reader.readInt();
					let np2 = reader.readInt();
					let pPoint = np2 << 32 | np1;
					rec["UF"]["File"] = new Uint8Array(Module["HEAP8"].buffer, pPoint, n);
					Module["_free"](pPoint);
				}
				if (flag & (1 << 2))
				{
					let n = reader.readInt();
					let np1 = reader.readInt();
					let np2 = reader.readInt();
					let pPoint = np2 << 32 | np1;
					rec["DOS"]["File"] = new Uint8Array(Module["HEAP8"].buffer, pPoint, n);
					Module["_free"](pPoint);
				}
				if (flag & (1 << 3))
				{
					let n = reader.readInt();
					let np1 = reader.readInt();
					let np2 = reader.readInt();
					let pPoint = np2 << 32 | np1;
					rec["Mac"]["File"] = new Uint8Array(Module["HEAP8"].buffer, pPoint, n);
					Module["_free"](pPoint);
				}
				if (flag & (1 << 4))
				{
					let n = reader.readInt();
					let np1 = reader.readInt();
					let np2 = reader.readInt();
					let pPoint = np2 << 32 | np1;
					rec["Unix"]["File"] = new Uint8Array(Module["HEAP8"].buffer, pPoint, n);
					Module["_free"](pPoint);
				}
			}
			
		}
		if (flags & (1 << 26))
			rec["Desc"] = readStringFunc.call(reader);
	}
	// Stamp
	else if (rec["type"] == 12)
	{
		rec["Icon"] = readStringFunc.call(reader);
		rec["Rotate"] = readDouble2Func.call(reader);
		rec["InRect"] = [];
		for (let i = 0; i < 8; ++i)
			rec["InRect"].push(readDouble2Func.call(reader));
	}
	// Redact
	else if (rec["type"] == 25)
	{
		// QuadPoints
		if (flags & (1 << 15))
		{
			let n = reader.readInt();
			rec["QuadPoints"] = [];
			for (let i = 0; i < n; ++i)
				rec["QuadPoints"].push(readDoubleFunc.call(reader));
		}
		// IC
		if (flags & (1 << 16))
		{
			let n = reader.readInt();
			rec["IC"] = [];
			for (let i = 0; i < n; ++i)
				rec["IC"].push(readDouble2Func.call(reader));
		}
		// OverlayText
		if (flags & (1 << 17))
			rec["OverlayText"] = readStringFunc.call(reader);
		// Repeat
		rec["Repeat"] = (flags >> 18) & 1;
		// Q - alignment
		if (flags & (1 << 19))
		{
			// 0 - left-justified, 1 - centered, 2 - right-justified
			rec["alignment"] = reader.readByte();
		}
		// Font from DA
		if (flags & (1 << 20))
		{
			rec["font"] = {};
			let n = reader.readInt();
			rec["font"]["color"] = [];
			for (let i = 0; i < n; ++i)
				rec["font"]["color"].push(readDouble2Func.call(reader));
			rec["font"]["size"] = readDoubleFunc.call(reader);
			rec["font"]["name"] = readStringFunc.call(reader);
			if (!isRead)
			{
				let fontActual = readStringFunc.call(reader);
				if (fontActual != "")
					rec["font"]["actual"] = fontActual;
			}
			rec["font"]["style"] = reader.readInt();
		}
	}
}
function readWidgetType(reader, rec, readDoubleFunc, readDouble2Func, readStringFunc, isRead = false)
{
	// Widget
	rec["font"] = {};
	rec["font"]["name"] = readStringFunc.call(reader);
	rec["font"]["size"] = readDoubleFunc.call(reader);
	if (isRead)
		rec["font"]["sizeAP"] = readDoubleFunc.call(reader);
	rec["font"]["style"] = reader.readInt();
	let tc = reader.readInt();
	if (tc)
	{
		rec["font"]["color"] = [];
		for (let i = 0; i < tc; ++i)
			rec["font"]["color"].push(readDouble2Func.call(reader));
	}
	// 0 - left-justified, 1 - centered, 2 - right-justified
	if (!isRead || (rec["type"] != 29 && rec["type"] != 28 && rec["type"] != 27))
		rec["alignment"] = reader.readByte();
	rec["flag"] = reader.readInt();
	// 12.7.3.1
	if (rec["flag"] >= 0)
	{
		rec["readOnly"] = (rec["flag"] >> 0) & 1; // ReadOnly
		rec["required"] = (rec["flag"] >> 1) & 1; // Required
		rec["noexport"] = (rec["flag"] >> 2) & 1; // NoExport
	}
	let flags = reader.readInt();
	// Alternative field name, used in tooltip and error messages - TU
	if (flags & (1 << 0))
		rec["tooltip"] = readStringFunc.call(reader);
	// Default style string (CSS2 format) - DS
	if (flags & (1 << 1))
		rec["defaultStyle"] = readStringFunc.call(reader);
	// Actual font
	if (flags & (1 << 2))
		rec["font"]["actual"] = readStringFunc.call(reader);
	// Selection mode - H
	// 0 - none, 1 - invert, 2 - push, 3 - outline
	if (flags & (1 << 3))
		rec["highlight"] = reader.readByte();
	// Font key
	if (flags & (1 << 4))
		rec["font"]["key"] = readStringFunc.call(reader);
	// Border color - BC. Even if the border is not specified by BS/Border, 
	// then if BC is present, a default border is provided (solid, thickness 1). 
	// If the text annotation has MaxLen, borders appear for each character
	if (flags & (1 << 5))
	{
		let n = reader.readInt();
		rec["BC"] = [];
		for (let i = 0; i < n; ++i)
			rec["BC"].push(readDouble2Func.call(reader));
	}
	// Rotate an annotation relative to the page - R
	if (flags & (1 << 6))
		rec["rotate"] = reader.readInt();
	// Annotation background color - BG
	if (flags & (1 << 7))
	{
		let n = reader.readInt();
		rec["BG"] = [];
		for (let i = 0; i < n; ++i)
			rec["BG"].push(readDouble2Func.call(reader));
	}
	// Default value - DV
	if (flags & (1 << 8))
		rec["defaultValue"] = readStringFunc.call(reader);
	if (flags & (1 << 17))
		rec["Parent"] = reader.readInt();
	if (flags & (1 << 18))
		rec["name"] = readStringFunc.call(reader);
	if (flags & (1 << 19))
		rec["font"]["AP"] = readStringFunc.call(reader);
	// if (flags & (1 << 20))
	// 	readStringFunc.call(reader);
	if (flags & (1 << 21))
		rec["MEOptions"] = reader.readInt();
	// Action
	let nAction = reader.readInt();
	if (nAction > 0)
		rec["AA"] = {};
	for (let i = 0; i < nAction; ++i)
	{
		let AAType = readStringFunc.call(reader);
		rec["AA"][AAType] = {};
		readAction(reader, rec["AA"][AAType], readDoubleFunc, readStringFunc);
	}
	// Widget types
	if (rec["type"] == 27)
	{
		if (flags & (1 << 9))
			rec["value"] = readStringFunc.call(reader);
		let IFflags = reader.readInt();
		// Header - СA
		if (flags & (1 << 10))
			rec["caption"] = readStringFunc.call(reader);
		// Rollover header - RC
		if (flags & (1 << 11))
			rec["rolloverCaption"] = readStringFunc.call(reader);
		// Alternate header - AC
		if (flags & (1 << 12))
			rec["alternateCaption"] = readStringFunc.call(reader);
		// Header position - TP
		if (flags & (1 << 13))
			// 0 - textOnly, 1 - iconOnly, 2 - iconTextV, 3 - textIconV, 4 - iconTextH, 5 - textIconH, 6 - overlay
			rec["position"] = reader.readByte();
		// Icons - IF
		if (IFflags & (1 << 0))
		{
			rec["IF"] = {};
			// Scaling IF.SW
			// 0 - Always, 1 - Never, 2 - too big, 3 - too small
			if (IFflags & (1 << 1))
				rec["IF"]["SW"] = reader.readByte();
			// Scaling type - IF.S
			// 0 - Proportional, 1 - Anamorphic
			if (IFflags & (1 << 2))
				rec["IF"]["S"] = reader.readByte();
			if (IFflags & (1 << 3))
			{
				rec["IF"]["A"] = [];
				rec["IF"]["A"].push(readDoubleFunc.call(reader));
				rec["IF"]["A"].push(readDoubleFunc.call(reader));
			}
			rec["IF"]["FB"] = (IFflags >> 4) & 1;
		}
		if (isRead)
		{
			if (IFflags & (1 << 5))
				rec["I"] = reader.readInt();
			if (IFflags & (1 << 6))
				rec["RI"] = reader.readInt();
			if (IFflags & (1 << 7))
				rec["IX"] = reader.readInt();
		}
	}
	else if (rec["type"] == 29 || rec["type"] == 28)
	{
		if (flags & (1 << 9))
			rec["value"] = readStringFunc.call(reader);
		// 0 - check, 1 - cross, 2 - diamond, 3 - circle, 4 - star, 5 - square
		rec["style"] = reader.readByte();
		if (flags & (1 << 14))
			rec["ExportValue"] = readStringFunc.call(reader);
		// 12.7.4.2.1
		if (rec["flag"] >= 0)
		{
			rec["NoToggleToOff"]  = (rec["flag"] >> 14) & 1; // NoToggleToOff
			rec["radiosInUnison"] = (rec["flag"] >> 25) & 1; // RadiosInUnison
		}
	}
	else if (rec["type"] == 30)
	{
		if (flags & (1 << 9))
			rec["value"] = readStringFunc.call(reader);
		if (flags & (1 << 10))
			rec["maxLen"] = reader.readInt();
		if (flags & (1 << 11))
			rec["richValue"] = readStringFunc.call(reader);
		if (isRead)
		{
			if (flags & (1 << 12))
				rec["AP"]["V"] = readStringFunc.call(reader);
			if (flags & (1 << 13))
				rec["AP"]["render"] = reader.readData(); // TODO use Render - Uint8Array
		}
		// 12.7.4.3
		if (rec["flag"] >= 0)
		{
			rec["multiline"]       = (rec["flag"] >> 12) & 1; // Multiline
			rec["password"]        = (rec["flag"] >> 13) & 1; // Password
			rec["fileSelect"]      = (rec["flag"] >> 20) & 1; // FileSelect
			rec["doNotSpellCheck"] = (rec["flag"] >> 22) & 1; // DoNotSpellCheck
			rec["doNotScroll"]     = (rec["flag"] >> 23) & 1; // DoNotScroll
			rec["comb"]            = (rec["flag"] >> 24) & 1; // Comb
			rec["richText"]        = (rec["flag"] >> 25) & 1; // RichText
		}
	}
	else if (rec["type"] == 31 || rec["type"] == 32)
	{
		if (flags & (1 << 9))
			rec["value"] = readStringFunc.call(reader);
		if (flags & (1 << 10))
		{
			let n = reader.readInt();
			rec["opt"] = [];
			for (let i = 0; i < n; ++i)
			{
				let opt1 = readStringFunc.call(reader);
				let opt2 = readStringFunc.call(reader);
				if (opt1 == "")
					rec["opt"].push(opt2);
				else
					rec["opt"].push([opt2, opt1]);
			}
		}
		if (flags & (1 << 11))
			rec["TI"] = reader.readInt();
		if (isRead)
		{
			if (flags & (1 << 12))
				rec["AP"]["V"] = readStringFunc.call(reader);
		}
		else
		{
			if (flags & (1 << 12))
			{
				let n = reader.readInt();
				rec["curIdxs"] = [];
				for (let i = 0; i < n; ++i)
					rec["curIdxs"].push(reader.readInt());
			}
		}
		if (flags & (1 << 13))
		{
			let n = reader.readInt();
			rec["value"] = [];
			for (let i = 0; i < n; ++i)
				rec["value"].push(readStringFunc.call(reader));
		}
		if (isRead)
		{
			if (flags & (1 << 14))
			{
				let n = reader.readInt();
				rec["I"] = [];
				for (let i = 0; i < n; ++i)
					rec["I"].push(reader.readInt());
			}
			if (flags & (1 << 15))
				rec["AP"]["render"] = reader.readData(); // TODO use Render - Uint8Array
		}
		// 12.7.4.4
		if (rec["flag"] >= 0)
		{
			rec["editable"]          = (rec["flag"] >> 18) & 1; // Edit
			rec["multipleSelection"] = (rec["flag"] >> 21) & 1; // MultiSelect
			rec["doNotSpellCheck"]   = (rec["flag"] >> 22) & 1; // DoNotSpellCheck
			rec["commitOnSelChange"] = (rec["flag"] >> 26) & 1; // CommitOnSelChange
		}
		
	}
	else if (rec["type"] == 33)
	{
		rec["Sig"] = (flags >> 9) & 1;
	}
	if (rec["flag"] < 0)
		delete rec["flag"];
}

CFile.prototype["getInteractiveFormsInfo"] = function()
{
	let ptr = this._getInteractiveFormsInfo();
	let reader = ptr.getReader();
	if (!reader) return {};

	let res = {};
	while (reader.isValid())
	{
		let k = reader.readInt();
		if (k > 0 && res["CO"] == undefined)
			res["CO"] = [];
		for (let i = 0; i < k; ++i)
			res["CO"].push(reader.readInt());
		
		k = reader.readInt();
		if (k > 0 && res["Parents"] == undefined)
			res["Parents"] = [];
		for (let i = 0; i < k; ++i)
		{
			let rec = {};
			rec["i"] = reader.readInt();
			let flags = reader.readInt();
			if (flags & (1 << 0))
				rec["name"] = reader.readString();
			if (flags & (1 << 1))
				rec["value"] = reader.readString();
			if (flags & (1 << 2))
				rec["defaultValue"] = reader.readString();
			if (flags & (1 << 3))
			{
				let n = reader.readInt();
				rec["curIdxs"] = [];
				for (let i = 0; i < n; ++i)
					rec["curIdxs"].push(reader.readInt());
			}
			if (flags & (1 << 4))
				rec["Parent"] = reader.readInt();
			if (flags & (1 << 5))
			{
				let n = reader.readInt();
				rec["value"] = [];
				for (let i = 0; i < n; ++i)
					rec["value"].push(reader.readString());
			}
			if (flags & (1 << 6))
			{
				let n = reader.readInt();
				rec["opt"] = [];
				for (let i = 0; i < n; ++i)
				{
					let opt1 = reader.readString();
					let opt2 = reader.readString();
					if (opt1 == "")
						rec["opt"].push(opt2);
					else
						rec["opt"].push([opt2, opt1]);
				}
			}
			if (flags & (1 << 7))
			{
				rec["flag"] = reader.readInt();

				rec["readOnly"] = (rec["flag"] >> 0) & 1; // ReadOnly
				rec["required"] = (rec["flag"] >> 1) & 1; // Required
				rec["noexport"] = (rec["flag"] >> 2) & 1; // NoExport

				rec["NoToggleToOff"]  = (rec["flag"] >> 14) & 1; // NoToggleToOff
				if ((rec["flag"] >> 15) & 1) // If radiobutton
					rec["radiosInUnison"] = (rec["flag"] >> 25) & 1; // RadiosInUnison
				else
					rec["richText"]       = (rec["flag"] >> 25) & 1; // RichText

				rec["multiline"]       = (rec["flag"] >> 12) & 1; // Multiline
				rec["password"]        = (rec["flag"] >> 13) & 1; // Password
				rec["fileSelect"]      = (rec["flag"] >> 20) & 1; // FileSelect
				rec["doNotSpellCheck"] = (rec["flag"] >> 22) & 1; // DoNotSpellCheck
				rec["doNotScroll"]     = (rec["flag"] >> 23) & 1; // DoNotScroll
				rec["comb"]            = (rec["flag"] >> 24) & 1; // Comb

				rec["editable"]          = (rec["flag"] >> 18) & 1; // Edit
				rec["multipleSelection"] = (rec["flag"] >> 21) & 1; // MultiSelect
				rec["commitOnSelChange"] = (rec["flag"] >> 26) & 1; // CommitOnSelChange
			}
			if (flags & (1 << 8))
			{
				let nAction = reader.readInt();
				if (nAction > 0)
					rec["AA"] = {};
				for (let i = 0; i < nAction; ++i)
				{
					let AAType = reader.readString();
					rec["AA"][AAType] = {};
					readAction(reader, rec["AA"][AAType], reader.readDouble, reader.readString);
				}
			}
			if (flags & (1 << 9))
				rec["maxLen"] = reader.readInt();
			if (flags & (1 << 10))
				rec["tooltip"] = reader.readString();			
			if (flags & (1 << 11))
				rec["MEOptions"] = reader.readInt();
			res["Parents"].push(rec);
		}

		k = reader.readInt();
		if (k > 0 && res["Fields"] == undefined)
			res["Fields"] = [];
		for (let q = 0; reader.isValid() && q < k; ++q)
		{
			let rec = {};
			// Widget type - FT
			// 26 - Unknown, 27 - button, 28 - radiobutton, 29 - checkbox, 30 - text, 31 - combobox, 32 - listbox, 33 - signature
			rec["type"] = reader.readByte();
			// Annot
			readAnnot(reader, rec, reader.readDouble, reader.readDouble2, reader.readString);
			// Widget type
			readWidgetType(reader, rec, reader.readDouble, reader.readDouble2, reader.readString);

			res["Fields"].push(rec);
		}
	}

	ptr.free();
	return res;
};	

// optional nWidget     - rec["AP"]["i"]
// optional sView       - N/D/R
// optional sButtonView - state pushbutton-annotation - Off/Yes(or rec["ExportValue"])
CFile.prototype["getInteractiveFormsAP"] = function(originIndex, width, height, backgroundColor, nWidget, sView, sButtonView)
{
	let nView = -1;
	if (sView)
	{
		if (sView == "N")
			nView = 0;
		else if (sView == "D")
			nView = 1;
		else if (sView == "R")
			nView = 2;
	}
	let nButtonView = -1;
	if (sButtonView)
		nButtonView = (sButtonView == "Off" ? 0 : 1);

	let pageIndex = this.pages.findIndex(function(page) {
		return page.originIndex == originIndex;
	});
	this.lockPageNumForFontsLoader(pageIndex, UpdateFontsSource.Forms);
	let ptr = this._getInteractiveFormsAP(width, height, backgroundColor, originIndex, nWidget, nView, nButtonView);
	let reader = ptr.getReader();
	this.unlockPageNumForFontsLoader();
	
	if (!reader)
		return [];

	let res = [];

	while (reader.isValid())
	{
		// Annotation view
		let AP = {};
		readAnnotAP(reader, AP);
		res.push(AP);
	}

	ptr.free();
	return res;
};
// optional bBase64   - true/false base64 result
// optional nWidget ...
// optional sIconView - icon - I/RI/IX
CFile.prototype["getButtonIcons"] = function(pageIndex, width, height, backgroundColor, bBase64, nWidget, sIconView)
{
	let nView = -1;
	if (sIconView)
	{
		if (sIconView == "I")
			nView = 0;
		else if (sIconView == "RI")
			nView = 1;
		else if (sIconView == "IX")
			nView = 2;
	}

	let ptr = this._getButtonIcons(backgroundColor, pageIndex, bBase64, nWidget, nView);
	let reader = ptr.getReader();

	if (!reader) return {};

	let res = {};
	
	res["MK"] = [];
	res["View"] = [];

	while (reader.isValid())
	{
		// View pushbutton annotation
		let MK = {};
		// Relation with AP
		MK["i"] = reader.readInt();
		let n = reader.readInt();
		for (let i = 0; i < n; ++i)
		{
			let MKType = reader.readString();
			MK[MKType] = reader.readInt();
			let unique = reader.readByte();
			if (unique)
			{
				let ViewMK = {};
				ViewMK["j"] = MK[MKType];
				ViewMK["w"] = reader.readInt();
				ViewMK["h"] = reader.readInt();
				if (bBase64)
				{
					// base64 string with image
					ViewMK["retValue"] = reader.readString();
				}
				else
				{
					let np1 = reader.readInt();
					let np2 = reader.readInt();
					// this memory needs to be deleted
					ViewMK["retValue"] = np2 << 32 | np1;
				}
				res["View"].push(ViewMK);
			}
		}
		res["MK"].push(MK);
	}

	ptr.free();
	return res;
};
// optional originIndex - get annotations from specific page
CFile.prototype["getAnnotationsInfo"] = function(originIndex)
{
	if (!this.nativeFile)
		return [];

	let ptr = this._getAnnotationsInfo(originIndex);
	let reader = ptr.getReader();

	if (!reader) return [];

	let res = [];
	while (reader.isValid())
	{
		let n = reader.readInt();
		for (let i = 0; i < n; ++i)
		{
			let rec = {};
			// Annotation type
			// 0 - Text, 1 - Link, 2 - FreeText, 3 - Line, 4 - Square, 5 - Circle,
			// 6 - Polygon, 7 - PolyLine, 8 - Highlight, 9 - Underline, 10 - Squiggly, 
			// 11 - Strikeout, 12 - Stamp, 13 - Caret, 14 - Ink, 15 - Popup, 16 - FileAttachment, 
			// 17 - Sound, 18 - Movie, 19 - Widget, 20 - Screen, 21 - PrinterMark,
			// 22 - TrapNet, 23 - Watermark, 24 - 3D, 25 - Redact
			rec["type"] = reader.readByte();
			// Annot
			readAnnot(reader, rec, reader.readDouble, reader.readDouble2, reader.readString);
			// Annot type
			readAnnotType(reader, rec, reader.readDouble, reader.readDouble2, reader.readString);
			res.push(rec);
		}
	}
	
	ptr.free();
	return res;
};
// optional nAnnot ...
// optional sView ...
CFile.prototype["getAnnotationsAP"] = function(originIndex, width, height, backgroundColor, nAnnot, sView)
{
	let nView = -1;
	if (sView)
	{
		if (sView == "N")
			nView = 0;
		else if (sView == "D")
			nView = 1;
		else if (sView == "R")
			nView = 2;
	}

	let pageIndex = this.pages.findIndex(function(page) {
		return page.originIndex == originIndex;
	});
	this.lockPageNumForFontsLoader(pageIndex, UpdateFontsSource.Annotation);
	let ptr = this._getAnnotationsAP(width, height, backgroundColor, originIndex, nAnnot, nView);
	let reader = ptr.getReader();
	this.unlockPageNumForFontsLoader();

	if (!reader)
		return [];

	let res = [];
	while (reader.isValid())
	{
		// Annotation view
		let AP = {};
		readAnnotAP(reader, AP);
		res.push(AP);
	}

	ptr.free();
	return res;
};

// AnnotInfo - Uint8Array with ctAnnotField format
CFile.prototype["readAnnotationsInfoFromBinary"] = function(AnnotInfo)
{
	if (!AnnotInfo)
		return [];

	let reader = new CBinaryReader(AnnotInfo, 0, AnnotInfo.length);
	if (!reader) return [];

	let res = { annots:[], imgs:[] };
	while (reader.isValid())
	{
		let nCommand = reader.readByte();
		let nPos = reader.pos;
		let nSize = reader.readInt();
		if (nCommand == 164) // ctAnnotField
		{
			let rec = {};
			// Annotation type
			// 0 - Text, 1 - Link, 2 - FreeText, 3 - Line, 4 - Square, 5 - Circle,
			// 6 - Polygon, 7 - PolyLine, 8 - Highlight, 9 - Underline, 10 - Squiggly, 
			// 11 - Strikeout, 12 - Stamp, 13 - Caret, 14 - Ink, 15 - Popup, 16 - FileAttachment, 
			// 17 - Sound, 18 - Movie, 19 - Widget, 20 - Screen, 21 - PrinterMark,
			// 22 - TrapNet, 23 - Watermark, 24 - 3D, 25 - Redact
			rec["type"] = reader.readByte();
			// Annot
			readAnnot(reader, rec, reader.readDouble3, reader.readDouble3, reader.readString2, true);
			// Annot type
			readAnnotType(reader, rec, reader.readDouble3, reader.readDouble3, reader.readString2, true);
			if (rec["type"] >= 26 && rec["type"] <= 33)
			{
				// Widget type
				readWidgetType(reader, rec, reader.readDouble3, reader.readDouble3, reader.readString2, true);
			}
			res.annots.push(rec);
		}
		else if (nCommand == 166) // ctWidgetsInfo
		{
			reader.readInt(); // CO must be 0
			reader.readInt(); // Parents must be 0
			// ButtonImg
			let n = reader.readInt();
			for (let i = 0; i < n; ++i)
			{
				let data = reader.readString();
				res.imgs.push(data);
			}
		}
		else
		{
			reader.pos = nPos + nSize;
			continue;
		}
	}

	return res;
};

// SCAN PAGES
CFile.prototype["scanPage"] = function(page, mode)
{
	let ptr = this._scanPage(page, mode);
	if (mode == 2) {
		data = ptr.getMemory(true);
		ptr.free();
		return data;
	}

	let reader = ptr.getReader();
	if (!reader) return [];

	let shapesCount = reader.readInt();
	let shapes = new Array(shapesCount);

	for (let i = 0; i < shapesCount; i++)
		shapes[i] = reader.readString();

	ptr.free();
	return shapes;
};

CFile.prototype["getImageBase64"] = function(rId)
{
	let strId = "" + rId;
	if (this.scannedImages[strId])
		return this.scannedImages[strId];

	this.scannedImages[strId] = this._getImageBase64(rId);
	return this.scannedImages[strId];
};

CFile.prototype["changeImageUrl"] = function(baseUrl, resultUrl)
{
	for (let i in this.scannedImages)
	{
		if (this.scannedImages[i] == baseUrl)
			this.scannedImages[i] = resultUrl;
	}
};

// MEMORY
CFile.prototype["getUint8Array"] = function(ptr, len)
{
	return this._getUint8Array(ptr, len);
};
CFile.prototype["getUint8ClampedArray"] = function(ptr, len)
{
	return this._getUint8ClampedArray(ptr, len);
};
CFile.prototype["free"] = function(pointer)
{
	this._free(pointer);
};

// PIXMAP
CFile.prototype["getPagePixmap"] = function(pageIndex, width, height, backgroundColor)
{
	let page = this.pages[pageIndex];
	if (page.originIndex == undefined)
		return null;
	if (page.fonts.length > 0)
	{
		// waiting fonts
		return null;
	}

	this.lockPageNumForFontsLoader(pageIndex, UpdateFontsSource.Page);
	let ptr = this._getPixmap(page.originIndex, width, height, backgroundColor);
	this.unlockPageNumForFontsLoader();

	if (page.fonts.length > 0)
	{
		// waiting fonts
		this._free(ptr);
		ptr = null;
	}
	return ptr;
};

// CLOUD FONTS
function addToArrayAsDictionary(arr, value)
{
	let isFound = false;
	for (let i = 0, len = arr.length; i < len; i++)
	{
		if (arr[i] == value)
		{
			isFound = true;
			break;
		}
	}
	if (!isFound)
		arr.push(value);
	return isFound;
}

function fontToMemory(file, isCheck)
{
	let idBuffer = file.GetID().toUtf8();
	let idPointer = Module["_malloc"](idBuffer.length);
	Module["HEAP8"].set(idBuffer, idPointer);

	if (isCheck)
	{
		let nExist = Module["_IsFontBinaryExist"](idPointer);
		if (nExist != 0)
		{
			Module["_free"](idPointer);
			return;
		}
	}

	let stream_index = file.GetStreamIndex();
	
	let stream = AscFonts.getFontStream(stream_index);
	let streamPointer = Module["_malloc"](stream.size);
	Module["HEAP8"].set(stream.data, streamPointer);

	Module["_SetFontBinary"](idPointer, streamPointer, stream.size);

	Module["_free"](streamPointer);
	Module["_free"](idPointer);
}

// FONTS
CFile.prototype["addPage"] = function(pageIndex, pageObj)
{
	this.pages.splice(pageIndex, 0, pageObj);
	if (this.fontStreams)
	{
		for (let i in this.fontStreams)
		{
			let pages = this.fontStreams[i].pages;
			for (let j = 0; j < pages.length; j++)
			{
				if (pages[j] >= pageIndex)
					pages[j] += 1;
			}
		}
	}
};
CFile.prototype["removePage"] = function(pageIndex)
{
	let result = this.pages.splice(pageIndex, 1);
	if (this.fontStreams)
	{
		for (let i in this.fontStreams)
		{
			let pages = this.fontStreams[i].pages;
			for (let j = 0; j < pages.length; j++)
			{
				if (pages[j] > pageIndex)
					pages[j] -= 1;
				else if (pages[j] == pageIndex)
					pages.splice(j, 1);
			}
		}
	}
	return result;
};

// ONLY WEB
self["AscViewer"]["Free"] = function(pointer)
{
	CFile.prototype._free(pointer);
};
self["AscViewer"]["InitializeFonts"] = function(basePath) 
{
	return CFile.prototype._InitializeFonts(basePath);
};

self["AscViewer"]["CheckStreamId"] = function(data, status) 
{
	return CFile.prototype._CheckStreamId(data, status);
};

// export
self["AscViewer"]["CDrawingFile"] = CFile;

self.drawingFile = null;
})(window, undefined);
