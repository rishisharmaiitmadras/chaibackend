import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import cookieParser from "cookie-parser"
import jwt  from 'jsonwebtoken';


const generateAccessAndRefreshToken=async (userId)=>{
    try {
        const user = await User.findById(userId)

        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}

        
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token ")
    }
}
const registerUser=asyncHandler(async (req,res)=>{
    //get user details from frontend
    //validation- not empty 
    //check if user already Exist - check by username or email
    //check for images , check for avatar
    // if images and avatar there then usko cloudinary ko bhejo by url, then check for avatar in cloudinary
    //create user object - create entry in db
    //remove password and refreshtoken from response 
    //check for user creation
    //return res
    // console.log("FILES RECEIVED:", req.files)
    const {fullname,email,username,password}=req.body
    console.log("email",email)


    if(
        [fullname,email,username,password].some((field)=>field?.trim()==="")

    ){
       throw new ApiError(400,"all fields are compulsory")
    }

   
    //check if user already exist or not 

    const existedUser=await User.findOne({
        $or:[{ username },{ email }]
    })
    if (existedUser){
        throw new ApiError(409,"user with email or username already exist")
    }

    

    const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;
   
    // const avatarFile = req.files.find(file => file.fieldname === "avatar")
    // const coverImageFile = req.files.find(file => file.fieldname === "coverImage")

    // const avatarLocalPath = avatarFile?.path
    // const coverImageLocalPath = coverImageFile?.path

    let coverImageLocalPath;
    if(req.files &&  Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path
    }
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }
    
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }
    
    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
 

    const CreatedUser=await User.findById(user._id).select(
        "-password -refreshToken" 
    )

    if(!CreatedUser){
        throw new ApiError(500,"something went wrong while registring the user ")
    }

    return res.status(201).json(
        new ApiResponse(200,CreatedUser,"User registered successfully")
    )
})

const loginUser = asyncHandler(async(req,res)=>{
    //req se data le aao
    //username or email
    //find the user
    //check password  
    // if password true then access and refreshToken dono user ko dedo
    // send to cookies 
    //response logined

    const {email,username,password}=req.body

    if(!(username || email)){
        throw new ApiError(400,"username or email is required ")
    }
    const user=await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"User does not Exist")
    }

    const isPasswordValid=await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(404,"Invalid User Credential")
    }

    const {accessToken,refreshToken}= await generateAccessAndRefreshToken(user._id)

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    //sending a cookies

    const option={
        httpOnly:true,
        secure:false
    }

    return res.status(200).cookie("accessToken",accessToken,option).cookie("refreshToken",refreshToken,option).json(
        new ApiResponse(200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "user LoggedIn successfully"
        )
    )


    
})

const logOutUser =asyncHandler(async(req,res)=>{

    const option={
        httpOnly:true,
        secure:false
    }
    await User.findByIdAndUpdate(req.user._id,
        {
            $set:{refreshToken:undefined}
        },
        {
            new:true
        }
    )
    return res
        .status(200)
        .clearCookie("accessToken",option)
        .clearCookie("refreshToken",option)
        .json(new ApiResponse(200,{},"user loggedOut successfully"))
    
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }
    
    try {
        const decodedToken=jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user =await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
    
        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401,"Refresh Token is expired or used")
        }
    
        const option={
            httpOnly:true,
            secure:false
        }
    
        const {accessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,option)
        .cookie("refreshToken",newRefreshToken,option)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,refreshToken:newRefreshToken
                },
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refresh Token")
        
    }
})

export 
{
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken
}
