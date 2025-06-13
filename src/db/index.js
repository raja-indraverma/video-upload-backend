import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstace = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) 
        console.log(`\n mongodb connected! DB HOST : ${connectionInstace.connection.host}`);
    } catch (error) {
        console.log("MONGODB commection error: ", error)
        process.exit(1)
    }
}

export default connectDB;  