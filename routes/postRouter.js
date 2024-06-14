import express from "express";
import path from "path";

const router = express.Router();
const __dirname = path.resolve();

router.get("/detail/:postId", (req, res) => {
  res.sendFile(path.join(__dirname, "views/boarddetail/boarddetail.html"));
});

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/board/board.html"));
});

router.get("/modify/:postId", (req, res) => {
  res.sendFile(path.join(__dirname, "views/boardmodify/boardmodify.html"));
});

router.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "views/boardwrite/boardwrite.html"));
});

export default router;
