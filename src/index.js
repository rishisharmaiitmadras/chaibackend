import dotenv from "dotenv"
import connectDB from "./db/index.js"

dotenv.config({
    path:'./env'
})

connectDB()










/*
(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on((error)=>{
            console.log("Error",error)
            throw error
        })
    } catch (err) {
        console.error("Error :",err )
        throw err
        
    }
})()
*/