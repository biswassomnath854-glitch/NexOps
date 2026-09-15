const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const uploadDirectory = path.resolve(
  __dirname,
  "../../uploads/tasks"
);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "text/csv": [".csv"],
  "text/plain": [".txt"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
};

const ALLOWED_EXTENSIONS = [
  ...new Set(
    Object.values(ALLOWED_FILE_TYPES).flat()
  ),
];

const POWER_SHELL_GENERIC_MIME_TYPE =
  "application/octet-stream";

const allowedMimeTypes = Object.keys(ALLOWED_FILE_TYPES);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${extension}`;

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const allowedExtensions =
    ALLOWED_FILE_TYPES[file.mimetype];

  const isStandardMimeMatch =
    Boolean(allowedExtensions) &&
    allowedExtensions.includes(extension);

  const isPowerShellGenericMime =
    file.mimetype === POWER_SHELL_GENERIC_MIME_TYPE &&
    ALLOWED_EXTENSIONS.includes(extension);

  if (
    !isStandardMimeMatch &&
    !isPowerShellGenericMime
  ) {
    const error = new Error(
      "Unsupported file type."
    );

    error.statusCode = 400;
    error.code = "UNSUPPORTED_FILE_TYPE";

    return cb(error);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

module.exports = {
  upload,
  uploadDirectory,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  allowedMimeTypes,
};