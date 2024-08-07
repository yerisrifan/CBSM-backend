const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
  {
    owner_name: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      //required: true,
    },
    avatar: {
      type: String,
      default: "uploads/assets/default.png",
    },
    user_level: {
      type: Number, // 0: normal user, 1: member, 2: admin user
      default: 0,
    },
    address: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    phone: {
      type: Number,
      default: "",
    },
    farm_name: {
      type: String,
      default: "",
    },
    ring_code: {
      type: String,
      default: "",
    },
    fcm_token: {
      type: String,
      default: "",
    },
    notification: {
      fcm_token: {
        type: String,
        default: "",
      },
      os: {
        type: String,
        default: "",
      },
      deviceName: {
        type: String,
        default: "",
      },
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();
  delete userObject.password;
  return userObject;
};

// create middleware to delete all user's canaries,pair , incubation and eggs if user deleted
userSchema.pre("remove", async function (next) {
  const user = this;
  await user.model("Canary").deleteMany({ owner: user._id });
  await user.model("Pair").deleteMany({ owner: user._id });
  await user.model("Incubation").deleteMany({ owner: user._id });
  await user.model("Egg").deleteMany({ owner: user._id });
  next();
});

module.exports = mongoose.model("User", userSchema);
