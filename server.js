const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const jwt = require("jsonwebtoken");

app.use(express.json()); // for parsing application/json

// ------ WRITE YOUR SOLUTION HERE BELOW ------//

const JWT_SECRET = "your_secret_key";

const users = [];
const highScores = [];

// POST /signup
app.post("/signup", (req, res) => {

  const { userHandle, password } = req.body;

  // Validate request body
  if (!userHandle || !password) {
    return res.status(400).send("Invalid request body");
  } 
  if (typeof userHandle !== 'string' || typeof password !== 'string') {
    return res.status(400).send("userHandle and password must be strings");
  }
  if (userHandle.length < 6 || password.length < 6) {
    return res.status(400).send("Invalid request body");
  }
  // if (users.find(u => u.userHandle === userHandle)) {
  //   return res.status(400).send("User already exists");
  // }
  users.push({ userHandle, password });
  res.status(201).send("User registered successfully");
});

// POST /login
app.post("/login", (req, res) => {

  const { userHandle, password } = req.body;

    //Check for extra fields in request body
    const allowedFields = ['userHandle', 'password']; 
    const requestFields = Object.keys(req.body); 
  
    const hasExtraFields = requestFields.some(field => !allowedFields.includes(field));
    if (hasExtraFields) {
      return res.status(400).send("Invalid request body");
    }
  

  // Validate request body
  if (!userHandle || !password) {
    return res.status(400).send("Invalid request body");
  }
  if (typeof userHandle !== "string" || typeof password !== "string") {
    return res.status(400).send("Invalid data type for userHandle or password");
  }
  if (userHandle.length < 6 || password.length < 6) {
    return res.status(400).send("Invalid request body");
  }

  // Check if user exists
  const user = users.find(u => u.userHandle === userHandle);
  if (!user || user.password !== password) {
    return res.status(401).send("Unauthorized");
  }

  // Generate JWT token
  const payload = { userHandle }; 
  const jsonWebToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

  res.status(200).send({ jsonWebToken }); 
});



// Middleware to verify JWT token
const verifyJWT = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; 

  if (!token) {
    return res.status(401).send("No token provided");
  }

  
  // console.log("Token received:", token);

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send("Invalid or expired token");
    }
    req.user = decoded; 
    next(); 
  });
};

//POST /post high scores
app.post("/high-scores", (req, res, next) => {

  const { level, userHandle, score, timestamp } = req.body;

  // Validate request body for data types and missing fields
  if (!level || !userHandle || score === undefined || !timestamp) {
    return res.status(400).send("Invalid request body");
  }

  if (typeof level !== "string" || typeof userHandle !== "string" || typeof score !== "number" || typeof timestamp !== "string") {
    return res.status(400).send("Invalid data types in request body");
  }

  next(); 
}, verifyJWT, (req, res) => {

  const { level, userHandle, score, timestamp } = req.body;

  if (req.user.userHandle !== userHandle) {
    return res.status(401).send("Unauthorized");
  }

  const newHighScore = { level, userHandle, score, timestamp };
  highScores.push(newHighScore);

  res.status(201).send({ message: "High score posted successfully", highScore: newHighScore });
});

// GET /high-scores
app.get("/high-scores", (req, res) => {
  const { level, page = 1 } = req.query; 
  if (!level) {
    return res.status(400).send("Level is required");
  }

  const limit = 20; 
  const skip = (page - 1) * limit;  

  const levelScores = highScores.filter(score => score.level === level);
  const sortedScores = levelScores.sort((a, b) => b.score - a.score);
  const paginatedScores = sortedScores.slice(skip, skip + limit);

  res.status(200).json(paginatedScores);
});

//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};
