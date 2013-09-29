/**
 * @license
 * Lo-Dash 2.1.0 (Custom Build) lodash.com/license | Underscore.js 1.5.2 underscorejs.org/LICENSE
 * Build: `lodash exports="amd" include="defer,each,isObject,isArray" -m -o lodash.custom.js`
 */
;(function(){function t(){return h.pop()||{a:"",b:null,c:"",k:null,configurable:!1,enumerable:!1,"false":!1,d:"",e:"",v:null,g:"","null":!1,number:null,z:null,push:null,h:null,string:null,i:"","true":!1,undefined:!1,j:!1,writable:!1}}function n(){}function e(t){var n=t.k;n&&e(n),t.b=t.k=t.object=t.number=t.string=null,h.length<v&&h.push(t)}function r(){}function o(t,n,e){if(typeof t!="function")return m;if(typeof n=="undefined")return t;var r=t.__bindData__||U.funcNames&&!t.name;if(typeof r=="undefined"){var o=E&&N.call(t);
U.funcNames||!o||j.test(o)||(r=!0),(U.funcNames||!r)&&(r=!U.funcDecomp||E.test(o),X(t,r))}if(true!==r&&r&&1&r[1])return t;switch(e){case 1:return function(e){return t.call(n,e)};case 2:return function(e,r){return t.call(n,e,r)};case 3:return function(e,r,o){return t.call(n,e,r,o)};case 4:return function(e,r,o,u){return t.call(n,e,r,o,u)}}return y(t,n)}function u(t,n,e,r,o,i){var l=1&n,s=2&n,p=4&n,y=8&n,g=16&n,m=32&n,b=t;if(!s&&!c(t))throw new TypeError;g&&!e.length&&(n&=-17,g=e=!1),m&&!r.length&&(n&=-33,m=r=!1);
var h=t&&t.__bindData__;if(h)return!l||1&h[1]||(h[4]=o),!l&&1&h[1]&&(n|=8),!p||4&h[1]||(h[5]=i),g&&R.apply(h[2]||(h[2]=[]),e),m&&R.apply(h[3]||(h[3]=[]),r),h[1]|=n,u.apply(null,h);if(!l||s||p||m||!(U.fastBind||J&&g))v=function(){var c=arguments,h=l?o:this;return(p||g||m)&&(c=H.call(c),g&&$.apply(c,e),m&&R.apply(c,r),p&&c.length<i)?(n|=16,u(t,y?n:-4&n,c,null,o,i)):(s&&(t=h[b]),this instanceof v?(h=a(t.prototype),c=t.apply(h,c),f(c)?c:h):t.apply(h,c))};else{if(g){var d=[o];R.apply(d,e)}var v=g?J.apply(t,d):J.call(t,o)
}return X(v,H.call(arguments)),v}function i(){var n=t();n.h=w,n.b=n.c=n.g=n.i="",n.e="t",n.j=!0;for(var r,u=0;r=arguments[u];u++)for(var i in r)n[i]=r[i];u=n.a,n.d=/^[^,]+/.exec(u)[0],r=Function,u="return function("+u+"){",i="var n,t="+n.d+",E="+n.e+";if(!t)return E;"+n.i+";",n.b?(i+="var u=t.length;n=-1;if("+n.b+"){",U.unindexedChars&&(i+="if(s(t)){t=t.split('')}"),i+="while(++n<u){"+n.g+";}}else{"):U.nonEnumArgs&&(i+="var u=t.length;n=-1;if(u&&p(t)){while(++n<u){n+='';"+n.g+";}}else{"),U.enumPrototypes&&(i+="var G=typeof t=='function';"),U.enumErrorProps&&(i+="var F=t===k||t instanceof Error;");
var a=[];if(U.enumPrototypes&&a.push('!(G&&n=="prototype")'),U.enumErrorProps&&a.push('!(F&&(n=="message"||n=="name"))'),n.j&&n.f)i+="var C=-1,D=B[typeof t]&&v(t),u=D?D.length:0;while(++C<u){n=D[C];",a.length&&(i+="if("+a.join("&&")+"){"),i+=n.g+";",a.length&&(i+="}"),i+="}";else if(i+="for(n in t){",n.j&&a.push("m.call(t, n)"),a.length&&(i+="if("+a.join("&&")+"){"),i+=n.g+";",a.length&&(i+="}"),i+="}",U.nonEnumShadows){for(i+="if(t!==A){var i=t.constructor,r=t===(i&&i.prototype),f=t===J?I:t===k?j:L.call(t),x=y[f];",k=0;7>k;k++)i+="n='"+n.h[k]+"';if((!(r&&x[n])&&m.call(t,n))",n.j||(i+="||(!x[n]&&t[n]!==A[n])"),i+="){"+n.g+"}";
i+="}"}return(n.b||U.nonEnumArgs)&&(i+="}"),i+=n.c+";return E",r=r("d,j,k,m,o,p,q,s,v,A,B,y,I,J,L",u+i+"}"),e(n),r(o,x,C,L,d,l,Y,s,n.f,I,S,Q,A,T,K)}function a(t){return f(t)?q(t):{}}function l(t){return t&&typeof t=="object"&&typeof t.length=="number"&&K.call(t)==O||!1}function c(t){return typeof t=="function"}function f(t){return!(!t||!S[typeof t])}function s(t){return typeof t=="string"||K.call(t)==A}function p(t,n,e){if(n&&typeof e=="undefined"&&Y(t)){e=-1;for(var r=t.length;++e<r&&false!==n(t[e],e,t););}else tn(t,n,e);
return t}function y(t,n){return 2<arguments.length?u(t,17,H.call(arguments,2),null,n):u(t,1,null,null,n)}function g(t){if(!c(t))throw new TypeError;var n=H.call(arguments,1);return setTimeout(function(){t.apply(b,n)},1)}function m(t){return t}var b,h=[],d={},v=40,j=/^function[ \n\r\t]+\w/,E=/\bthis\b/,w="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" "),O="[object Arguments]",x="[object Error]",A="[object String]",S={"boolean":!1,"function":!0,object:!0,number:!1,string:!1,undefined:!1},_=S[typeof window]&&window||this,P=S[typeof exports]&&exports&&!exports.nodeType&&exports,D=S[typeof module]&&module&&!module.nodeType&&module,P=D&&D.exports===P&&P,F=[],C=Error.prototype,I=Object.prototype,T=String.prototype,B=RegExp("^"+(I.valueOf+"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/valueOf|for [^\]]+/g,".+?")+"$"),N=Function.prototype.toString,L=I.hasOwnProperty,R=F.push,z=I.propertyIsEnumerable,K=I.toString,$=F.unshift,G=function(){try{var t={},n=B.test(n=Object.defineProperty)&&n,e=n(t,t,t)&&n
}catch(r){}return e}(),J=B.test(J=K.bind)&&J,q=B.test(q=Object.create)&&q,V=B.test(V=Array.isArray)&&V,W=B.test(W=Object.keys)&&W,H=F.slice,D=B.test(_.attachEvent),M=J&&!/\n|true/.test(J+D),Q={};Q["[object Array]"]=Q["[object Date]"]=Q["[object Number]"]={constructor:!0,toLocaleString:!0,toString:!0,valueOf:!0},Q["[object Boolean]"]=Q[A]={constructor:!0,toString:!0,valueOf:!0},Q[x]=Q["[object Function]"]=Q["[object RegExp]"]={constructor:!0,toString:!0},Q["[object Object]"]={constructor:!0},function(){for(var t=w.length;t--;){var n,e=w[t];
for(n in Q)L.call(Q,n)&&!L.call(Q[n],e)&&(Q[n][e]=!1)}}();var U=r.support={};!function(){function t(){this.x=1}var n={0:1,length:1},e=[];t.prototype={valueOf:1};for(var r in new t)e.push(r);for(r in arguments);U.argsClass=K.call(arguments)==O,U.argsObject=arguments.constructor==Object&&!(arguments instanceof Array),U.enumErrorProps=z.call(C,"message")||z.call(C,"name"),U.enumPrototypes=z.call(t,"prototype"),U.fastBind=J&&!M,U.funcDecomp=!B.test(_.l)&&E.test(function(){return this}),U.funcNames=typeof Function.name=="string",U.nonEnumArgs=0!=r,U.nonEnumShadows=!/valueOf/.test(e),U.spliceObjects=(F.splice.call(n,0,1),!n[0]),U.unindexedChars="xx"!="x"[0]+Object("x")[0]
}(1),q||(a=function(t){if(f(t)){n.prototype=t;var e=new n;n.prototype=null}return e||{}});var X=G?function(n,r){var o=t();o.value=r,G(n,"__bindData__",o),e(o)}:n;U.argsClass||(l=function(t){return t&&typeof t=="object"&&typeof t.length=="number"&&L.call(t,"callee")||!1});var Y=V||function(t){return t&&typeof t=="object"&&typeof t.length=="number"&&"[object Array]"==K.call(t)||!1},Z=i({a:"z",e:"[]",i:"if(!(B[typeof z]))return E",g:"E.push(n)"}),V=W?function(t){return f(t)?U.enumPrototypes&&typeof t=="function"||U.nonEnumArgs&&t.length&&l(t)?Z(t):W(t):[]
}:Z,tn=i({a:"g,e,K",i:"e=e&&typeof K=='undefined'?e:d(e,K,3)",b:"typeof u=='number'",v:V,g:"if(e(t[n],n,g)===false)return E"});c(/x/)&&(c=function(t){return typeof t=="function"&&"[object Function]"==K.call(t)}),M&&P&&typeof setImmediate=="function"&&(g=function(t){if(!c(t))throw new TypeError;return setImmediate.apply(_,arguments)}),r.bind=y,r.defer=g,r.forEach=p,r.keys=V,r.each=p,r.identity=m,r.isArguments=l,r.isArray=Y,r.isFunction=c,r.isObject=f,r.isString=s,r.VERSION="2.1.0",typeof define=="function"&&typeof define.amd=="object"&&define.amd&& define(function(){return r
})}).call(this);