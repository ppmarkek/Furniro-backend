import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please fill a valid email address"],
    },
    phone: {
      type: String,
      match: [/^\+?[1-9]\d{1,14}$/, "Please fill a valid phone number"],
    },
    password: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
    },
    address: {
      country: String,
      city: String,
      streetAddress: String,
      zipCode: String,
    },
    role: {
      type: String,
    },
    wishlist: [],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("User", userSchema);
