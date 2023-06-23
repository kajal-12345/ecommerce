const deleteProduct = (btn) =>{
const productId = btn.parentNode.querySelector('[name=productId').value;
const productEle = btn.parentNode;

fetch('/admin/product/' + productId , {
    method:"DELETE"
}).then(result => {
    // console.log(result);
    return result.json();
}).then(data=> {
    console.log(data);
    productEle.parentNode.removeChild(productEle);
}).catch(err => {
    console.log(err);
})
};