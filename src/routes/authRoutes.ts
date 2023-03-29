import express from "express";
import { postRegister, postLogin } from "../controllers/authController.js";
import protect from "../middlewares/protectMiddleware.js";

const router = express.Router();

router.post("/register", postRegister);
router.post("/login", postLogin);

router.get("/test", protect, (req, res) => res.send("Hello World"));
export default router;
