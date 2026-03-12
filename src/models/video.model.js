import mongoose, { Schema } from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"
const videoSchema=new Schema({
    videoFile:{
        type:String, //cloudinary url
        required:[true,"videoFile is required"]
    },
    thumbnail:{
        type:String, 
        required:[true,"thumbnail is required"]
    },
    title:{
        type:String,
        required:[true,"title is required"]
    },
    description:{
        type:String, 
        required:[true,"description is required"]
    },
    duration:{
        type:Number, // cloudinary
        required:true

    },
    views:{
        type:Number,
        required:true,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
    
},{timestamps:true})


videoSchema.plugin(mongooseAggregatePaginate)
export const Video=mongoose.model("Video",videoSchema)