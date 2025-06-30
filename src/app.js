import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))
app.use(express.json({
    limit : "16kb"
}))
app.use(urlencoded({
    extended : true,
    limit : "16kb"
}))
app.use(express.static("public"))
app.use(cookieParser())
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

//import routes
import userRouter  from "./routes/user.routes.js";
import commentRouter from "./routes/comments.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import likeRouter from "./routes/likes.routes.js";
import playlistRouter from "./routes/playlists.routes.js";
import subscriptionRouter from "./routes/subscriptions.routes.js";
import tweetRouter from "./routes/tweets.routes.js";
import videoRouter from "./routes/videos.routes.js";
// import publicRouter from "./routes/public.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/videos", videoRouter);
// app.use("/api/v1/public", publicRouter);








export {app}