import { ApiError } from '../utils/ApiError.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import { Video } from '../models/video.models.js';
import { Comment } from '../models/comment.model.js';
import mongoose from 'mongoose';
import { ApiResponse } from '../utils/ApiResponse.js';


//fetch all comments for a video
const getVideoComments = asyncHandler(async(req, res) => {
    const {videoId} = req.params;

    if(!videoId){
        return new ApiError(400, "invalid video id")
    }

    const video = await Video.findById(videoId);
    if(!video) return new ApiError(400, "no video found");
    const comments = await Comment.aggregate([
        {
            $match : {
                video : mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "createdBy",
                pipeline : [{
                    $project : {
                        fullname : 1,
                        avatar : 1,
                        username : 1
                    }
                }]
            }
        },
        {
            $addFields: {
                createdBy: {
                        $first: "$createdBy",
                    },
                },
            },
        {
            $project : {
                content : 1,
                createdBy : 1
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, comments, "comments fetched successfully"))
})


const addComment = asyncHandler(async(req, res) => {
    const {videoId} = req.params
    const {content} = req.body
    const {userId} = req.user._id;

    if(!videoId) return new ApiError(400, "invalid video id");
    if(!content) return new ApiError(400, "comment can't be empty");

    const comment = await Comment.create({
        content,
        video : videoId,
        owner : userId
    });

    if(!comment) return new ApiError(400, "comment creation failed");

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment added"))
})

const updateComment = asyncHandler(async(req, res) => {
    const {commentId} = req.params;
    if(!commentId) return new ApiError(400, "missing or invalid comment id");

    const content = req.body;

    if(!content) return new ApiError(400, "comment can't be empty");

    const userId = req.user._id

    const comment = await findById(commentId);

    if(!comment) return new ApiError(400, "comment can't not be found");

    if(!comment.owner.equals(userId)) return new ApiError(400, "you are not authorized to update this comment");
    
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId, 
        {
            $set : {
                content
            }
        },
        {new : true}
    );

    if(!updatedComment) return new ApiError(400, "updating comment failed");

    return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "comment updated"))
})


const deleteComment = new asyncHandler(async(req, res) => {
    const {commentId} = req.params;
    if(!commentId) return new ApiError(400, "missing or invalid comment id");

    const userId = req.user._id

    const comment = Comment.findById(commentId);

    if(!comment) return new ApiError(400, "failed to fetch the comment");

    if(!comment.owner.equals(userId)) return new ApiError(400, "not authorized to delete this comment");

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if(!deletedComment) return new ApiError(400, "comment delition failed");

    return res
    .status(200)
    .json(new ApiResponse(200, "comment deleted successfully"));
})