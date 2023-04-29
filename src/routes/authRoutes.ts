import express from "express";
import { login, setUsername } from "../controllers/authController.js";
import protect from "../middlewares/protectMiddleware.js";

const router = express.Router();

// router.post("/register", postRegister);
router.post("/login", login);
router.post("/setUsername", protect, setUsername);

router.get("/test", protect, (req: any, res) => {
    let output = { user: req.user };
    res.json(output);
});
export default router;
