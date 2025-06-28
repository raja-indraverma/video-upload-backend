import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Like } from "../models/like.model";
import { ApiResponse } from "../utils/ApiResponse";

const toggleVideoLike = asyncHandler(async(req, res) => {
    const videoId = req.params;
    if(!videoId) return new ApiError(400, "video id wrong or empty");
    
    const userId = req.user._id;

    const existingLike = await Like.findOne({
        video : videoId,
        user : userId
    })

    let liked;
    if(existingLike){
        const deletedLike = await existingLike.deleteOne();

        if(!deletedLike) return new ApiError(500, "failed to unlike the video");

        liked = false;
    }else{
        const newLike = await Like.create({
            video : videoId,
            owner : userId
        })

        if(!newLike) return new ApiError(500, "failed to like the video");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {videoId, liked}, liked ? "video liked successfully" : "video unliked successfully"));
})


const toggleCommentLike = asyncHandler(async(req, res) => {
    const commentId = req.params;
    if(!commentId) return new ApiError(400, "comment id wrong or empty");
    
    const userId = req.user._id;

    const existingLike = await Like.findOne({
        comment : commentId,
        user : userId
    })

    let liked;
    if(existingLike){
        const deletedLike = await existingLike.deleteOne();

        if(!deletedLike) return new ApiError(500, "failed to unlike the comment");

        liked = false;
    }else{
        const newLike = await Like.create({
            comment : commentId,
            owner : userId
        })

        if(!newLike) return new ApiError(500, "failed to like the comment");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {commentId, liked}, liked ? "comment liked successfully" : "comment unliked successfully"));
})

const toggleTweetLike = asyncHandler(async(req, res) => {
    const tweetId = req.params;
    if(!tweetId) return new ApiError(400, "tweet id wrong or empty");
    
    const userId = req.user._id;

    const existingLike = await Like.findOne({
        tweet : tweetId,
        user : userId
    })

    let liked;
    if(existingLike){
        const deletedLike = await existingLike.deleteOne();

        if(!deletedLike) return new ApiError(500, "failed to unlike the tweet");

        liked = false;
    }else{
        const newLike = await Like.create({
            tweet : tweetId,
            owner : userId
        })

        if(!newLike) return new ApiError(500, "failed to like the tweet");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {tweetId, liked}, liked ? "comment liked successfully" : "comment unliked successfully"));

})


const getLikedVideos = asyncHandler(async(req, res) => {
    const userId = req.user._id;

    const likedVideos = await Like.aggregate([
        {
            $match: {
                owner : userId,
                video : {
                    $exists : true,
                    $ne : false
                },
            },
        },
        {
            $lookup : {
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "video",
                pipeline : [{
                    $lookup : {
                        from : "users",
                        localField : "owner",
                        foreignField : "_id",
                        as : "owner",
                        pipeline : [{
                            $project : {
                                username : 1,
                                fullname : 1,
                                avatar : 1,
                            },
                        }]
                    }
                },
                {
                    $addFields : {
                        owner : {
                            $first : "$owner"
                        }
                    }
                },
                {
                    $project : {
                        videoFile : 1,
                        thumbnail : 1,
                        title : 1,
                        owner : 1
                    }
                }
            ]
            }
        },
        {
            $unwind : {
                path : "$video",
            }
        },
        {
            $project : {
                video : 1,
                owner : 1,
            }
        }
    ])

    if(!likedVideo) return new ApiError(400, "failed to fetch liked videos");

    return res
    .status(200)
    .json(new ApiResponse(200, {likedVideos}, "liked videos fetched successfully"));
})



export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}