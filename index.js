const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config()


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  description: String,
  duration: Number,
  date: String
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", async (req, res) => {
  try{
    if (!req.body.username) {
      return res.status(400).json({ error: "Username is required" });
    }
    const user = new User({username: req.body.username});
    await user.save();
  
    res.json({username: req.body.username, _id: user._id});
  } catch(error){
    res.status(500).json({ error: "Could not create user" });
  }
});

app.get("/api/users", async (req, res) =>{
  const users = await User.find({}, "_id username");
  res.json(users);
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  try{
    let user = await User.findById(req.params._id);
    if (!user){
      return res.status(400).json({ error: "ID not found" });
    }
    let date = req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString();

    const exercise = new Exercise({userId: user._id, description: req.body.description, duration: parseInt(req.body.duration), date: date});
    await exercise.save();

    res.json({username: user.username, description: exercise.description, duration: exercise.duration, date: exercise.date, _id: user._id})

  } catch(error){
    res.status(500).json({ error: "Could not create exercise" });
  }
});

  app.get("/api/users/:_id/logs", async (req, res) => {
    try{
      const user = await User.findById(req.params._id);

      if (!user){
        return res.status(400).json({ error: "ID not found" });
      }

      let query = {userId: user._id};
      if (req.query.from || req.query.to) {
        query.date = {};
        if (req.query.from) query.date.$gte = new Date(req.query.from);
        if (req.query.to) query.date.$lte = new Date(req.query.to);
      }

      let exercises = await Exercise.find(query)
      .select("description duration date")
      .limit(parseInt(req.query.limit) || 0);

      res.json({
        username: user.username,
        count: exercises.length,
        _id: user._id,
        log: exercises,
      });
    } catch(error){

    }

  });





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
