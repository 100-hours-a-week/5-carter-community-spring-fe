import express from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";

import { FRONTEND_PORT } from "./port.js";
import userRouter from "./routes/userRouter.js";
import postRouter from "./routes/postRouter.js";

const app = express();
const __dirname = path.resolve();

app.use(cookieParser());
app.use(cors());
app.use(express.static(__dirname + "/views"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/login/login.html"));
});

app.use("/users", userRouter);
app.use("/posts", postRouter);

app.listen(FRONTEND_PORT, () => {
  console.log(`서버가 실행중입니다. http://localhost:${FRONTEND_PORT}/`);
});
