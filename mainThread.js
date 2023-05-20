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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true})); 
const storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, './style/image');
	},
  

	filename: function(req, file, cb) {
		cb(null,file.originalname);
	}
  })
  var upload=multer({storage:storage})
app.get('/',(req,res)=>{
	res.render("home")
})
app.get('/login',(req,res)=>{
	res.render("home")
})
app.get('/quay_lai',(req,res)=>{
	res.render("product_view",{a:req.session.ds_popularProduct})
})
app.get('/add_product',(req,res)=>{
	res.render("add_product_form")
})
app.post('/add_product_handle',upload.single("product_img"),(req,res)=>{
	var masp=req.body.masp;
	var tensp=req.body.tensp;
	var price=req.body.price;
	var category=req.body.category;
	var url='../style/image/'+req.file.filename
	con.query("insert into product values(?,?,?,?,?)",[masp,tensp,price,category,url],(err,result)=>{
		console.log("AC");
	})
	res.render("product_view",{a:req.session.ds_popularProduct})
})
app.get('/search',(req,res)=>{
	
	var key="%"+req.query.keySearch+"%";let a=[];
	console.log(req.session.user)
	con.query("select * from product where tensp like ?",[key],(err,result)=>{
		
		result.map(element=>{
			a.push({
				masp:element.masp,
				tensp:element.tensp,
				price:element.price,
				url:element.url
			})
		})
		req.session.user.ds_search=a;res.render('searchPage',{ds_search:req.session.user.ds_search})
	})
	
})
app.get('/viewCart',(req,res)=>{
	var sessionid=req.session.user.ordersid;
	let a=[]
con.query("select product.masp,url,tensp,price,soluong,price*soluong as price1 from product inner join orders_detail where product.masp=orders_detail.masp and orders_detail.ma_orders=?",[sessionid],function(error,result,field){
	if(error) throw error;
	result.map((element)=>{
		a.push({
			masp:element.masp,
			tensp:element.tensp,
			price:element.price,
			sl:element.soluong,
			price1:element.price1
	})
	})
	cart=a;
	console.log(cart,sessionid);
	res.render("viewCart",{cart:a})
})
})
app.get('/update_sl',(req,res)=>{
	var sessionid=req.session.user.ordersid;
	var masp=req.query.masp;
	var sl=req.query.sl;
	console.log(sessionid+" "+masp+" "+sl+" /-/-/-")
	con.query("update orders_detail set soluong=? where masp=? and ma_orders=?",[sl,masp,sessionid],(err,result)=>{
		if(err) throw err;
		console.log("abcxyz");
	})
	let a=[]
con.query("select product.masp,tensp,price,soluong,price*soluong as price1 from product inner join orders_detail where product.masp=orders_detail.masp and orders_detail.ma_orders=?"
  ,[sessionid],function(error,result,field){
	if(error) throw error;
	result.map((element)=>{
		a.push({
			masp:element.masp,
			tensp:element.tensp,
			price:element.price,
			sl:element.soluong,
			price1:element.price1
	})
	})
	cart=a;
	console.log(cart,sessionid);
	res.render("viewCart",{cart:a})
})
})
app.get('/delete_miniCart',(req,res)=>{
	var masp=req.query.masp;
	var sessionid=req.session.user.ordersid
	con.query("delete from orders_detail where ma_orders=? and masp=?",[sessionid,masp],function(err,result){
		if(err) throw err;
	})
	console.log(masp+"  "+sessionid);
	let a=[]
	con.query("select product.masp,tensp,price,soluong,price*soluong as price1 from product inner join orders_detail where product.masp=orders_detail.masp and orders_detail.ma_orders=?",[sessionid],function(error,result,field){
		if(error) throw error;
		result.map((element)=>{
			a.push({
				masp:element.masp,
				tensp:element.tensp,
				price:element.price,
				sl:element.soluong,
				price1:element.price1
		})
		})
		cart=a;
		console.log(cart,sessionid);
		res.render("viewCart",{cart:a})
	})
})
app.get('/sign_up',(req,res)=>{
  res.sendFile(path.join(__dirname+"/signup.html"));
})
app.get('/sign_up_user',(req,res)=>{
  var username = req.query.username;
	var pass = req.query.password;
  var sql = "INSERT INTO users  VALUES (?, ?)";
  con.query(sql, [username, pass], function (err, result) {
    if (err) throw err;
    console.log("1 record inserted");
  });
  res.render("home");
})
app.get('/home',(req,res)=>{
	console.log(req.session.ds_popularProduct)
	res.render("product_view",{a:req.session.ds_popularProduct})
})
app.post('/auth',function(request, response) {
	request.session.regenerate((err)=>{
		request.session.ds_popularProduct="";
	})
	let ds_popular=[];
	con.query("select product.masp,url,tensp,price,sum(soluong) as sl from orders_detail inner join product on orders_detail.masp=product.masp group by masp order by sl desc limit 4;"
	,(err,result)=>{
		result.map(element=>{
			ds_popular.push(
				{
					masp:element.masp,
					tensp:element.tensp,
					url:element.url,
					price:element.price
				}
			)
		})
		request.session.ds_popularProduct=ds_popular;
	})
	var username = request.body.username;
	var pass = request.body.password;

	if (username && pass) {
		con.query('SELECT * FROM users WHERE username = ? AND pass = ?', [username, pass], function(error, results, fields) {
			if (results.length > 0) {
				
				let id=new Date();
				request.session.user = { name:username ,ordersid:id.toString(),state:0,ds_beverage:"",ds_household:"",
				ds_kitchen:"",ds_pet:"",ds_veg:"",ds_search:""
			};
				var k=request.session.user.name;
				console.log(request.session.user);
				response.render('product_view',{a:request.session.ds_popularProduct});
			} else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		});
		//request.session.user.ds_popularProduct="1234";
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
})
app.get('/household',(req,res)=>{
	let a=[];
	console.log(req.session.user.name+"  "+req.session.user.ordersid)
	con.query("select * from product where category=?",["household"],function(error,result,field){
		if(error) throw error;
			result.map(element => {
		 a.push({
			masp:element.masp,
			tensp:element.tensp,
			price:element.price,
			url:element.url
			})
						  
		});
		req.session.user.ds_household=a;
		res.render('householdPage',{ds_household:a});
		
	})
})
app.get('/veg',(req,res)=>{
	let a=[]
	con.query("select * from product where category=?",["vegetable"],function(error,result,field){
		if(error) throw error;
			result.map(element => {
		 a.push({
			masp:element.masp,
			tensp:element.tensp,
			price:element.price,
			url:element.url
			})
						  
		});
		req.session.user.ds_veg=a;
		res.render('vegtablePage',{ds_veg:a});
		
	})
})
app.get('/kitchen',(req,res)=>{
	let a=[]
	con.query("select * from product where category=?",["kitchen"],function(error,result,field){
		if(error) throw error;
			result.map(element => {
		 a.push({
			masp:element.masp,
			tensp:element.tensp,
			price:element.price,
			url:element.url
			})
						  
		});
		req.session.user.ds_kitchen=a;
		res.render('kitchenPage',{ds_kitchen:a});
		
	})
})
app.get('/beverage',(req,res)=>{
	let a=[]
	con.query("select * from product where category=?",["beverage"],function(error,result,field){
		if(error) throw error;
			result.map(element => {
		 a.push({
			masp:element.masp,
			tensp:element.tensp,
			price:element.price,
			url:element.url
			})
						  
		});
		req.session.user.ds_beverage=a;
		res.render('beveragePage',{ds_beverage:a});
		
	})
})
app.get('/pet',(req,res)=>{
	let a=[]
	con.query("select * from product where category=?",["petfood"],function(error,result,field){
		if(error) throw error;
			result.map(element => {
		 a.push({
			masp:element.masp,
			tensp:element.tensp,
			price:element.price,
			url:element.url
			})
						  
		});
		req.session.user.ds_pet=a;
		//console.log("pet"+" "+JSON.stringify(a))
		res.render('petPage',{ds_pet:a});
		
	})
})
app.get('/addCart',(req,res)=>{
	var masp=req.query.masp;
	var pages=req.query.pages;
	console.log(req.session.user)
	var ordersid=req.session.user.ordersid;
	var username=req.session.user.name;

	var state=req.session.user.state;

	if(state==0){
		req.session.user.state=1;
		con.query("insert into orders value(?,?)",[ordersid,username] , function (err, data) {
			if (err) {

			} else {
				
			}
		})
		
	}
	let update=0;
	con.query("update orders_detail set soluong=soluong+1 where ma_orders=? and masp=?",[ordersid,masp] , function (err, result) {
		if (err) {
			// some error occured
		} else {
			if(result.affectedRows>0){
				update=1;
				if(pages=="searchPage"){
					res.render(pages,{ds_search:req.session.user.ds_search});return;};
				if(pages=="product_view"){
					res.render(pages,{a:req.session.ds_popularProduct});return;};
				//res.render("home");
				if(pages=="householdPage"){
					res.render(pages,{ds_household:req.session.user.ds_household});return;};
				if(pages=="beveragePage"){
					res.render(pages,{ds_beverage:req.session.user.ds_beverage});return;}
				if(pages=="petPage"){
					res.render(pages,{ds_pet:req.session.user.ds_pet});return;}
				if(pages=="vegtablePage"){
					res.render(pages,{ds_veg:req.session.user.ds_veg});return;}
				if(pages=="kitchenPage"){
					res.render(pages,{ds_kitchen:req.session.user.ds_kitchen});return;}

			}
		}
	})

	if(update==0){
	con.query("insert into orders_detail value(?,?,?)",[ordersid,masp,"1"] , function (err, data) {
		if (err) {
			// some error occured
		} else {  
			console.log("success")
			// successfully inserted into db
		}
	})

	let a=[]
	if(pages=="searchPage"){
		res.render(pages,{ds_search:req.session.user.ds_search});return;};
	if(pages=="product_view"){
		res.render(pages,{a:req.session.ds_popularProduct});return;};
	if(pages=="householdPage"){
					res.render(pages,{ds_household:req.session.user.ds_household});return;}
				if(pages=="beveragePage"){
					res.render(pages,{ds_beverage:req.session.user.ds_beverage});return;}
				if(pages=="petPage"){
					res.render(pages,{ds_pet:req.session.user.ds_pet});return;}
				if(pages=="vegtablePage"){
					res.render(pages,{ds_veg:req.session.user.ds_veg});return;}
				if(pages=="kitchenPage"){
					res.render(pages,{ds_kitchen:req.session.user.ds_kitchen});return;}
}
})
// app.get("/viewCart",(req,res)=>{
// 	res.send("like")
// })
app.listen(3000,()=>{
	console.log("success")
})
