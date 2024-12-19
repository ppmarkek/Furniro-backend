import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: false,
    },
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    label: { type: String },
    imgs: { type: [String] },
    size: { type: [String] },
    color: { type: [String] },
    quantity: { type: Number, required: true },
    sku: { type: String, unique: true, required: true },
    category: { type: String, required: true },
    tags: { type: [String] },
    description: { type: String },
    additionalInformation: { type: String },
    reviews: [reviewSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
