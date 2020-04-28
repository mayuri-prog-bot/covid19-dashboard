import express from "express";
import "babel-polyfill";
import cors from "cors";
import dotenv from "dotenv";
import statisticsRoute from "./app/routes/statisticsRoute";

dotenv.config();

const app = express();

// Add middleware for parsing URL encoded bodies (which are usually sent by browser)
app.use(cors());
// Add middleware for parsing JSON and urlencoded data and populating `req.body`
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/api/v1", statisticsRoute);

app.listen(process.env.PORT).on("listening", () => {
  console.log(`🚀 is live on ${process.env.PORT}`);
});

export default app;
