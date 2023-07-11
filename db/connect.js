const mongoose = require('mongoose');

const uri = "mongodb+srv://pk497243:pk497243@webapp.bbokhow.mongodb.net/?retryWrites=true&w=majority";

const connectDb = async () => {
    try {
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to the database");
    } catch (error) {
        console.log("Could not connect to the database", error);
    }
   
    
    };

module.exports = connectDb;