import ProductData from "./ProductData.mjs";
import ProductList from "./ProductList.mjs";

// Create an instance of ProductData for the tents category
const dataSource = new ProductData("tents");

// Get the product list element
const listElement = document.querySelector(".product-list");

// Create an instance of ProductList and initialize it
const productList = new ProductList("tents", dataSource, listElement);
productList.init();
