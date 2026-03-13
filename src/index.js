import dotenv from "dotenv"
import connectDB from "./db/index.js"
import app from "./app.js"
dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>{
    app.on("Error",(err)=>{
        console.error("ERROR",err);
        throw err;
    })
    app.listen(process.env.PORT || 8000 ,()=>{
        console.log(`Server is running on the port :- ${process.env.PORT}`)
    })
})
.catch((err)=>{console.log(`MongoDB connection failed: ${err}`)})










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