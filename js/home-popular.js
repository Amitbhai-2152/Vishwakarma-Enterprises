document.addEventListener("DOMContentLoaded",()=>{
  const target=document.getElementById("featured-products");
  if(!target)return;
  const showPopular=()=>{
    if(!Array.isArray(productData)||typeof card!=="function")return false;
    const popular=productData.filter(product=>product.featured);
    const items=(popular.length?popular:productData).slice(0,4);
    if(!items.length)return false;
    target.innerHTML=items.map(card).join("");
    return true;
  };
  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    if(showPopular()||attempts>=30)clearInterval(timer);
  },200);
});
