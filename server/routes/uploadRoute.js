const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadControl } = require("../controllers/uploadController");

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads"); // Create the file in "uploads" directory in the project root
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});
const upload = multer({ storage: storage });

router.route("/").post(upload.single("CSVFile"), uploadControl);
module.exports = router;
