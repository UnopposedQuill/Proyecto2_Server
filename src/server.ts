import mongoose, { mongo, Mongoose } from "mongoose";
import express, { Request, Response } from "express";
import cors from "cors";
import MovieModel from "./model/movie.collection";
import dotenv from 'dotenv';

const app = express();
const port = 3000;

app.use(express.json());
// Allow cors usages from these hosts and ports.
app.use(cors({ origin: "http://localhost:4200" }));

app.get("/", (request: Request, response: Response, next: () => any) => {
  response.status(200).json({ message: "Server ping response" });
});

/**
 * This method should be supplied to all mechanisms which require for authentication.
 * @param request The request which needs authentication checks
 * @param response The response
 * @param next If the check is clear then the next handler will be called.
 */
const authenticationMiddleware = (
  request: Request,
  response: Response,
  next: () => any
) => {
  // TODO: Increase security
  if (request.headers.authorization === "Basic Esteban:SomePassword") {
    next(); // allows for next request to proceed
  } else {
    response.status(401).json({ message: "User authentication failed" });
  }
};

/**
 * Responses for Movies
 */
app.get("/movies", async (request: Request, response: Response) => {
  console.log("Request for all movies received");
  const movies = await MovieModel.find({}).lean().exec();
  response.status(200).json(movies);
  console.log(`Request for all movies processed. Returned ${movies.length}`);
});

app.post(
  "/movies",
  //authenticationMiddleware,
  (request: Request, response: Response, next: () => any) => {
    console.log(`Creating new movie ${request.body["title"]}`);
    const newMovie = MovieModel.create({
      title: request.body["title"],
      description: request.body["description"],
      genre: request.body["genre"],
      director: request.body["director"],
      releaseYear: request.body["releaseYear"],
      rating: request.body["rating"],
      cast: request.body["cast"],
      images: request.body["images"],
    });

    newMovie.then(
      (created) => {
        response.status(201).json(created);
        console.log(`Successfully created new movie ${request.body["title"]}`);
      },
      (rejectionReason) => {
        response.status(400).json({
          message: `Failed to create new movie for ${rejectionReason}`,
        });
        console.log(`Successfully created new movie ${request.body["title"]}`);
      }
    );
  }
);

app.delete(
  "/movies/:id",
  //authenticationMiddleware,
  async (request: Request, response: Response, next: () => any) => {
    try {
      const movieId = request.params.id;

      // Check if the ID is valid
      if (!mongoose.Types.ObjectId.isValid(movieId)) {
        response.status(400).json({ message: "Invalid movie ID" });
        return;
      }

      // Find and delete the movie
      const deletedMovie = await MovieModel.findByIdAndDelete(movieId);

      if (!deletedMovie) {
        response.status(404).json({ message: "Movie not found" });
        return;
      }

      response
        .status(200)
        .json({ message: "Movie deleted successfully", deletedMovie });
    } catch (err: any) {
      response
        .status(500)
        .json({ message: "Server error", error: err.message });
    }
  }
);

app.get(
  "/movies/:id",
  async (request: Request, response: Response, next: () => any) => {
    const movie = await MovieModel.findById(request.params.id).lean().exec();
    response.status(200).json(movie);
  }
);

/**
 * Responses for Actors
 */
app.get("/actors", (request: Request, response: Response, next: () => any) => {
  response.status(200).json({ message: "Actors response" });
});

/**
 * Responses for Users
 * TODO
 */

const main = async () => {
  dotenv.config();
  const { CONNECTION_STRING } = process.env;
  await mongoose.connect(CONNECTION_STRING!);
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
};

main();
