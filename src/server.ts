import mongoose from "mongoose";
import express, { Request, Response } from "express";
import cors from "cors";
import ActorModel from "./model/actor.collection";
import MovieModel from "./model/movie.collection";
import dotenv from 'dotenv';
import UserModel from "./model/user.collection";
import { generateKey, KeyObject } from "crypto";

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
const authenticationMiddleware = async (
  request: Request,
  response: Response,
  next: () => any
) => {
  // TODO: Increase security
  try {
    const authentication = request.headers.authorization;
    const authToken = authentication?.split(' ')[1];

    const authedUser = await UserModel.findOne({ authToken: authToken }).exec();
    if (authedUser && authedUser.role === 'admin') {
      next(); // allows for next request to proceed
    } else {
      response.status(401).json({ message: "User authentication failed" });
    }
  } catch (error) {
    response.status(500).json({ message: "User authentication failed" });
  }
};

/**
 * Responses for Movies
 */
app.get("/movies", async (request: Request, response: Response) => {
  console.log("Request for all movies received");
  try {
    const movies = await MovieModel.find({}).lean().exec();
    response.status(200).json(movies);
    console.log(
      `Request for all movies processed. Returned ${movies.length} elements`
    );
  } catch (error) {
    response.status(500).json(`Could not process the request: ${error}`);
    console.log(`Failed request. ${error}`);
  }
});

app.get(
  "/movies/:id",
  async (request: Request, response: Response, next: () => any) => {
    const movie = await MovieModel.findById(request.params.id)
      .populate("cast")
      .exec();
    response.status(200).json(movie);
  }
);

app.post(
  "/movies",
  authenticationMiddleware,
  (request: Request, response: Response, next: () => any) => {
    console.log(`Creating new movie titled: ${request.body["title"]}`);
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
          message: `Failed to create new movie ${request.body["title"]} for ${rejectionReason}`,
        });
        console.log(
          `Failed to create new movie ${request.body["title"]} for ${rejectionReason}`
        );
      }
    );
  }
);

app.delete(
  "/movies/:id",
  authenticationMiddleware,
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

app.patch(
  "/movies/:id",
  authenticationMiddleware,
  async (request: Request, response: Response, next: () => any) => {
    try {
      const movieId = request.params.id;
      const updates = request.body; // Partial updates from the request body

      // Check if the ID is valid
      if (!mongoose.Types.ObjectId.isValid(movieId)) {
        response.status(400).json({ message: "Invalid movie ID" });
        return;
      }

      // Find the movie by ID and apply the updates
      const updatedMovie = await MovieModel.findByIdAndUpdate(
        movieId,
        updates,
        {
          new: true, // Return the updated document
          runValidators: true, // Run schema validators on the update
        }
      );

      if (!updatedMovie) {
        response.status(404).json({ message: "Movie not found" });
        return;
      }

      response.status(200).json(updatedMovie);
    } catch (err: any) {
      response
        .status(500)
        .json({ message: "Server error", error: err.message });
    }
  }
);

/**
 * Responses for Actors
 */
app.get("/actors", async (request: Request, response: Response) => {
  console.log("Request for all actors received");
  try {
    const actors = await ActorModel.find({}).lean().exec();
    response.status(200).json(actors);
    console.log(
      `Request for all actors processed. Returned ${actors.length} elements`
    );
  } catch (error) {
    response.status(500).json(`Could not process the request: ${error}`);
    console.log(`Failed request. ${error}`);
  }
});

app.get(
  "/actors/:id",
  async (request: Request, response: Response, next: () => any) => {
    console.log("Request for actor id received");
    const actorId = request.params.id;

    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(actorId)) {
      response.status(400).json({ message: "Invalid actor ID" });
      console.log(`Request for actor id: ${actorId} had an invalid actor ID`);
      return;
    }

    const actor = await ActorModel.findById(actorId).lean().exec();
    if (actor) {
      const actorMovies =
        (await MovieModel.find({ cast: { $all: actor?._id } })
          .lean()
          .exec()) ?? [];
      actor.movies = actorMovies;
      response.status(200).json(actor);
      console.log(
        `Request for actor id: ${actorId} was returned and found ${actorMovies.length} movies`
      );
    } else {
      response.status(404).json({ message: "Actor ID was not found" });
      console.log(`Request for actor id: ${actorId} did not yield any results`);
    }
  }
);

app.post(
  "/actors",
  authenticationMiddleware,
  (request: Request, response: Response, next: () => any) => {
    console.log(`Creating new actor named: ${request.body["name"]}`);
    const newActor = ActorModel.create({
      name: request.body["name"],
      dateOfBirth: request.body["dateOfBirth"],
      biography: request.body["biography"],
      images: request.body["images"],
    });

    newActor.then(
      (created) => {
        response.status(201).json(created);
        console.log(
          `Successfully created new actor with the name ${request.body["name"]}`
        );
      },
      (rejectionReason) => {
        response.status(400).json({
          message: `Failed to create new movie ${request.body["name"]} for ${rejectionReason}`,
        });
        console.log(
          `Failed to create new movie ${request.body["name"]} for ${rejectionReason}`
        );
      }
    );
  }
);

app.delete(
  "/actors/:id",
  authenticationMiddleware,
  async (request: Request, response: Response, next: () => any) => {
    try {
      const actorId = request.params.id;

      // Check if the ID is valid
      if (!mongoose.Types.ObjectId.isValid(actorId)) {
        response.status(400).json({ message: "Invalid actor ID" });
        return;
      }

      // Find and delete the actor
      const deletedActor = await ActorModel.findByIdAndDelete(actorId);

      if (!deletedActor) {
        response.status(404).json({ message: "Actor not found" });
        return;
      }

      response
        .status(200)
        .json({ message: "Actor deleted successfully", deletedActor });
    } catch (err: any) {
      response
        .status(500)
        .json({ message: "Server error", error: err.message });
    }
  }
);

app.patch(
  "/actors/:id",
  authenticationMiddleware,
  async (request: Request, response: Response, next: () => any) => {
    try {
      const actorId = request.params.id;
      const updates = request.body; // Partial updates from the request body

      // Check if the ID is valid
      if (!mongoose.Types.ObjectId.isValid(actorId)) {
        response.status(400).json({ message: "Invalid actor ID" });
        return;
      }

      // Find the movie by ID and apply the updates
      const updatedActor = await ActorModel.findByIdAndUpdate(
        actorId,
        updates,
        {
          new: true, // Return the updated document
          runValidators: true, // Run schema validators on the update
        }
      );

      if (!updatedActor) {
        response.status(404).json({ message: "Actor not found" });
        return;
      }

      response.status(200).json(updatedActor);
    } catch (err: any) {
      response
        .status(500)
        .json({ message: "Server error", error: err.message });
    }
  }
);

/**
 * Responses for Searches
 */
app.get("/search", async (request: Request, response: Response) => {
  console.log("Search request received");
  try {
    const searchType = request.query.searchType;
    if (!searchType && searchType !== "movies" && searchType !== "actors") {
      response
        .status(400)
        .json({ message: `Invalid Search type ${searchType}` });
      console.log(`Invalid Search type ${searchType}`);
      return;
    }

    if (searchType === "movies") {
      // Filter will be built dynamically using the request params
      const filter: any = {};
      const searchQuery = request.query?.searchQuery;
      if (searchQuery) filter.title = { $regex: searchQuery, $options: "i" };
      const selectedGenre = request.query?.selectedGenre;
      if (selectedGenre)
        filter.genre = { $regex: selectedGenre, $options: "i" };
      const selectedYear = request.query?.selectedYear;
      if (selectedYear) filter.releaseYear = selectedYear;

      const selectedLowRating = request.query?.selectedLowRating;
      const selectedHighRating = request.query?.selectedHighRating;
      if (selectedLowRating && selectedLowRating)
        filter.rating = { $gte: selectedLowRating, $lte: selectedHighRating };
      else if (selectedLowRating) filter.rating = { $gte: selectedLowRating };
      else if (selectedHighRating) filter.rating = { $lte: selectedHighRating };

      const movies = await MovieModel.find(filter).lean().exec();
      response.status(200).json(movies);
      console.log(
        `Movies search sequest processed. Returned ${movies.length} elements`
      );
    } else {
      // Filter will be built dynamically using the request params
      const filter: any = {};
      const searchQuery = request.query?.searchQuery;
      if (searchQuery) filter.name = { $regex: searchQuery, $options: "i" };

      const startDate = request.query?.startDate;
      const endDate = request.query?.endDate;
      if (startDate && endDate)
        filter.dateOfBirth = { $gte: startDate, $lte: endDate };
      else if (startDate) filter.dateOfBirth = { $gte: startDate };
      else if (endDate) filter.dateOfBirth = { $lte: endDate };

      const actors = await ActorModel.find(filter).lean().exec();
      response.status(200).json(actors);
      console.log(
        `Actors search request processed. Returned ${actors.length} elements`
      );
    }
  } catch (error) {
    response.status(500).json(`Could not process the request: ${error}`);
    console.log(`Failed request. ${error}`);
  }
});

/**
 * Responses for Users
 * TODO
 */
app.post(
  "/register",
  async (request: Request, response: Response) => {
    const { name, email, password, role } = request.body;
    // Avoid registering admin information.
    if (role === 'admin') {
      response.status(400).json({ message: "Invalid register information" })
    }

    // Create the new user
    const user = UserModel.create({ name, email, password, role });

    user.then(
      (created) => {
        response.status(201).json({ message: "Registered successfully" });
        console.log(`Successfully created new user with the name ${name}`);
      },
      (rejectionReason) => {
        response.status(400).json({
          message: `Failed to create new user ${name}`,
        });
        console.log(`Failed to create new user ${name}`);
      }
    );
  });

app.post(
  "/login",
  async (request: Request, response: Response) => {
    const { email, password } = request.body;

    // Find the user in the mock database
    const user = await UserModel.findOne({ email: email, password: password }).lean().exec();

    if (user) {
      // Store user data in the session
      generateKey("hmac", { length: 512 }, async (error: Error | null, key: KeyObject) => {
        if (error) {
          response.status(500).json({ message: "Could not perform login at this moment, please try later." })
        }
        else {
          const exportedKey = key.export().toString('hex');
          const updatedUser = await UserModel.findByIdAndUpdate(user._id, { authToken: exportedKey }).exec();
          if (updatedUser) {
            response
              .status(200)
              .json({ message: "Login successful", authToken: exportedKey, role: updatedUser.role });
          }
          else {
            response.status(500).json({ message: "Could not perform login at this moment, please try later." })
          }
        }
      });
    }
    else {
      response.status(401).json({ message: "Invalid credentials" });
    }
  });

app.get("/persons", authenticationMiddleware, async (request: Request, response: Response) => {
  console.log("Request for all users received");
  try {
    const users = await UserModel.find().lean().exec();
    response.status(200).json(users);
    console.log(
      `Request for all users processed. Returned ${users.length} elements`
    );
  } catch (error) {
    response.status(500).json(`Could not process the request: ${error}`);
    console.log(`Failed request. ${error}`);
  }
});

app.get(
  "/persons/:id",
  async (request: Request, response: Response, next: () => any) => {
    console.log("Request for user id received");
    const userId = request.params.id;

    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      response.status(400).json({ message: "Invalid user ID" });
      console.log(`Request for user id: ${userId} had an invalid user ID`);
      return;
    }

    const user = await UserModel.findById(userId).lean().exec();
    if (user) {
      response.status(200).json(user);
      console.log(`Request for user id: ${userId} was processed`);
    } else {
      response.status(404).json({ message: "User ID was not found" });
      console.log(`Request for user id: ${userId} did not yield any results`);
    }
  }
);

app.post(
  "/persons",
  authenticationMiddleware,
  (request: Request, response: Response, next: () => any) => {
    const { name, email, password, role } = request.body;
    console.log(`Creating new user named: ${name}`);
    const newActor = UserModel.create({
      name: name,
      email: email,
      password: password,
      role: role,
    });

    newActor.then(
      (created) => {
        response.status(201).json(created);
        console.log(
          `Successfully created new user with the name ${name}`
        );
      },
      (rejectionReason) => {
        response.status(400).json({
          message: `Failed to create new movie ${name} for ${rejectionReason}`,
        });
        console.log(
          `Failed to create new movie ${name} for ${rejectionReason}`
        );
      }
    );
  }
);

app.delete(
  "/persons/:id",
  authenticationMiddleware,
  async (request: Request, response: Response, next: () => any) => {
    try {
      const userId = request.params.id;

      // Check if the ID is valid
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        response.status(400).json({ message: "Invalid user ID" });
        return;
      }

      // Find and delete the actor
      const deletedUser = await UserModel.findByIdAndDelete(userId);

      if (!deletedUser) {
        response.status(404).json({ message: "User not found" });
        return;
      }

      response
        .status(200)
        .json({ message: "User deleted successfully", deletedUser });
    } catch (err: any) {
      response
        .status(500)
        .json({ message: "Server error", error: err.message });
    }
  }
);

app.patch(
  "/persons/:id",
  authenticationMiddleware,
  async (request: Request, response: Response, next: () => any) => {
    try {
      const userId = request.params.id;
      const updates = request.body; // Partial updates from the request body

      // Check if the ID is valid
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        response.status(400).json({ message: "Invalid user ID" });
        return;
      }

      // Find the movie by ID and apply the updates
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        updates,
        {
          new: true, // Return the updated document
          runValidators: true, // Run schema validators on the update
        }
      );

      if (!updatedUser) {
        response.status(404).json({ message: "User not found" });
        return;
      }

      response.status(200).json(updatedUser);
    } catch (err: any) {
      response
        .status(500)
        .json({ message: "Server error", error: err.message });
    }
  }
);

/**
 * Administrative Initialization and Cleanup
 */
app.post(
  "/deinitialize",
  authenticationMiddleware,
  async (request: Request, response: Response, next: () => any) => {
    console.log(`Cleaning up test movies`);
    Promise.all([
      ActorModel.deleteMany().exec(),
      MovieModel.deleteMany().exec(),
    ]).then(
      (fulfilled) => {
        response.status(201).json({ fulfilled });
        console.log(`Successfully created cleaned test data`);
      },
      (rejectionReason) => {
        response.status(400).json({
          message: `Failed to clean test data for ${rejectionReason}`,
        });
        console.log(`Failed to clean test data for ${rejectionReason}`);
      }
    );
  }
);

app.post(
  "/initialize",
  authenticationMiddleware,
  (request: Request, response: Response, next: () => any) => {
    console.log(`Refilling test movies`);
    const { actors, movies } = request.body;

    // Insert actors first.
    ActorModel.insertMany(actors).then(
      (createdActors) => {
        console.log(`Successfully created refilled test actors`);

        // Map the input movies so that their ids now match the ObjectId of each positional parameter
        const updatedMovies = movies.map((movie: any) => {
          movie.cast = movie.cast.map(
            (_id: any) => createdActors[_id._id - 1]._id
          );
          return movie;
        });
        MovieModel.insertMany(updatedMovies).then(
          (createdMovies) => {
            response.status(201).json({ createdActors, createdMovies });
            console.log(`Successfully created refilled test movies`);
          },
          (rejectionReason) => {
            response.status(400).json({
              message: `Failed to refill test movies for ${rejectionReason}`,
            });
            console.log(`Failed to refill test movies for ${rejectionReason}`);
          }
        );
      },
      (rejectionReason) => {
        response.status(400).json({
          message: `Failed to refill test actors for ${rejectionReason}`,
        });
        console.log(`Failed to refill test actors for ${rejectionReason}`);
      }
    );
  }
);

const main = async () => {
  dotenv.config();
  const { CONNECTION_STRING } = process.env;
  await mongoose.connect(CONNECTION_STRING!);
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
};

main();
