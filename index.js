const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;

// ✅ CORS Configuration
app.use(
  cors({
    origin: ["http://localhost:5173",
      'https://educations-fb2da.web.app',
      'https://educations-fb2da.firebaseapp.com'

    ],
    credentials: true,

  })
);

app.use(cookieParser());
app.use(express.json());

// ✅ MongoDB Connection
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.xpotf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
   

    const course_collections = client.db("education").collection("course");
    const event_collections = client.db("education").collection("event");
    const blog_collections = client.db("education").collection("blog");
    const user_collections = client.db("education").collection("user");
    const apply_collections = client.db("education").collection("apply");
    const announcements_collections = client.db("education").collection("announcements");

    // ✅ JWT Middleware
    const verifyToken = (req, res, next) => {
      const token = req.cookies?.token;

      if (!token) {
        return res.status(401).send({ message: "Unauthorized User" });
      }
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).send({ message: "Forbidden Access" });
        }
        req.decoded = decoded; // ✅ Store decoded token data
        next();
      });
    };

    // ✅ JWT Issue Route
    app.post("/jwt", async (req, res) => {
      const user = req.body.user;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1d" });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false, // Change to true in production (HTTPS required)
          sameSite: "strict",
        })
        .send({ success: true });
    });

    // ✅ Logout Route
    app.post("/logout", (req, res) => {
      res
        .cookie("token", "", {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
          expires: new Date(0), // ✅ Delete cookie
        })
        .send({ message: "Logged out successfully" });
    });

    // ✅ Verify Admin Middleware
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const user = await user_collections.findOne({ email });
      if (!user || user.role !== "admin") {
        return res.status(403).send({ message: "Forbidden access" });
      }
      next();
    };

    // course
    app.post("/courses", async (req, res) => {
      const data = req.body;
      const result = await course_collections.insertOne(data);
      res.send(result);
    });
    app.get("/courses", async (req, res) => {
      const result = await course_collections.find().toArray();
      res.send(result);
    });

    app.get("/courses/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await course_collections.findOne(query);
      res.send(result);
    });

    // events
    app.get("/events", async (req, res) => {
      const result = await event_collections.find().toArray();
      res.send(result);
    });

    app.get("/events/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await event_collections.findOne(query);
      res.send(result);
    });

    // blog
    app.post("/blog", async (req, res) => {
      const data = req.body;
      const result = await blog_collections.insertOne(data);
      res.send(result);
    });

    app.get("/blog", async (req, res) => {
      const result = await blog_collections.find().toArray();
      res.send(result);
    });

    app.get("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blog_collections.findOne(query);
      res.send(result);
    });

    // ✅ Get All Users (Admin Only)
    app.get("/user", verifyToken, verifyAdmin, async (req, res) => {
      const result = await user_collections.find().toArray();
      res.send(result);
    });

    // ✅ Check If User is Admin
    app.get("/user/:id", verifyToken, async (req, res) => {
      const email = req.decoded?.email; // ✅ Use decoded email
      if (!email) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      const user = await user_collections.findOne({ email });
      res.send({ admin: user?.role === "admin" });
    });

    // ✅ Apply Route (User's Own Applications)
    app.get("/apply", verifyToken, async (req, res) => {
      const email = req.query.email;
      if (req.decoded.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const result = await apply_collections.find({ email }).toArray();
      res.send(result);
    });
      // ✅ Apply Route (admin's Own Applications)
      app.get('/adminapply', verifyToken, verifyAdmin, async (req, res) => {
     
       const result= await apply_collections.find().toArray();
       res.send(result)
      })

    // ✅ Delete User Route
    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const result = await user_collections.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // ✅ Make User Admin
    app.patch("/user/:id", async (req, res) => {
      const id = req.params.id;
      const result = await user_collections.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role: "admin" } }
      );
      res.send(result);
    });

    app.get("/admin-Stutus",verifyToken,verifyAdmin ,async (req, res) => {
      const userCount = await user_collections.countDocuments();
const blogCount = await blog_collections.countDocuments();
const applyCount = await apply_collections.countDocuments();
const eventCount = await event_collections.countDocuments();
const courseCount = await course_collections.countDocuments();



      res.send({ applyCount, blogCount, userCount,eventCount,courseCount });
    });

    // announcements
    app.get('/announcements',async(req,res)=>{
      const result =await announcements_collections.find().toArray();
      res.send(result)
    })
    app.post('/announcements',async(req,res)=>{
      const query= req.body;
      const resutl = await announcements_collections.insertOne(query);
      res.send(resutl)
    })




    
    app.get("/", (req, res) => {
      res.send("Hello World!");
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
