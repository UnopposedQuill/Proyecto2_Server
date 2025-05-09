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
  if (request.headers.authorization === "Basic SomeUser:SomePassword") {
    next(); // allows for next request to proceed
  } else {
    response.status(401).json({ message: "User authentication failed" });
  }
};

/**
 * Responses for Movies
 */
app.get("/movies", async (request: Request, response: Response) => {
  const movies = await MovieModel.find({}).lean().exec();
  response.status(200).json(movies);
});

app.post(
  "/movies/new-movie",
  authenticationMiddleware,
  (request: Request, response: Response, next: () => any) => {
    response
      .status(200)
      .json({ message: `Specific movie response ${request.params.id}` });
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
