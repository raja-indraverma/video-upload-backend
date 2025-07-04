import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';    
import { User } from '../models/user.models.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken"
import mongoose from 'mongoose';

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessTokens();
        const refreshToken = user.generateRefreshTokens();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});

        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access and refresh tokens");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exist
    // check for images - avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db 
    // remove password and refresh token
    // check for user creation
    // return response

    const {fullname, email, username, password} = req.body
    console.log("email : ", email)
    if(fullname == ""){
        throw new ApiError(400, "full name is required")
    }
    if(email == ""){
        throw new ApiError(400, "email is required")
    }
    if(username == ""){
        throw new ApiError(400, "username is required")
    }
    if(password == ""){
        throw new ApiError(400, "password is required")
    }

    const existingUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(existingUser){
        throw new ApiError(409, "username or email already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath =  req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "avatar upload failed")
    }
    
    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken ")
    if(!createdUser){
        throw new ApiError(500, "something went wrong while resistering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user created successfully", )
    )

})

const loginUser = asyncHandler(async (req, res) => {
  // get data from req.body
  // username or email
  // find the user
  // check password
  // generate access and refresh token
  // send token in cookies
  // return res
    console.log(req.body)
  const { email, password } = req.body;

  if (!email && !password) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findOne({
    $or: [{ email }],
  });

  if (!user) {
    throw new ApiError(404, "Invalid email or password");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(404, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset : {
                refreshToken : 1,
            }
        },{
            new : true
        }
    ) 
    
    const options = {
        httpOnly : true,
        secure : true,
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfully"))
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request");
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "invalid refresh token");
        }
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(401, "refresh token expired or used");
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, 
                {accessToken, refreshToken : newRefreshToken},
                "access token generated successfully")
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token");
    }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(401, "invalid password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave : false})
    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "password changed successfully")
    )
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(200, req.user, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullname, email} = req.body
    if(!fullname && !email){
        throw new ApiError(400, "all feilds are needed")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email : email
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "account details updated successfully")
    )
})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400, "Avatar upload failed")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {$set : {
            avatar : avatar.url
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiError(200, user, "avatar image updated successfully"))
})

const updateCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "cover image file missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400, "cover image upload failed")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {$set : {
            coverImage : coverImage.url
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiError(200, user, "cover image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params
    if(!username?.trim()){
        throw new ApiError(400, "username is missing");
    } 

    const channel = await User.aggregate([
        {
            $match : {
                username : username?.toLowerCase()
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers",
                },
                channelsSubsribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed : {
                    $cond : {
                        if : {$in : [req.user?._id, "$subscribers.subscriber"]},
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
            $project : {
                fullname : 1,
                username : 1,
                subscribersCount : 1,
                channelsSubsribedToCount : 1,
                isSubscribed : 1,
                avatar : 1,
                coverImage : 1,
                email : 1
            }
        }

    ])

    if(!channel?.length){
        throw new ApiError(404, "channel does not exist")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "channel found successfully")
    )
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match :{
                _id : new mongoose.Types.ObjectId(req.user._id),
            }
        },
        {
           $lookup : {
            from : "videos",
            localField : "watchHistory",
            foreignField : "_id",
            as : "watchHistory",
            pipeline : [
                {
                    $lookup : {
                        from : "users",
                        localField : "owner",
                        foreignField : "_id",
                        as : "owner",
                        pipeline : [
                            {
                                $project : {
                                    fullname : 1,
                                    username : 1,
                                    avatar : 1,
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields : {
                        owner : {
                            $first : "$owner"
                        }
                    }
                }
            ]
           } 
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "watch history fetched successfully"))
})


export {
    registerUser,
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage,
    getWatchHistory,
    getUserChannelProfile
};