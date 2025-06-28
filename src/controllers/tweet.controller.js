import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const createTweet = asyncHandler(async(req, res) => {
    const userId = req.user._id;

    const content = req.body;

    if(!content) return new ApiError(400, "tweet can't be empty");

    const tweet = Tweet.create({
        content : content,
        owner : userId,
    })

    if(!tweet) return new ApiError(400, "tweet creation failed");

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet created successfully"));
})

const getUserTweets = asyncHandler(async(req, res) => {
    const userId = req.params;
    if(!userId) return new ApiError(400, "userid can't be empty");

    const tweets = Tweet.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort : {
                createdAt : -1,
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owner",
                pipeline : [
                    {
                        $project : {
                            username : 1,
                            fullname : 1,
                            avatar : 1.
                        }
                    }
                ]
            }
        },
        {
            $addFields : {
                owner : {
                    $first : "$owner",
                }
            }
        },
        {
            $project : {
                content : 1,
                owner : 1,
                createdAt : 1
            }
        }
    ])

    if(!tweets) return new ApiResponse(400, "failed to fetch tweets");

    return res
    .status(200)
    .json(new ApiResponse(200, tweets, "tweets fetched successfully"));
})

const updateTweet = asyncHandler(async(req, res) => {
    const tweetId = req.params;
    const userId = req.user._id

    if(!tweetId) return new ApiError(400, "missing or invalid tweet id ");

    const content = req.body;
    if(!content) return new ApiError(400, "missing or invalid content");

    const tweet = await Tweet.findById(tweetId)

    if(!tweet) return new ApiError(404, "can't fetch tweet");
    if(!tweet.owner.equals(userId)) return new ApiError(400, "you don't have authority to update the tweet");

    const updatedTweet = Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set : {
                content,
            }
        },
        {new : true}
    );

    if(!updateTweet) return new ApiError(400, "failed to update the tweet")

    return res
    .status(200)
    .json(new ApiResponse(200, "tweet updated successfully"));
})

const deleteTweet = asyncHandler(async(req, res) => {
    const tweetId = req.params;
    const userId = req.user._id

    if(!tweetId) return new ApiError(400, " invalid tweedId")

    const tweet = await Tweet.findById(tweetId)

    if(!tweet) return new ApiError(404, "tweet now found")
    
    if(!tweet.owner.equals(userId)) return new ApiError(400, "you are now authorized to delete thi stweet")
    
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if(!deletedTweet) return new ApiError(400, "failed to delete tweet");

    return res
    .status(200)
    .json(200, deleteTweet, "tweet deleted successfully");
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
}