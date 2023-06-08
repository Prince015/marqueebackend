const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());
const port = process.env.PORT;

const connectDB = require('./config/connect');

const auth = require('./routes/auth');
const todo = require('./routes/todos');
const user = require('./routes/user');

app.get('/', (req, res) => {
    res.send('Express + TypeScript Server');
});

app.use("/app",auth)
app.use("/todo",todo)
app.use("/user",user)




const start = async () => {
    try {
        await connectDB(process.env.MONGO_URL);
        app.listen(port, () =>
            console.log(`Server Running on port : ${port}...`)
        );
    } catch (error) {
        console.log(error);
    }
};

start();