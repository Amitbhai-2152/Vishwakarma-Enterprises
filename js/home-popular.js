document.addEventListener("DOMContentLoaded",()=>{
  const target=document.getElementById("featured-products");
  if(!target)return;
  const showPopular=()=>{
    if(!Array.isArray(window.productDataForHome)||typeof window.renderHomeProductCard!=="function")return;
    target.innerHTML=window.productDataForHome.slice(0,4).map(window.renderHomeProductCard).join("");
  };
  setTimeout(showPopular,300);
  window.addEventListener("productsLoaded",showPopular);
});
