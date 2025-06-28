import mongoose from "mongoose";
import { Subscription } from "../models/subscriptions.models";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const toggleSubscriber = asyncHandler(async(req, res) => {
    const channelId = req.params;
    const userId = req.user._id;

    if(!channelId) return new ApiError(400, "invalid or empty channed id");

    const subscribed = await Subscription.findOne({
        channelId : channelId,
        subscriber : userId,
    })

    let subscribe;

    if(subscribed){
        const deletedSubscription = await subscribed.deleteOne
        
        if(!deletedSubscription) return new ApiError(500, "error while unsubscribing");
        subscribe = false;
    }
    else {
        const newSubscription = await Subscription.create({
            channel : channelId,
            subscriber : userId
        })

        if(!newSubscription) return new ApiError(500, "error while subscribing");
        subscribe = true;
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {channelId, subscribe}, subscribe ? "channel subscribed successfully" : "channel unsubscribed successfully" ));
})

const getChannelSubscribers = asyncHandler(async(req, res) => {
    const channelId = req.params;
    if(!channelId) return new ApiError(400, "invalid or empty channed id");

    const subscriberList = await Subscription.aggregate([
        {
            $match : {
                channel : mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup :{
                from : "users",
                localField : "subscriber",
                foreignField : "_id",
                as : "subscriber",
                pipeline : {
                    $project : {
                        username : 1,
                        avatar : 1,
                        fullname : 1,
                    }
                }
            }
        },
        {
            $unwind : "$subscriber",
        },
        {
            $project : {
                subscriber : 1,
            }
        }
    ])

    if(!subscriberList) return new ApiError(400, "failed to fetch subscriber list")

    return res
    .status(200)
    .json(new ApiResponse(200, subscriberList, "subscriber list fetched successfully"));
})

const getSubscribedChannels = asyncHandler(async(req, res) => {
    const {userId} = req.user._id;

    if(!userId) return new ApiError(400, "invalid or empty user id");

    const subscribedCount = await Subscription.countDocuments({
        subcriber : mongoose.Types.ObjectId(userId)
    })

    const channelList = Subscription.aggregate([
        {
            $match : {
                subcriber : mongoose.Types.ObjectId(userId)
            },
        },
        {
            $lookup : {
                from : "users",
                localField : "channel",
                foreignField : "_id",
                as : "channelDetails",
                pipeline : {
                    $project : {
                        username : 1,
                        fullname : 1,
                        avatar : 1.
                    }
                }
            }
        },
        {
            $addFields : {
                channelDetails : {
                    $first : "$channelDetails",
                }
            }
        },
        {
            $project : {
                channelDetails : 1,
            }
        }
    ])

    if(!channelList) return new ApiError(400, "failed to fetch subscribed channels");

    return res
    .status(200)
    .json(200, {channelList, subscribedCount}, "subsribed channels fetched succesfully");

})

const subscriberCount = asyncHandler(async(req, res) => {
    const channelId = req.params
    if(!channelId) return new ApiError(400, "channelId invalid or empty");

    const subscribers = await Subscription.countDocuments({
        channel : mongoose.Types.ObjectId(channelId)
    })

    if(!subscribers) return new ApiError(400, "failed to fetch subscriber count");

    return res
    .status(200)
    .json(new ApiResponse(200, subscribers, "subscriber count fetched succesfully"));
})

export {
    toggleSubscriber,
    getSubscribedChannels,
    getChannelSubscribers,
    subscriberCount
}