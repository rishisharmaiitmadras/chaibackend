import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"



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

export default registerUser