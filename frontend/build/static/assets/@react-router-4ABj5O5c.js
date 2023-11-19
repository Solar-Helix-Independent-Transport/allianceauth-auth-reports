import{r as u,R as ae}from"./@libs--vsrNows.js";/**
 * @remix-run/router v1.12.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function S(){return S=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},S.apply(this,arguments)}var E;(function(e){e.Pop="POP",e.Push="PUSH",e.Replace="REPLACE"})(E||(E={}));const _="popstate";function ie(e){e===void 0&&(e={});function t(r,a){let{pathname:i,search:l,hash:s}=r.location;return j("",{pathname:i,search:l,hash:s},a.state&&a.state.usr||null,a.state&&a.state.key||"default")}function n(r,a){return typeof a=="string"?a:G(a)}return oe(t,n,null,e)}function g(e,t){if(e===!1||e===null||typeof e>"u")throw new Error(t)}function N(e,t){if(!e){typeof console<"u"&&console.warn(t);try{throw new Error(t)}catch{}}}function le(){return Math.random().toString(36).substr(2,8)}function D(e,t){return{usr:e.state,key:e.key,idx:t}}function j(e,t,n,r){return n===void 0&&(n=null),S({pathname:typeof e=="string"?e:e.pathname,search:"",hash:""},typeof t=="string"?P(t):t,{state:n,key:t&&t.key||r||le()})}function G(e){let{pathname:t="/",search:n="",hash:r=""}=e;return n&&n!=="?"&&(t+=n.charAt(0)==="?"?n:"?"+n),r&&r!=="#"&&(t+=r.charAt(0)==="#"?r:"#"+r),t}function P(e){let t={};if(e){let n=e.indexOf("#");n>=0&&(t.hash=e.substr(n),e=e.substr(0,n));let r=e.indexOf("?");r>=0&&(t.search=e.substr(r),e=e.substr(0,r)),e&&(t.pathname=e)}return t}function oe(e,t,n,r){r===void 0&&(r={});let{window:a=document.defaultView,v5Compat:i=!1}=r,l=a.history,s=E.Pop,o=null,c=h();c==null&&(c=0,l.replaceState(S({},l.state,{idx:c}),""));function h(){return(l.state||{idx:null}).idx}function f(){s=E.Pop;let m=h(),x=m==null?null:m-c;c=m,o&&o({action:s,location:p.location,delta:x})}function d(m,x){s=E.Push;let C=j(p.location,m,x);n&&n(C,m),c=h()+1;let O=D(C,c),U=p.createHref(C);try{l.pushState(O,"",U)}catch(T){if(T instanceof DOMException&&T.name==="DataCloneError")throw T;a.location.assign(U)}i&&o&&o({action:s,location:p.location,delta:1})}function y(m,x){s=E.Replace;let C=j(p.location,m,x);n&&n(C,m),c=h();let O=D(C,c),U=p.createHref(C);l.replaceState(O,"",U),i&&o&&o({action:s,location:p.location,delta:0})}function v(m){let x=a.location.origin!=="null"?a.location.origin:a.location.href,C=typeof m=="string"?m:G(m);return g(x,"No window.location.(origin|href) available to create URL for href: "+C),new URL(C,x)}let p={get action(){return s},get location(){return e(a,l)},listen(m){if(o)throw new Error("A history only accepts one active listener");return a.addEventListener(_,f),o=m,()=>{a.removeEventListener(_,f),o=null}},createHref(m){return t(a,m)},createURL:v,encodeLocation(m){let x=v(m);return{pathname:x.pathname,search:x.search,hash:x.hash}},push:d,replace:y,go(m){return l.go(m)}};return p}var J;(function(e){e.data="data",e.deferred="deferred",e.redirect="redirect",e.error="error"})(J||(J={}));function se(e,t,n){n===void 0&&(n="/");let r=typeof t=="string"?P(t):t,a=X(r.pathname||"/",n);if(a==null)return null;let i=K(e);ue(i);let l=null;for(let s=0;l==null&&s<i.length;++s)l=ye(i[s],Ee(a));return l}function K(e,t,n,r){t===void 0&&(t=[]),n===void 0&&(n=[]),r===void 0&&(r="");let a=(i,l,s)=>{let o={relativePath:s===void 0?i.path||"":s,caseSensitive:i.caseSensitive===!0,childrenIndex:l,route:i};o.relativePath.startsWith("/")&&(g(o.relativePath.startsWith(r),'Absolute route path "'+o.relativePath+'" nested under path '+('"'+r+'" is not valid. An absolute child route path ')+"must start with the combined path of all its parent routes."),o.relativePath=o.relativePath.slice(r.length));let c=w([r,o.relativePath]),h=n.concat(o);i.children&&i.children.length>0&&(g(i.index!==!0,"Index routes must not have child routes. Please remove "+('all child routes from route path "'+c+'".')),K(i.children,t,h,c)),!(i.path==null&&!i.index)&&t.push({path:c,score:ge(c,i.index),routesMeta:h})};return e.forEach((i,l)=>{var s;if(i.path===""||!((s=i.path)!=null&&s.includes("?")))a(i,l);else for(let o of Q(i.path))a(i,l,o)}),t}function Q(e){let t=e.split("/");if(t.length===0)return[];let[n,...r]=t,a=n.endsWith("?"),i=n.replace(/\?$/,"");if(r.length===0)return a?[i,""]:[i];let l=Q(r.join("/")),s=[];return s.push(...l.map(o=>o===""?i:[i,o].join("/"))),a&&s.push(...l),s.map(o=>e.startsWith("/")&&o===""?"/":o)}function ue(e){e.sort((t,n)=>t.score!==n.score?n.score-t.score:ve(t.routesMeta.map(r=>r.childrenIndex),n.routesMeta.map(r=>r.childrenIndex)))}const ce=/^:\w+$/,he=3,fe=2,de=1,pe=10,me=-2,k=e=>e==="*";function ge(e,t){let n=e.split("/"),r=n.length;return n.some(k)&&(r+=me),t&&(r+=fe),n.filter(a=>!k(a)).reduce((a,i)=>a+(ce.test(i)?he:i===""?de:pe),r)}function ve(e,t){return e.length===t.length&&e.slice(0,-1).every((r,a)=>r===t[a])?e[e.length-1]-t[t.length-1]:0}function ye(e,t){let{routesMeta:n}=e,r={},a="/",i=[];for(let l=0;l<n.length;++l){let s=n[l],o=l===n.length-1,c=a==="/"?t:t.slice(a.length)||"/",h=xe({path:s.relativePath,caseSensitive:s.caseSensitive,end:o},c);if(!h)return null;Object.assign(r,h.params);let f=s.route;i.push({params:r,pathname:w([a,h.pathname]),pathnameBase:Se(w([a,h.pathnameBase])),route:f}),h.pathnameBase!=="/"&&(a=w([a,h.pathnameBase]))}return i}function Qe(e,t){t===void 0&&(t={});let n=e;n.endsWith("*")&&n!=="*"&&!n.endsWith("/*")&&(N(!1,'Route path "'+n+'" will be treated as if it were '+('"'+n.replace(/\*$/,"/*")+'" because the `*` character must ')+"always follow a `/` in the pattern. To get rid of this warning, "+('please change the route path to "'+n.replace(/\*$/,"/*")+'".')),n=n.replace(/\*$/,"/*"));const r=n.startsWith("/")?"/":"",a=l=>l==null?"":typeof l=="string"?l:String(l),i=n.split(/\/+/).map((l,s,o)=>{if(s===o.length-1&&l==="*")return a(t["*"]);const h=l.match(/^:(\w+)(\??)$/);if(h){const[,f,d]=h;let y=t[f];return g(d==="?"||y!=null,'Missing ":'+f+'" param'),a(y)}return l.replace(/\?$/g,"")}).filter(l=>!!l);return r+i.join("/")}function xe(e,t){typeof e=="string"&&(e={path:e,caseSensitive:!1,end:!0});let[n,r]=Ce(e.path,e.caseSensitive,e.end),a=t.match(n);if(!a)return null;let i=a[0],l=i.replace(/(.)\/+$/,"$1"),s=a.slice(1);return{params:r.reduce((c,h,f)=>{let{paramName:d,isOptional:y}=h;if(d==="*"){let p=s[f]||"";l=i.slice(0,i.length-p.length).replace(/(.)\/+$/,"$1")}const v=s[f];return y&&!v?c[d]=void 0:c[d]=Re(v||"",d),c},{}),pathname:i,pathnameBase:l,pattern:e}}function Ce(e,t,n){t===void 0&&(t=!1),n===void 0&&(n=!0),N(e==="*"||!e.endsWith("*")||e.endsWith("/*"),'Route path "'+e+'" will be treated as if it were '+('"'+e.replace(/\*$/,"/*")+'" because the `*` character must ')+"always follow a `/` in the pattern. To get rid of this warning, "+('please change the route path to "'+e.replace(/\*$/,"/*")+'".'));let r=[],a="^"+e.replace(/\/*\*?$/,"").replace(/^\/*/,"/").replace(/[\\.*+^${}|()[\]]/g,"\\$&").replace(/\/:(\w+)(\?)?/g,(l,s,o)=>(r.push({paramName:s,isOptional:o!=null}),o?"/?([^\\/]+)?":"/([^\\/]+)"));return e.endsWith("*")?(r.push({paramName:"*"}),a+=e==="*"||e==="/*"?"(.*)$":"(?:\\/(.+)|\\/*)$"):n?a+="\\/*$":e!==""&&e!=="/"&&(a+="(?:(?=\\/|$))"),[new RegExp(a,t?void 0:"i"),r]}function Ee(e){try{return decodeURI(e)}catch(t){return N(!1,'The URL path "'+e+'" could not be decoded because it is is a malformed URL segment. This is probably due to a bad percent '+("encoding ("+t+").")),e}}function Re(e,t){try{return decodeURIComponent(e)}catch(n){return N(!1,'The value for the URL param "'+t+'" will not be decoded because'+(' the string "'+e+'" is a malformed URL segment. This is probably')+(" due to a bad percent encoding ("+n+").")),e}}function X(e,t){if(t==="/")return e;if(!e.toLowerCase().startsWith(t.toLowerCase()))return null;let n=t.endsWith("/")?t.length-1:t.length,r=e.charAt(n);return r&&r!=="/"?null:e.slice(n)||"/"}function we(e,t){t===void 0&&(t="/");let{pathname:n,search:r="",hash:a=""}=typeof e=="string"?P(e):e;return{pathname:n?n.startsWith("/")?n:Pe(n,t):t,search:be(r),hash:Ue(a)}}function Pe(e,t){let n=t.replace(/\/+$/,"").split("/");return e.split("/").forEach(a=>{a===".."?n.length>1&&n.pop():a!=="."&&n.push(a)}),n.length>1?n.join("/"):"/"}function W(e,t,n,r){return"Cannot include a '"+e+"' character in a manually specified "+("`to."+t+"` field ["+JSON.stringify(r)+"].  Please separate it out to the ")+("`to."+n+"` field. Alternatively you may provide the full path as ")+'a string in <Link to="..."> and the router will parse it for you.'}function Y(e){return e.filter((t,n)=>n===0||t.route.path&&t.route.path.length>0)}function Z(e,t,n,r){r===void 0&&(r=!1);let a;typeof e=="string"?a=P(e):(a=S({},e),g(!a.pathname||!a.pathname.includes("?"),W("?","pathname","search",a)),g(!a.pathname||!a.pathname.includes("#"),W("#","pathname","hash",a)),g(!a.search||!a.search.includes("#"),W("#","search","hash",a)));let i=e===""||a.pathname==="",l=i?"/":a.pathname,s;if(l==null)s=n;else if(r){let f=t[t.length-1].replace(/^\//,"").split("/");if(l.startsWith("..")){let d=l.split("/");for(;d[0]==="..";)d.shift(),f.pop();a.pathname=d.join("/")}s="/"+f.join("/")}else{let f=t.length-1;if(l.startsWith("..")){let d=l.split("/");for(;d[0]==="..";)d.shift(),f-=1;a.pathname=d.join("/")}s=f>=0?t[f]:"/"}let o=we(a,s),c=l&&l!=="/"&&l.endsWith("/"),h=(i||l===".")&&n.endsWith("/");return!o.pathname.endsWith("/")&&(c||h)&&(o.pathname+="/"),o}const w=e=>e.join("/").replace(/\/\/+/g,"/"),Se=e=>e.replace(/\/+$/,"").replace(/^\/*/,"/"),be=e=>!e||e==="?"?"":e.startsWith("?")?e:"?"+e,Ue=e=>!e||e==="#"?"":e.startsWith("#")?e:"#"+e;function Be(e){return e!=null&&typeof e.status=="number"&&typeof e.statusText=="string"&&typeof e.internal=="boolean"&&"data"in e}const H=["post","put","patch","delete"];new Set(H);const Ie=["get",...H];new Set(Ie);/**
 * React Router v6.19.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function B(){return B=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},B.apply(this,arguments)}const F=u.createContext(null),Ne=u.createContext(null),L=u.createContext(null),$=u.createContext(null),R=u.createContext({outlet:null,matches:[],isDataRoute:!1}),ee=u.createContext(null);function b(){return u.useContext($)!=null}function V(){return b()||g(!1),u.useContext($).location}function te(e){u.useContext(L).static||u.useLayoutEffect(e)}function Le(){let{isDataRoute:e}=u.useContext(R);return e?ze():$e()}function $e(){b()||g(!1);let e=u.useContext(F),{basename:t,navigator:n}=u.useContext(L),{matches:r}=u.useContext(R),{pathname:a}=V(),i=JSON.stringify(Y(r).map(o=>o.pathnameBase)),l=u.useRef(!1);return te(()=>{l.current=!0}),u.useCallback(function(o,c){if(c===void 0&&(c={}),!l.current)return;if(typeof o=="number"){n.go(o);return}let h=Z(o,JSON.parse(i),a,c.relative==="path");e==null&&t!=="/"&&(h.pathname=h.pathname==="/"?t:w([t,h.pathname])),(c.replace?n.replace:n.push)(h,c.state,c)},[t,n,i,a,e])}function Xe(){let{matches:e}=u.useContext(R),t=e[e.length-1];return t?t.params:{}}function Oe(e,t){return Te(e,t)}function Te(e,t,n){b()||g(!1);let{navigator:r}=u.useContext(L),{matches:a}=u.useContext(R),i=a[a.length-1],l=i?i.params:{};i&&i.pathname;let s=i?i.pathnameBase:"/";i&&i.route;let o=V(),c;if(t){var h;let p=typeof t=="string"?P(t):t;s==="/"||(h=p.pathname)!=null&&h.startsWith(s)||g(!1),c=p}else c=o;let f=c.pathname||"/",d=s==="/"?f:f.slice(s.length)||"/",y=se(e,{pathname:d}),v=Ve(y&&y.map(p=>Object.assign({},p,{params:Object.assign({},l,p.params),pathname:w([s,r.encodeLocation?r.encodeLocation(p.pathname).pathname:p.pathname]),pathnameBase:p.pathnameBase==="/"?s:w([s,r.encodeLocation?r.encodeLocation(p.pathnameBase).pathname:p.pathnameBase])})),a,n);return t&&v?u.createElement($.Provider,{value:{location:B({pathname:"/",search:"",hash:"",state:null,key:"default"},c),navigationType:E.Pop}},v):v}function We(){let e=ke(),t=Be(e)?e.status+" "+e.statusText:e instanceof Error?e.message:JSON.stringify(e),n=e instanceof Error?e.stack:null,a={padding:"0.5rem",backgroundColor:"rgba(200,200,200, 0.5)"},i=null;return u.createElement(u.Fragment,null,u.createElement("h2",null,"Unexpected Application Error!"),u.createElement("h3",{style:{fontStyle:"italic"}},t),n?u.createElement("pre",{style:a},n):null,i)}const je=u.createElement(We,null);class Me extends u.Component{constructor(t){super(t),this.state={location:t.location,revalidation:t.revalidation,error:t.error}}static getDerivedStateFromError(t){return{error:t}}static getDerivedStateFromProps(t,n){return n.location!==t.location||n.revalidation!=="idle"&&t.revalidation==="idle"?{error:t.error,location:t.location,revalidation:t.revalidation}:{error:t.error||n.error,location:n.location,revalidation:t.revalidation||n.revalidation}}componentDidCatch(t,n){console.error("React Router caught the following error during render",t,n)}render(){return this.state.error?u.createElement(R.Provider,{value:this.props.routeContext},u.createElement(ee.Provider,{value:this.state.error,children:this.props.component})):this.props.children}}function Fe(e){let{routeContext:t,match:n,children:r}=e,a=u.useContext(F);return a&&a.static&&a.staticContext&&(n.route.errorElement||n.route.ErrorBoundary)&&(a.staticContext._deepestRenderedBoundaryId=n.route.id),u.createElement(R.Provider,{value:t},r)}function Ve(e,t,n){var r;if(t===void 0&&(t=[]),n===void 0&&(n=null),e==null){var a;if((a=n)!=null&&a.errors)e=n.matches;else return null}let i=e,l=(r=n)==null?void 0:r.errors;if(l!=null){let s=i.findIndex(o=>o.route.id&&(l==null?void 0:l[o.route.id]));s>=0||g(!1),i=i.slice(0,Math.min(i.length,s+1))}return i.reduceRight((s,o,c)=>{let h=o.route.id?l==null?void 0:l[o.route.id]:null,f=null;n&&(f=o.route.errorElement||je);let d=t.concat(i.slice(0,c+1)),y=()=>{let v;return h?v=f:o.route.Component?v=u.createElement(o.route.Component,null):o.route.element?v=o.route.element:v=s,u.createElement(Fe,{match:o,routeContext:{outlet:s,matches:d,isDataRoute:n!=null},children:v})};return n&&(o.route.ErrorBoundary||o.route.errorElement||c===0)?u.createElement(Me,{location:n.location,revalidation:n.revalidation,component:f,error:h,children:y(),routeContext:{outlet:null,matches:d,isDataRoute:!0}}):y()},null)}var ne=function(e){return e.UseBlocker="useBlocker",e.UseRevalidator="useRevalidator",e.UseNavigateStable="useNavigate",e}(ne||{}),I=function(e){return e.UseBlocker="useBlocker",e.UseLoaderData="useLoaderData",e.UseActionData="useActionData",e.UseRouteError="useRouteError",e.UseNavigation="useNavigation",e.UseRouteLoaderData="useRouteLoaderData",e.UseMatches="useMatches",e.UseRevalidator="useRevalidator",e.UseNavigateStable="useNavigate",e.UseRouteId="useRouteId",e}(I||{});function _e(e){let t=u.useContext(F);return t||g(!1),t}function De(e){let t=u.useContext(Ne);return t||g(!1),t}function Je(e){let t=u.useContext(R);return t||g(!1),t}function re(e){let t=Je(),n=t.matches[t.matches.length-1];return n.route.id||g(!1),n.route.id}function ke(){var e;let t=u.useContext(ee),n=De(I.UseRouteError),r=re(I.UseRouteError);return t||((e=n.errors)==null?void 0:e[r])}function ze(){let{router:e}=_e(ne.UseNavigateStable),t=re(I.UseNavigateStable),n=u.useRef(!1);return te(()=>{n.current=!0}),u.useCallback(function(a,i){i===void 0&&(i={}),n.current&&(typeof a=="number"?e.navigate(a):e.navigate(a,B({fromRouteId:t},i)))},[e,t])}function Ye(e){let{to:t,replace:n,state:r,relative:a}=e;b()||g(!1);let{matches:i}=u.useContext(R),{pathname:l}=V(),s=Le(),o=Z(t,Y(i).map(h=>h.pathnameBase),l,a==="path"),c=JSON.stringify(o);return u.useEffect(()=>s(JSON.parse(c),{replace:n,state:r,relative:a}),[s,c,a,n,r]),null}function Ae(e){g(!1)}function qe(e){let{basename:t="/",children:n=null,location:r,navigationType:a=E.Pop,navigator:i,static:l=!1}=e;b()&&g(!1);let s=t.replace(/^\/*/,"/"),o=u.useMemo(()=>({basename:s,navigator:i,static:l}),[s,i,l]);typeof r=="string"&&(r=P(r));let{pathname:c="/",search:h="",hash:f="",state:d=null,key:y="default"}=r,v=u.useMemo(()=>{let p=X(c,s);return p==null?null:{location:{pathname:p,search:h,hash:f,state:d,key:y},navigationType:a}},[s,c,h,f,d,y,a]);return v==null?null:u.createElement(L.Provider,{value:o},u.createElement($.Provider,{children:n,value:v}))}function Ze(e){let{children:t,location:n}=e;return Oe(M(t),n)}new Promise(()=>{});function M(e,t){t===void 0&&(t=[]);let n=[];return u.Children.forEach(e,(r,a)=>{if(!u.isValidElement(r))return;let i=[...t,a];if(r.type===u.Fragment){n.push.apply(n,M(r.props.children,i));return}r.type!==Ae&&g(!1),!r.props.index||!r.props.children||g(!1);let l={id:r.props.id||i.join("-"),caseSensitive:r.props.caseSensitive,element:r.props.element,Component:r.props.Component,index:r.props.index,path:r.props.path,loader:r.props.loader,action:r.props.action,errorElement:r.props.errorElement,ErrorBoundary:r.props.ErrorBoundary,hasErrorBoundary:r.props.ErrorBoundary!=null||r.props.errorElement!=null,shouldRevalidate:r.props.shouldRevalidate,handle:r.props.handle,lazy:r.props.lazy};r.props.children&&(l.children=M(r.props.children,i)),n.push(l)}),n}/**
 * React Router DOM v6.19.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */const Ge="startTransition",z=ae[Ge];function He(e){let{basename:t,children:n,future:r,window:a}=e,i=u.useRef();i.current==null&&(i.current=ie({window:a,v5Compat:!0}));let l=i.current,[s,o]=u.useState({action:l.action,location:l.location}),{v7_startTransition:c}=r||{},h=u.useCallback(f=>{c&&z?z(()=>o(f)):o(f)},[o,c]);return u.useLayoutEffect(()=>l.listen(h),[l,h]),u.createElement(qe,{basename:t,children:n,location:s.location,navigationType:s.action,navigator:l})}var A;(function(e){e.UseScrollRestoration="useScrollRestoration",e.UseSubmit="useSubmit",e.UseSubmitFetcher="useSubmitFetcher",e.UseFetcher="useFetcher",e.useViewTransitionState="useViewTransitionState"})(A||(A={}));var q;(function(e){e.UseFetcher="useFetcher",e.UseFetchers="useFetchers",e.UseScrollRestoration="useScrollRestoration"})(q||(q={}));export{He as B,Ye as N,Ze as R,Le as a,Ae as b,Qe as g,Xe as u};
//# sourceMappingURL=@react-router-4ABj5O5c.js.map
