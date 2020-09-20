/*
	frida -U -f com.burbn.instagram --no-pause -l unpin-ssl-instagram-ios-157.0.js
*/

// Cheat verifyWithMetrics from proxygen

function cheatVerifyWithMetrix() {
	var verifyWithMetrixFileOffset = 0x0000000000201484;
	var verifyWithMetrix = Process.findModuleByName("FBSharedFramework")["base"].add(verifyWithMetrixFileOffset);
	var verifyWithMetrix_func = new NativeFunction(verifyWithMetrix, 'int', ['uint64', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer']);
	Interceptor.replace(verifyWithMetrix, new NativeCallback(function (_bool, _x509_store_ctx_st, _str, _fail_cb, _succ_cb, _clock, _trace) {
		var result = verifyWithMetrix_func(_bool, _x509_store_ctx_st, _str, _succ_cb, _succ_cb, _clock, _trace);
		var result = 1;
		console.log("[i] verifyWithMetrics called!");
		return result;
	}, 'int', ['uint64', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer']));
	console.log("[i] verifyWithMetrics hooked at " + verifyWithMetrix + "!");	
}
cheatVerifyWithMetrix();


// Cheat FBLiger protection settings to disable fizz and SSL cache

var resetSettings = [
	"persistentSSLCacheEnabled", 
	"crossDomainSSLCacheEnabled", 
	"fizzEnabled", 
	"fizzPersistentCacheEnabled", 
	"quicFizzEarlyDataEnabled", 
	"fizzEarlyDataEnabled", 
	"enableFizzCertCompression"
];
function cheatFBLigerSettings() {
	var resolver = new ApiResolver('objc');
	for (var i = 0; i < resetSettings.length; i++) {
		var matches = resolver.enumerateMatchesSync("-[FBLigerConfig " + resetSettings[i] + "]");
		if (matches.length < 1) {
			console.log("[w] Failed to reset " + resetSettings[i] + ", address not found!");
			continue;
		}
		Interceptor.attach(matches[0]["address"], {
			onLeave: function (retval) {
				console.log("[i] -[FBLigerConfig *] called!");
				retval.replace(0);
			}
		});
		console.log("[i] -[FBLIgerConfig " + resetSettings[i] + "] reset!")
	}
}
cheatFBLigerSettings();


// Cheat cerificate verification callcbacks from boringssl and FBSharedFramework
function cheatCallbacks() {
	var SSL_CTX_sess_set_new_cb_addr = DebugSymbol.findFunctionsNamed("SSL_CTX_sess_set_new_cb");
	var SSL_CTX_set_cert_verify_callback_addr = DebugSymbol.findFunctionsNamed("SSL_CTX_set_cert_verify_callback");
	var SSL_CTX_set_cert_verify_result_callback_addr = DebugSymbol.findFunctionsNamed("SSL_CTX_set_cert_verify_result_callback");
	var SSL_CTX_set_verify_addr = DebugSymbol.findFunctionsNamed("SSL_CTX_set_verify");
	var SSL_set_verify_addr = DebugSymbol.findFunctionsNamed("SSL_set_verify");
	var SSL_set_cert_cb_addr = DebugSymbol.findFunctionsNamed("SSL_set_cert_cb");
	var SSL_CTX_set_cert_cb_addr = DebugSymbol.findFunctionsNamed("SSL_CTX_set_cert_cb");
	var X509_STORE_CTX_set_verify_cb_addr = DebugSymbol.findFunctionsNamed("X509_STORE_CTX_set_verify_cb");


	for(var i = 0; i < SSL_CTX_set_cert_verify_callback_addr.length; i++) {
		Interceptor.replace(SSL_CTX_set_cert_verify_callback_addr[i], new NativeCallback(function () {
			console.log("[i] SSL_CTX_set_cert_verify_callback(...) called!");
			return;
		}, 'void', []));
	}
	console.log("[i] SSL_CTX_set_cert_verify_callback(...) hooked!");

	for(var i = 0; i < SSL_CTX_set_cert_verify_result_callback_addr.length; i++) {
		Interceptor.replace(SSL_CTX_set_cert_verify_result_callback_addr[i], new NativeCallback(function () {
			console.log("[i] SSL_CTX_set_cert_verify_result_callback(...) called!");
			return;
		}, 'void', []));
	}
	console.log("[i] SSL_CTX_set_cert_verify_result_callback(...) hooked!");

	for(var i = 0; i < SSL_CTX_set_verify_addr.length; i++) {
		Interceptor.replace(SSL_CTX_set_verify_addr[i], new NativeCallback(function () {
			console.log("[i] SSL_CTX_set_verify(...) called!");
			return;
		}, 'void', []));
	}
	console.log("[i] SSL_CTX_set_verify(...) hooked!");

	for(var i = 0; i < SSL_set_verify_addr.length; i++) {
		Interceptor.replace(SSL_set_verify_addr[i], new NativeCallback(function () {
			console.log("[i] SSL_set_verify(...) called!");
			return;
		}, 'void', []));
	}
	console.log("[i] SSL_set_verify(...) hooked!");

	for(var i = 0; i < SSL_set_cert_cb_addr.length; i++) {
		Interceptor.replace(SSL_set_cert_cb_addr[i], new NativeCallback(function () {
			console.log("[i] SSL_set_cert_cb(...) called!");
			return;
		}, 'void', []));
	}
	console.log("[i] SSL_set_cert_cb(...) hooked!");

	for(var i = 0; i < SSL_CTX_set_cert_cb_addr.length; i++) {
		Interceptor.replace(SSL_CTX_set_cert_cb_addr[i], new NativeCallback(function () {
			console.log("[i] SSL_CTX_set_cert_cb(...) called!");
			return;
		}, 'void', []));
	}
	console.log("[i] SSL_CTX_set_cert_cb(...) hooked!");

	for(var i = 0; i < X509_STORE_CTX_set_verify_cb_addr.length; i++) {
		Interceptor.replace(X509_STORE_CTX_set_verify_cb_addr[i], new NativeCallback(function () {
			console.log("[i] X509_STORE_CTX_set_verify_cb(...) called!");
			return;
		}, 'void', []));
	}
	console.log("[i] X509_STORE_CTX_set_verify_cb(...) hooked!");	
}
cheatCallbacks();

// Cheat SecTrustEvaluate, just in case :)

function cheatSecTrustEvaluate() {
		
	var SecTrustEvaluate_prt = Module.findExportByName("Security", "SecTrustEvaluate");
	if (SecTrustEvaluate_prt == null) {
		console.log("[e] Security!SecTrustEvaluate(...) not found!");
		return;
	}
	var SecTrustEvaluate = new NativeFunction(SecTrustEvaluate_prt, "int", ["pointer", "pointer"]);
	Interceptor.replace(SecTrustEvaluate_prt, new NativeCallback(function(trust, result) {
		console.log("[i] SecTrustEvaluate(...) called!");
		var osstatus = SecTrustEvaluate(trust, result);
		Memory.writeU8(result, 1);
		return 0;
	}, "int", ["pointer", "pointer"]));
	console.log("[i] SecTrustEvaluate(...) hooked!");	
}
cheatSecTrustEvaluate();