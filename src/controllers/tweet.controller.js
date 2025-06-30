import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async(req, res) => {
    const userId = req.user._id;

    const {content} = req.body;

    if(!content) return new ApiError(400, "tweet can't be empty");

    const tweet = await Tweet.create({
        content : content,
        owner : userId,
    })

    if(!tweet) return new ApiError(400, "tweet creation failed");

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet created successfully"));
})

const getUserTweets = asyncHandler(async(req, res) => {
    const userId = req.user._id;
    if(!userId) throw new ApiError(400, "userid can't be empty");

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
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
                            avatar : 1,
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

    if(!tweets) throw new ApiResponse(400, "failed to fetch tweets");

    return res
    .status(200)
    .json(new ApiResponse(200, tweets, "tweets fetched successfully"));
})

const updateTweet = asyncHandler(async(req, res) => {
    const {tweetId} = req.params;
    const userId = req.user._id

    if(!tweetId) throw new ApiError(400, "missing or invalid tweet id ");

    const {content} = req.body;
    if(!content) throw new ApiError(400, "missing or invalid content");

    const tweet = await Tweet.findById(tweetId)

    if(!tweet) throw new ApiError(404, "can't fetch tweet");
    if(!tweet.owner.equals(userId)) return new ApiError(400, "you don't have authority to update the tweet");

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set : {
                content,
            }
        },
        {new : true}
    );

    if(!updatedTweet) return new ApiError(400, "failed to update the tweet")

    return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "tweet updated successfully"));
})

const deleteTweet = asyncHandler(async(req, res) => {
    const {tweetId} = req.params;
    const userId = req.user._id

    if(!tweetId) throw new ApiError(400, " invalid tweedId")

    const tweet = await Tweet.findById(tweetId)

    if(!tweet) throw new ApiError(404, "tweet now found")
    
    if(!tweet.owner.equals(userId)) throw new ApiError(400, "you are now authorized to delete thi stweet")
    
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if(!deletedTweet) throw new ApiError(400, "failed to delete tweet");

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