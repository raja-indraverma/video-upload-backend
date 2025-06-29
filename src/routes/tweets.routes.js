import { Router } from "express";
import {
    createTweet,
    updateTweet,
    getUserTweets,
    deleteTweet
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/create").post(verifyJWT, createTweet);
router.route("/update/:tweetId").patch(verifyJWT, updateTweet).delete(verifyJWT, deleteTweet);
router.route("/").get(getUserTweets);

export default router;  //exportando o router para ser usado em outro arquivo.  //exportando o
