import { Router } from "express";

import { createPlaylist, addVideoToPlaylist, deletePlaylist, 
    getPlaylistById, getUserPlaylists, updatePlaylist, removeVideoFromPlaylist
 } from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createPlaylist);
router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);
router.route("/user/:userId").get(getUserPlaylists);

router
  .route("/:playlistId")
  .get(getPlaylistById)
  .patch(updatePlaylist)
  .delete(deletePlaylist);


export default router;