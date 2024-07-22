const mongoose = require("mongoose");

const canarySchema = mongoose.Schema(
  {
    id: {
      type: String,
    },
    data: {
      date_of_banding: {
        type: Date,
        default: Date.now,
      },
      date_of_birth: {
        type: Date,
      },
      ring: {
        type: String,
        default: "",
      },
      seri: {
        type: String,
        default: null,
      },
      ring_alt: {
        type: String,
        default: null,
      },
      gender: {
        type: String,
        enum: ["unknown", "M", "F"],
        default: "unknown",
      },
      avatar: {
        type: String,
        default: "uploads/assets/default-bird.png",
      },
      status: {
        type: Number,
        default: 0,
      },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rels: {
      father: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Canary",
        default: null,
      },
      mother: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Canary",
        default: null,
      },
      spouses: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Canary",
          default: null,
        },
      ],
      children: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Canary",
          default: null,
        },
      ],
    },
  },
  { timestamps: true }
);

canarySchema.index({ id: 1, owner: 1, "data.gender": 1 });

// Middleware to generate id from _id if not provided
canarySchema.pre("save", function (next) {
  if (!this.id) {
    this.id = this._id.toHexString();
  }
  next();
});

// midleware untuk mengubah data ring menjadi uppercase sebelum di save
function toUpperCase(obj) {
  if (obj.ring) obj.ring = obj.ring.toUpperCase();
  if (obj.ring_alt) obj.ring_alt = obj.ring_alt.toUpperCase();
  if (obj.seri) obj.seri = obj.seri.toUpperCase();
}

canarySchema.pre("save", function (next) {
  toUpperCase(this);
  next();
});

canarySchema.pre("findByIdAndUpdate", function (next) {
  if (this._update) {
    toUpperCase(this._update);
  }
  next();
});

canarySchema.pre("updateOne", function (next) {
  if (this._update) {
    toUpperCase(this._update);
  }
  next();
});

canarySchema.pre("updateMany", function (next) {
  if (this._update) {
    toUpperCase(this._update);
  }
  next();
});

// Middleware to add base URL on avatar before sending response
canarySchema.methods.toJSON = function () {
  const canary = this;
  const canaryObject = canary.toObject();

  canaryObject.data.avatar = `${process.env.BASE_URL}/${canaryObject.data.avatar}`;

  return canaryObject;
};

// middleware to delete avatar files when canary is deleted
canarySchema.pre("remove", async function (next) {
  const canary = this;
  if (canary.data.avatar !== "uploads/assets/default-bird.png") {
    await fs.unlink(canary.data.avatar, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }
  next();
});

module.exports = mongoose.model("Canary", canarySchema);
