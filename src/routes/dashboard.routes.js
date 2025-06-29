import { Router } from "express";

import { getAllChannelVideos, getChannelStats } from "../controllers/dashboard.controller.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/stats").get(getChannelStats);
router.route("/videos").get(getAllChannelVideos);

export default router;