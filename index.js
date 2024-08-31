const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const expressLayouts = require("express-ejs-layouts");
const helmet = require("helmet");
const path = require("path");
const session = require("express-session");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/database"); // Koneksi database v1 (lama)

connectDB();

// run schedule
require("./utils/scheduler");

const PORT = process.env.PORT || 5000;
app.use(helmet());
// setup session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    name: "_session",
    proxy: true,
    resave: true,
    saveUninitialized: true,
  })
);
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
    limit: "50mb",
  })
);
app.use(
  morgan("tiny", {
    skip: (req, res) => {
      // Define file extensions to skip
      const skipExtensions = [
        ".css",
        ".js",
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".svg",
        ".ico",
        ".json",
        ".map",
        ".md",
      ];
      return (
        skipExtensions.some((ext) => req.url.endsWith(ext)) ||
        req.url.startsWith("/public")
      );
    },
  })
);
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
app.use("/api/guides", require("./routes/guide.routes"));
app.use("/api/ring", require("./routes/ring.routes"));

// running the server
app.listen(PORT, () => {
  console.log(`🚀 Server Running on port ${PORT}`);
});
