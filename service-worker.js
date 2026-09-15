const CACHE_NAME="vishwakarma-v5";
const APP_SHELL=["/","/index.html","/products.html","/product.html","/offline.html","/manifest.json","/css/main.css","/css/components.css","/css/responsive.css","/css/animations.css","/css/product-detail.css","/css/sprint3.css","/css/production.css","/js/app.js","/js/layout.js","/js/translations.js","/js/products.js","/js/product.js","/js/product-repository.js","/images/logo.png","/images/app-icon.svg","/images/shop1.jpeg","/images/shop2.jpeg","/images/shop3.jpeg"];
const isCacheable=response=>response&&response.ok&&response.type==="basic";
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  if(event.request.mode==="navigate"){
    event.respondWith(
      fetch(event.request,{cache:"no-store"})
        .then(response=>{
          if(isCacheable(response)){
            const copy=response.clone();
            caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
          }
          return response;
        })
        .catch(async()=>await caches.match(event.request)||await caches.match(new URL(event.request.url).pathname)||await caches.match("/offline.html"))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
      if(isCacheable(response)){
        const copy=response.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
      }
      return response;
    }))
  );
});
