const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const morgan = require("morgan");
const cors = require("cors");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");

const connectDB = require("./config/database");

connectDB();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(morgan("dev"));
app.use(cors());
app.set("views", "views");
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.static("static"));
app.use("/uploads", express.static("uploads"));
app.use(
  "/uploads/assets",
  express.static(path.join(__dirname, "/uploads/assets"))
);

// router
app.use("/", require("./routes/index"));
app.use("/api/upload", require("./routes/upload.routes"));
app.use("/api/user", require("./routes/user.routes"));
app.use("/api/canary", require("./routes/canary.routes"));
app.use("/api/pair", require("./routes/pair.routes"));
app.use("/api/eggs", require("./routes/eggs.routes"));
app.use("/api/incubation", require("./routes/incubation.routes"));

// running the server
app.listen(PORT, () => {
  console.log(`🚀 Server Running on port ${PORT}`);
});
