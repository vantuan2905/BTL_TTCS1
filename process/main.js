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
let a=[]
con.query("select product.masp,tensp,price,soluong,price*soluong as price1 from product inner join orders_detail where product.masp=orders_detail.masp and orders_detail.ma_orders=?",["Thu May 18 2023 07:49:59 GMT+0700 (Indochina Time)"],function(error,result,field){
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
	console.log(a)
})
