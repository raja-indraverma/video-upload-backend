import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";  
import mongoose from "mongoose";
import { Subscription } from "../models/subscriptions.models.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const getChannelStats = asyncHandler(async(req, res) => {
    const userId = req.user._id;

    const videoCount = await Video.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $group : {
                _id : null,
                totalviews : {
                    $sum : "$views"
                },
                totalvidoes : {
                    $sum : 1
                }
            }
        },
        {
            $project : {
                totalvidoes : 1,
                totalviews : 1
            }
        },
    ])

    const subscriberCount = await Subscription.aggregate([
        {
            $match : {
                channel : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group : {
                _id : null,
                totalSubscribers : {
                    $sum : 1,
                }
            }
        },
        {
            $project : {
                _id : 0,
                totalSubscribers : 1,
            }
        }
    ])


    const likeCount = Like.aggregate([
        {
            $lookup : {
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "videoInfo"
            }
        },
        {
            $match : {
                "videoInfo.owner" : userId,
            }
        },
        {
            $group : {
                _id : null,
                totalLikes : {
                    $sum : 1
                }
            }
        },
        {
            $project : {
                _id : 0,
                totalLikes : 1,
            }
        }
    ])


    const info = {
    totalViews: videoCount[0]?.totalviews || 0,
  totalVideos: videoCount[0]?.totalvidoes || 0,
  totalSubscribers: subscriberCount[0]?.totalSubscribers || 0,
  totalLikes: likeCount[0]?.totalLikes || 0,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, info, "Channel stats fetched"));

})

const getAllChannelVideos = asyncHandler(async(req, res) => {
    const userId = req.user._id

    const videos = Video.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project : {
                videofile : 1,
                thumbnail : 1,
                views : 1,
                isPublished : 1,
                owner : 1,
                createdAt : 1,
                updatedAt : 1,
                duration : 1,
            }
        }
    ]);

    if(!videos) throw new ApiError(400, "failed to fetch videos")
    
    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
})

export {
    getAllChannelVideos,
    getChannelStats
}