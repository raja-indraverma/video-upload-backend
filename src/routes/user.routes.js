import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    registerUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateCoverImage, 
    getUserChannelProfile, 
    getWatchHistory} 
    from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";


const userRouter = Router();

userRouter.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser)

userRouter.route("/login").post(
    loginUser
)

userRouter.route("/logout").post(
    verifyJWT,
    logoutUser)

userRouter.route("/refresh-token").post(
    refreshAccessToken
)

userRouter.route("/current-user").post(
    verifyJWT, getCurrentUser
)

userRouter.route("/update-account").patch(
    verifyJWT, updateAccountDetails
)

userRouter.route("/change-password").post(
    verifyJWT, changeCurrentPassword
)

userRouter.route("/avatar").patch(
    verifyJWT, upload.single("avatar"), updateUserAvatar
)

userRouter.route("/cover-image").patch(
    verifyJWT, upload.single("coverImage"), updateCoverImage
)

userRouter.route("/c/:username").get(
    verifyJWT, getUserChannelProfile
)

userRouter.route("/history").get(
    verifyJWT, getWatchHistory
)

export default userRouter;
