import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import  jwt  from 'jsonwebtoken';

export const verifyJWT=asyncHandler(async (req,res,next)=>{
    console.log("COOKIES:", req.cookies)
console.log("AUTH HEADER:", req.headers.authorization)

    try {
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    
    
        if(!token ){
            throw new ApiError(404,"unauthorized request")
        }
    
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user =await User.findById(decodedToken?.id).select("-password -refreshToken")
        
    
        if(!user){
            throw new ApiError(401,"Invalid Access Token")
        }
        
        req.user=user
        next()
    } catch (error) {
        console.log("JWT ERROR:", error)   
        throw new ApiError(401,"Invalid Access Token ")
    }
})