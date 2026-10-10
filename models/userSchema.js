const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");


const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },

    passwordHash: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      default: null
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
      default: null
    },

    role: {
      type: String,
      enum: ["customer", "user", "admin"],
      default: "customer"
    },

    resetPasswordCode: {
      type: String,
      default: null
    },

    resetPasswordExpires: {
      type: Date,
      default: null
    },

    // Optional legacy helper fields for existing controllers/views
    firstName: {
      type: String,
      trim: true,
      default: ""
    },

    lastName: {
      type: String,
      trim: true,
      default: ""
    },

    avatar: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true // provides createdAt : Date, updatedAt : Date
  }
);

// Method: +comparePassword(password : String) : Boolean
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to hash password
userSchema.statics.hashPassword = async function (password) {
  return bcrypt.hash(password, 10);
};

module.exports = mongoose.model("User", userSchema);