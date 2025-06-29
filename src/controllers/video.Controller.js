import { Video } from "../models/video.models";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const filter = {};

  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } }, // if description exists
    ];
  }

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    filter.owner = mongoose.Types.ObjectId(userId);
  }

  const sortOptions = {};
  const validSortFields = ["createdAt", "views", "likes", "title", "duration"];
  const direction = sortType === "asc" ? 1 : -1;

  if (validSortFields.includes(sortBy)) {
    sortOptions[sortBy] = direction;
  } else {
    sortOptions.createdAt = -1; 
  }

  const videos = await Video.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNumber)
    .select("title thumbnail views duration createdAt owner") // limit fields
    .populate({
      path: "owner",
      select: "username fullname avatar",
    });

  const totalVideos = await Video.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(200, {
      totalVideos,
      page: pageNumber,
      totalPages: Math.ceil(totalVideos / limitNumber),
      videos,
    }, "Videos fetched successfully")
  );
});

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "Give all details of the video");
  }

  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  let videoFile;
  try {
    videoFile = await uploadOnCloudinary(videoFileLocalPath);
    console.log("uploaded video: ", videoFile);
  } catch (error) {
    console.log("Error uploading video ", error);
    throw new ApiError(500, "Failed to upload video");
  }

  let thumbnailFile;
  try {
    thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);
    console.log("uploaded thumbnail: ", thumbnailFile);
  } catch (error) {
    console.log("Error uploading thumbnail ", error);
    throw new ApiError(500, "Failed to upload thumbnail");
  }

  try {
    const video = await Video.create({
      videoFile: videoFile.url,
      thumbnail: thumbnailFile.url,
      title,
      description,
      duration: videoFile.duration,
      owner: req.user._id,
    });

    if (!video) {
      throw new ApiError(500, "Something went wrong while uploading a video");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, video, "Video uploaded successfully"));
  } catch (error) {
    console.log("Error while uploading a video", error);

    if (videoFile) {
      await deleteFromCloudinary(videoFile.public_id);
    }

    if (thumbnailFile) {
      await deleteFromCloudinary(thumbnailFile.public_id);
    }

    throw new ApiError(
      500,
      "Something went wrong while uploading the video and video file and thumbnail deleted"
    );
  }
});

const getVideoById = asyncHandler(async(req, res) => {
    const {videoId} = req.params;

    if(!videoId) throw new ApiError(400, "video id empty or invalid");

    const video = await Video.findById(videoId).populate(
        "owner",
        "fullname username avatar"
    )

    if(!video) throw new ApiError(400, "video not found")

    return res
    .status(200).
    json(new ApiResponse(200, video, "Video found successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const newThumbnailLocalPath = req.file?.path;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Give a valid video id");
  }

  if (!title || !description) {
    throw new ApiError(400, "Give all details of the video");
  }

  if (!newThumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(
      403,
      "You are not allowed to update another user's video"
    );
  }

  try {
    await deleteFromCloudinary(video.thumbnail);
  } catch (error) {
    throw new ApiError(500, "Error while deleting the previous thumbnail");
  }

  const newThumbnail = await uploadOnCloudinary(newThumbnailLocalPath);

  if (!newThumbnail.url) {
    throw new ApiError(400, "Error while uploading on thumbnail");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: newThumbnail.url,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Video details updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Video id is required or invalid id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  // if (video.owner !== req.user._id) {
  //   throw new ApiError(400, "You are not allowed to delete this video");
  // }

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(
      403,
      "You are not allowed to update another user's video"
    );
  }

  const deletedVideoFile = await deleteVideoFromCloudinary(video.videoFile);

  if (!deletedVideoFile || deletedVideoFile?.result !== "ok") {
    throw new ApiError(500, "Error while deleting video");
  }

  const deletedThumbnailFile = await deleteFromCloudinary(video.thumbnail);

  if (!deletedThumbnailFile || deletedThumbnailFile?.result !== "ok") {
    throw new ApiError(500, "Error while deleting thumbnail");
  }

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (!deletedVideo) {
    throw new ApiError(500, "Error while deleting the video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted Successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Video id is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(500, "Video not found");
  }

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(
      403,
      "You are not allowed to update another user's video"
    );
  }

  const videoPublishStatus = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videoPublishStatus,
        "Video published status modified"
      )
    );
}); 

export {
    togglePublishStatus,
    deleteVideo,
    updateVideo,
    getAllVideos,
    getVideoById,
    publishVideo
}