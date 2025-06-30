import { Router } from "express";

import { getAllChannelVideos, getChannelStats } from "../controllers/dashboard.controller.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/stats").get(verifyJWT, getChannelStats);
router.route("/videos").get(verifyJWT, getAllChannelVideos);

export default router;