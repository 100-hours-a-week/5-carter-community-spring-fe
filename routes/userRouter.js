import express from "express";
import path from "path";

const router = express.Router();
const __dirname = path.resolve();

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/signup/signup.html"));
});

router.get("/infomodify", (req, res) => {
  res.sendFile(path.join(__dirname, "views/infomodify/infomodify.html"));
});

router.get("/pwmodify", (req, res) => {
  res.sendFile(path.join(__dirname, "views/pwmodify/pwmodify.html"));
});

export default router;
