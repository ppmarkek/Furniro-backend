import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

// Получаем текущую директорию (для ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Папка для сохранения файлов
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    // Генерируем уникальное имя файла
    const uniqueSuffix = uuidv4(); // Используем uuid для уникальности
    const ext = path.extname(file.originalname); // получаем расширение файла
    cb(null, uniqueSuffix + ext);
  },
});

// Фильтрация типов файлов (опционально)
function fileFilter(req, file, cb) {
  // Проверяем, является ли файл изображением
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"), false);
  }
}

const upload = multer({ storage, fileFilter });

export default upload;
