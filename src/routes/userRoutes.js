import { Router } from "express";
import {
  createUser,
  getUsers,
  loginUser,
  refreshToken,
  addFavorite,
  updateUserData,
} from "../controllers/userController.js";

const router = Router();

router.post("/user/create", createUser);
router.get("/users", getUsers);
router.post("/user/login", loginUser);
router.post("/user/refresh", refreshToken);
router.post("/user/wishlist", addFavorite);
router.put("/user/update", updateUserData);

export default router;
