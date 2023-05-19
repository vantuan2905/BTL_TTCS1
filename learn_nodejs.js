const express=require("express")
const path=require("path");
const multer = require('multer');
const app=express()
var session = require('express-session');
const redis=require('redis')
const redisClient=redis.createClient()

var mysql = require('mysql');
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "minhngoc",
  database: "banhang"
});
con.connect(function(err) {
  if(err){
    console.error("error111");return;
  }
});
app.use(session({
    resave: false, 
    saveUninitialized: true, 
    secret: 'keyboard cat', 
    cookie: { secure:false},
	//store: new redisStore({ host: 'localhost', port: 6379, client: redisClient,ttl: 86400 })
}));
app.set("view engine","ejs")
app.use("/style", express.static(__dirname + "/style"));
app.use("/image", express.static(__dirname + "/style"));
var bodyParser = require('body-parser');
const { use } = require("bcrypt/promises");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true})); 
app.get('/',(req,res)=>{
	res.sendFile(path.join(__dirname+"/test.html"))
})
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, './style/image');
  },

  // By default, multer removes file extensions so let's add them back
  filename: function(req, file, cb) {
      cb(null, file.originalname);
  }
})
var upload=multer({storage:storage})
app.post('/add_product_handle',upload.single("product_img"),async(req,res)=>{
  console.log(req.file);
res.send(" ok")
});
app.listen(3000,()=>{
  
	console.log("suces")
})