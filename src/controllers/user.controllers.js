import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';    
import { User } from '../models/user.models.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken"
// import { isPasswordCorrect } from '../models/user.models.js';

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = User.generateAccessTokens();
        const refreshToken = User.generateRefreshTokens();
        User.refreshToken = refreshToken;
        await User.save({validateBeforeSave : false});

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

const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // uername or email
    // find user
    // check password
    // access and refresh token
    // send cookie

    const {email, usernamem, password} = req.body;
    if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or : [{email}, {username}]
    })

    if(!user){
        throw new ApiError(404, "user not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401, "eithe username or password is correct");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly : true,
        secure : true,
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser, accessToken, refreshToken
            },
            "user logged in successfully"
        )
    )


})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined
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



export {registerUser, loginUser, logoutUser};