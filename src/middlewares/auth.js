import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.body.userId);

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    if (user.role === "admin") {
      next();
    } else {
      res.status(403).send({ message: "Require Admin Role!" });
    }
  } catch (err) {
    res.status(500).send({ message: err });
  }
};

export const isAuthenticated = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Проверка, что decoded.userId существует и содержит _id
      if (!decoded.userId || !decoded.userId._id) {
        return res
          .status(401)
          .json({ message: "Invalid authentication token." });
      }

      // Поиск пользователя по _id
      req.user = await User.findById(decoded.userId._id).select("-password");

      if (!req.user) {
        return res.status(404).json({ message: "User not found." });
      }

      next();
    } catch (err) {
      console.error("JWT Verification Error:", err);
      res.status(401).json({ message: "Invalid authentication token." });
    }
  } else {
    res.status(401).json({ message: "No authentication token provided." });
  }
};
