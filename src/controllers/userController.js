import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const createUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = new User({ email, password, role: "user" });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getUsers = async (_req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Генерация Access Token
function generateAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
}

// Генерация Refresh Token
function generateRefreshToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
}

// Вход пользователя
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Проверяем есть ли пользователь
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Проверяем пароль
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Генерируем токены
    const userObject = user.toObject();
    const { password: _, ...userWithoutPassword } = userObject;

    const accessToken = generateAccessToken(userWithoutPassword);
    const refreshToken = generateRefreshToken(userWithoutPassword);

    res.json({ accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Обновление токена по refreshToken
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Refresh token is required" });

    // Верифицируем рефреш-токен
    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, decoded) => {
        if (err)
          return res.status(403).json({ message: "Invalid refresh token" });

        const newAccessToken = generateAccessToken(decoded.userId);
        res.json({ accessToken: newAccessToken });
      }
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addFavorite = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res
        .status(400)
        .send({ message: "User ID and Product ID are required." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { wishlist: productId } },
      { new: true, useFindAndModify: false }
    );

    if (!updatedUser) {
      return res.status(404).send({
        message: `Cannot update wishlist. User with ID=${userId} not found.`,
      });
    }

    res.send({
      message: "Item was added to wishlist",
      wishlist: updatedUser.wishlist,
    });
  } catch (error) {
    console.error("Error updating wishlist:", error);
    res.status(500).send({
      message: "An error occurred while updating the wishlist.",
      error: error.message,
    });
  }
};

export const updateUserData = async (req, res) => {
  try {
    const {
      userId,
      firstName,
      lastName,
      email,
      phone,
      password,
      companyName,
      address,
      oldPassword,
    } = req.body;

    // Проверяем наличие userId
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Находим пользователя в базе
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Подготавливаем поля для обновления
    const updateFields = {
      firstName,
      lastName,
      phone,
      companyName,
      address,
    };

    let isPasswordChange = false;
    let isEmailChange = false;

    if (password && password.trim() !== "") {
      isPasswordChange = true;
    }

    if (email && email.trim() !== "" && email !== user.email) {
      isEmailChange = true;
      updateFields.email = email;
    }

    // Если пользователь хочет изменить email или пароль, необходима проверка старого пароля
    if (isPasswordChange || isEmailChange) {
      if (!oldPassword) {
        return res
          .status(400)
          .json({
            message: "Old password is required to change email or password.",
          });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Old password is incorrect." });
      }

      // Если меняется пароль, хэшируем его
      if (isPasswordChange) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        updateFields.password = hashedPassword;
      }
    }

    // Выполняем обновление
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "User data updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user data:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
