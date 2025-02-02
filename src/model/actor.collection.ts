import mongoose, { Schema } from "mongoose";

const ActorSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  biography: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  images: {
    type: [
      {
        url: {
          type: String,
          required: true,
        },
        isCover: {
          type: Boolean,
          required: true,
        },
      },
    ],
  },
});

// Export the Mongoose model for Actor
const ActorModel = mongoose.model("Actor", ActorSchema);
export default ActorModel;
