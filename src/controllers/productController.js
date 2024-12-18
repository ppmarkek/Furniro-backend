import Product from "../models/Product.js";
import User from "../models/User.js";
import Fuse from "fuse.js";


const generateSKU = async (category) => {
  const prefix = category.substring(0, 3).toUpperCase();
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  const sku = `${prefix}-${randomNumber}`;

  // Проверяем уникальность SKU
  const existingProduct = await Product.findOne({ sku });
  if (existingProduct) {
    // Рекурсивно вызываем функцию, если SKU уже существует
    return generateSKU(category);
  }

  return sku;
};

export const createProduct = async (req, res) => {
  try {
    const productData = req.body;

    // Обновляем данные пользователя и получаем информацию о роли
    const userData = await User.findById(productData.userId);

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    // Генерация уникального SKU
    const sku = await generateSKU(productData.category);

    const product = new Product({
      title: productData.title,
      label: productData.label,
      imgs: productData.imgs,
      size: productData.size,
      color: productData.color,
      quantity: productData.quantity,
      sku: sku,
      category: productData.category,
      tags: productData.tags,
      description: productData.description,
      additionalInformation: productData.additionalInformation,
      review: {
        userName: productData.review.userName,
        stars: productData.review.stars,
        description: productData.review.description,
      },
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const productData = req.body;
    const userData = await User.findById(productData.userId);

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const product = {
      title: productData.title,
      label: productData.label,
      imgs: productData.imgs,
      size: productData.size,
      color: productData.color,
      quantity: productData.quantity,
      sku: productData.sku,
      category: productData.category,
      tags: productData.tags,
      description: productData.description,
      additionalInformation: productData.additionalInformation,
      review: {
        userName: productData.review.userName,
        stars: productData.review.stars,
        description: productData.review.description,
      },
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      productData.productId,
      { $set: product },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.status(200).json({
      message: "Product data updated successfully.",
      product: updatedProduct,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const deleteProduct = (req, res) => {
  const { id } = req.body;

  Product.findByIdAndRemove(id, { useFindAndModify: false })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot delete Product with id=${id}. Maybe Product was not found!`,
        });
      } else {
        res.send({
          message: "Product was deleted successfully!",
        });
      }
    })
    .catch(() => {
      res.status(500).send({
        message: `Could not delete Product with id=${id}`,
      });
    });
};

export const getProducts = async (req, res) => {
    try {
      const { category, sku, search } = req.query;
      let filter = {};
  
      if (category) {
        filter.category = category;
      }
  
      if (sku) {
        filter.sku = sku;
      }
  
      const products = await Product.find(filter).lean(); 
  
      if (search) {
        const options = {
          keys: [
            "title",
            "label",
            "description",
            "tags",
            "review.userName"
          ],
          threshold: 0.3, // Adjust threshold for fuzziness (0 = exact match, 1 = match all)
          includeScore: true, // Optionally include score to sort by relevance
        };
  
        // Initialize Fuse.js
        const fuse = new Fuse(products, options);
  
        // Perform the search
        const result = fuse.search(search);
  
        // Extract the original product objects from the search results
        const fuzzyProducts = result.map(({ item }) => item);
  
        return res.json(fuzzyProducts);
      }
  
      // If no search term, return the filtered products
      res.json(products);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };