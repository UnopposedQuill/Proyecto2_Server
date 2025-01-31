import mongoose, { mongo, Mongoose } from "mongoose";
import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
const port = 3000;

app.use(express.json());

// Allow cors usages from these hosts and ports.
app.use(
  cors({
    origin: "http://localhost:4200",
  })
);

app.get("/", (request: Request, response: Response, next: () => any) => {
  response.status(200).json({ message: "Server ping response" });
});

/**
 * Responses for Movies
 */
app.get("/movies", (request: Request, response: Response, next: () => any) => {
  response.status(200).json({ message: "Movies response" });
});

app.get(
  "/movies/:id",
  (request: Request, response: Response, next: () => any) => {
    response
      .status(200)
      .json({ message: "Specific movie response", id: request.params.id });
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

// const model = mongoose.model();

const main = async () => {
  app.listen(port, () => {
    console.log("Received request: Request");
  });
};

main();
