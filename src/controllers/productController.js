import Product from "../models/Product.js";
import User from "../models/User.js";
import Fuse from "fuse.js";
import mongoose from "mongoose";

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

export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.body;

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({
        message: `Cannot delete Product with id=${productId}. Maybe Product was not found!`,
      });
    }

    res.json({ message: "Product was deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: `Could not delete Product with id=${req.body.productId}`,
    });
  }
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
        keys: ["title", "label", "description", "tags", "review.userName"],
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

export const addReview = async (req, res) => {
  try {
    const { productId, stars, description } = req.body;
    const userId = req.user.id; // Предполагается, что аутентификация добавляет `user` в `req`

    // Проверка наличия продукта
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Проверка, добавлял ли пользователь уже отзыв к этому продукту
    const alreadyReviewed = product.reviews.find(
      (rev) => rev.user.toString() === userId.toString()
    );

    if (alreadyReviewed) {
      return res
        .status(400)
        .json({ message: "You have already added a review for this product." });
    }

    // Получение информации о пользователе
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Создание нового отзыва
    const newReview = {
      user: userId,
      userName: `${user.firstName} ${user.lastName}`, // Предполагается, что в модели User есть поле `name`
      stars: Number(stars),
      description,
    };

    // Добавление отзыва в массив отзывов продукта
    product.reviews.push(newReview);

    // Обновление общего рейтинга продукта (если необходимо)
    product.rating =
      product.reviews.reduce((acc, item) => item.stars + acc, 0) /
      product.reviews.length;

    // Сохранение изменений
    await product.save();

    res
      .status(201)
      .json({ message: "Review added successfully.", review: newReview });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};
