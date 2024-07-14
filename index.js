const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const session = require("express-session");
const cookieParser = require("cookie-parser");

// const route
const eggRoutes = require("./routes/eggs.routes");

const connectDB = require("./config/database");

connectDB();
const PORT = process.env.PORT || 5000;

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
app.use("/api/eggs", eggRoutes);
app.use("/api/incubation", require("./routes/incubation.routes"));
app.use("/api/guides", require("./routes/guide.routes"));
app.use("/api/ring", require("./routes/ring.routes"));

// running the server
app.listen(PORT, () => {
  console.log(`🚀 Server Running on port ${PORT}`);
});
