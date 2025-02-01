import mongoose, { Schema } from "mongoose";

const ActorSubSchema: Schema = new Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
});

const ImageSubSchema: Schema = new Schema({
  url: {
    type: String,
    required: true,
  },
  isCover: {
    type: Boolean,
    required: true,
  },
});

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
  cast: {
    type: [ActorSubSchema],
  },
  images: {
    type: [ImageSubSchema],
  },
});

// Export the Mongoose model for Movie
const MovieModel = mongoose.model("Movie", MovieSchema);

export default MovieModel;
