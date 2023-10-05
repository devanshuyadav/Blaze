const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const bodyParser = require("body-parser");

const cors = require("cors");

const uploadRouter = require("./routes/uploadRoute");
const importRouter = require("./routes/importRoute");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

app.use("/upload", uploadRouter);
app.use("/import", importRouter);

app.get("/", (req, res) => {
    res.send("Beep Boop! Blaze Server is working.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
