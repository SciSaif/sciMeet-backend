import express from "express";
import { login, setUsername } from "../controllers/authController.js";
import protect from "../middlewares/protectMiddleware.js";

const router = express.Router();

// router.post("/register", postRegister);
router.post("/login", login);
router.post("/setUsername", protect, setUsername);

router.post("/test", (req: any, res) => {
    console.log(req);
    res.json(req.body);
});

export default router;
