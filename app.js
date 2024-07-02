import express from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();

import userRouter from "./routes/userRouter.js";
import postRouter from "./routes/postRouter.js";

const app = express();
const __dirname = path.resolve();
const FRONTEND_PORT = process.env.FRONTEND_PORT || 8080;
const BACKEND_IP_PORT = process.env.BACKEND_IP_PORT || "http://localhost:8081";

app.use(cookieParser());
app.use(cors());
app.use(express.static(__dirname + "/views"));

app.get("/config", (req, res) => {
  res.json({ BACKEND_IP_PORT });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/login/login.html"));
});

app.get("/boardimage", (req, res) => {
  res.sendFile(path.join(__dirname, "images/board.webp"));
});

app.use("/users", userRouter);
app.use("/posts", postRouter);

app.listen(FRONTEND_PORT, () => {
  console.log(`서버가 실행중입니다. http://localhost:${FRONTEND_PORT}/`);
});
