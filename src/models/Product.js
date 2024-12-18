import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: String,
    label: String,
    imgs: Array,
    size: Array,
    color: Array,
    quantity: Number,
    sku: String,
    category: String,
    tags: Array,
    description: String,
    additionalInformation: String,
    review: {
      userName: String,
      stars: Number,
      description: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
