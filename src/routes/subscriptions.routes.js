import { Router } from "express";

import {
    toggleSubscription,
    getChannelSubscribers,
    getSubscribedChannels,
    subscriberCount
} from "../controllers/subscription.controller.js";

const router = Router();

router.route("/c/:channelId").post(toggleSubscription)
router.route("/c/:channelId").get(getChannelSubscribers)
router.route("/c/:channelId/subscribed").get(getSubscribedChannels)
router.route("/c/:channelId/subscribed/count").get(subscriberCount)

export default router;  // Export the router to use it in other files.  */} els