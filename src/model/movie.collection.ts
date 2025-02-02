import mongoose, { Schema } from "mongoose";
import ActorModel from "./actor.collection";

const MovieSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  genre: {
    type: String,
    required: true,
  },
  director: {
    type: String,
    required: true,
  },
  releaseYear: {
    type: Number,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  cast: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: ActorModel.modelName, // Reference to the Actor model
    },
  ],
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

// Export the Mongoose model for Movie and Actor
const MovieModel = mongoose.model("Movie", MovieSchema);
export default MovieModel;
