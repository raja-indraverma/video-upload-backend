import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';    
import { User } from '../models/user.models.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

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

    const existingUser = User.findOne({
        $or: [{username}, {email}]
    })
    if(existingUser){
        throw new ApiError(409, "username or email already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.fiels?.coverImage[0]?.path;
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

export {registerUser};