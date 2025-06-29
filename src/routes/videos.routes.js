import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";

import {
    togglePublishStatus,
    deleteVideo,
    updateVideo,
    getAllVideos,
    getVideoById,
    publishVideo
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishVideo
  );

router
  .route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;
