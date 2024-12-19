import { Router } from "express";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  addReview,
} from "../controllers/productController.js";
import { isAdmin, isAuthenticated } from "../middlewares/auth.js";
import { uploadImage } from "../controllers/uploadController.js";
import upload from "../middlewares/upload.js";

const router = Router();

router.post("/product/create", isAdmin, createProduct);
router.put("/product/update", isAdmin, updateProduct);
router.delete("/product/delete", isAdmin, deleteProduct);
router.get("/products", getProducts);
router.post("/product/:id/review", isAuthenticated, addReview);

// Маршрут для загрузки изображений
router.post("/upload", upload.single("image"), uploadImage);

export default router;
