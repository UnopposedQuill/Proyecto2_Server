import mongoose, { Schema } from "mongoose";

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  authToken: {
    type: String
  }
});

// Export the Mongoose model for Actor
const UserModel = mongoose.model("User", UserSchema);
export default UserModel;
