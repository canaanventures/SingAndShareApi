const express = require('express'),
http = require('http'),
port = process.env.PORT || 3000,
mysql = require('mysql2'),
app = express(),
bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const authorize = require('./authorization/authorization-middleware');
const config = require('./authorization/config');

app.set("views",path.join(__dirname,"views"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json()); 
app.set('view engine', 'ejs');
app.use(express.static('public'));

const DIR = './uploads/events';
var photopath = '';

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  	next();
});
 
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, DIR);
    },
    filename: (req, file, cb) => {
	    //cb(null, file.fieldname + '-' + Date.now() + '.' + path.extname(file.originalname));	    
	    var dte = req.body.event_start_date;	    
		var a = dte.split('T');
	    var b = dte.split('T')[0].split('-').join('_');		
	    var c = dte.split('T')[1].split(':').join('_');
	    var reqdte = b+'_'+c;
	    photopath = '/uploads/events/event_' + req.body.event_venue +'_'+ reqdte + path.extname(file.originalname);
	    cb(null, 'event_' + req.body.event_venue +'_'+ reqdte + path.extname(file.originalname));
    }
});
var upload = multer({storage: storage}); 

//app.listen(port, () => console.log(`Example 123 app listening on port ${port}!`));

/*const db = mysql.createPool({
	host: '65.175.118.74',
	port: '2082',
	user: 'admin_sing_and_share',
	password: 'Sing&Share@123',
	database: 'admin_sing_and_share'
});*/

const db = mysql.createPool({
	/*host: 'localhost',
	user: 'root',
	password: '',
	database: 'singandshare'*/
	host:'sql324.main-hosting.eu',
	user: 'u671633553.singandshare',
	password: 'Admin@123',
	database: 'u671633553_SingAndShare'
});

app.post('/login',function(req,res){
	const user = {
		email : req.body.email,
		password : req.body.pass_word,
		scopes:["customer:create","customer:read"]
	}
	let sql = "SELECT * from users WHERE user_email_id = '"+req.body.email+"'";
	console.log("1=>"+req.body.email);
	db.getConnection(function (err, connection) {
		console.log("2=>"+req.body.pass_word);
		if(err){
            console.log(err);
        }else{
        	console.log("3=>"+req.body.pass_word);
			connection.query(sql, function(err, data, fields) {
				console.log("4=>"+req.body.pass_word);
				if(err){
					res.json({
						status: null,
						message: err
				   	});
				}else{
					console.log("5=>"+req.body.pass_word);
					let query = "SELECT user_password from users_password WHERE user_email_id = '"+req.body.email+"'";
					connection.query(query, function(err, data, fields) {
						console.log("6=>"+req.body.pass_word);
						if(err){
							res.json({
								status: null,
								message: err
						   	});
						}else{
							if(data[0].user_password == req.body.pass_word){
								jwt.sign(user, 'my secret key', (err,token) => {
									res.json({
										status: 200,
										message: "User logged in successfully.",
										token : token
									});
								})
							}else{
								res.json({
									status: 200,
									message: "Incorrect password."
								});
							}
						}
					})
				}
			})
			connection.release();
		}
	});
})

app.post('/register',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "INSERT INTO users (user_first_name, user_last_name, user_email_id, user_created_date) VALUES ('"+req.body.user_first_name+"','"+req.body.user_last_name+"','"+req.body.user_email_id+"','"+reqdte+"')";
	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			let sql = "INSERT INTO users_password (user_password,user_email_id) VALUES ('"+req.body.user_password+"','"+req.body.user_email_id+"')";
			db.query(sql, function(err, data, fields) {
				if(err){
					res.json({
						status: null,
						message: err
				   	});
				}else{
					let sql = "INSERT INTO usersdetails (user_address,user_city,user_country) VALUES ('"+req.body.user_address+"','"+req.body.user_city+"','"+req.body.user_country+"')";
					db.query(sql, function(err, data, fields) {
						if(err){
							res.json({
								status: null,
								message: err
						   	});
						}else{
							res.json({
								status: 200,
								message: "User logged in successfully."
							});
						}
					});
				}
			});
		}
	});
})

app.post('/checkUser',function(req,res){
	let sql = "SELECT * from users WHERE user_email_id = '"+req.body.email+"'";
	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			if(data.length == 0){
				res.json({
					status: 201,
					email: req.body.email,
					message: "User Does not exist"
			   	});
			}else{
				res.json({
					status: 200,
					email: req.body.email,
					message: "User exists"
			   	});
			}
		}
	})
})

function imageFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb (null, true);
}

app.post('/addEventImg',upload.single('image'),function(req,res){		
	res.json({
		status: 200,
		message: "Event Banner Added successfully.",
		filepath: photopath
	});
})

app.post('/addEvent',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "INSERT INTO events (event_name, event_start_date, event_end_date, cost_per_person, description, created_by_user_id, created_date, modified_user_id, modified_user_date, venue_id, event_status_id,event_type_id, poster_url) VALUES ('"+req.body.event_name+"','"+req.body.event_start_date+"','"+req.body.event_end_date+"','"+req.body.cost_per_person+"','"+req.body.event_description+"','"+req.body.created_by_user_id+"','"+reqdte+"','"+req.body.modified_user_id+"','"+reqdte+"','"+req.body.venue+"','"+req.body.event_status+"','"+req.body.event_type+"','"+req.body.imgurl+"')";

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Event Added successfully."
			});						
		}
	});
})

app.get('/getEvents',authorize("customer:read"), function(req,res){ //
	let sql = "SELECT e.event_id, poster_url from events as e inner join event_status as es on e.event_status_id = es.event_status_id where es.event_status in('On Going','Upcoming')";

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				data: data,
				message: "List fetched successfully."
			});						
		}
	});
})

app.post('/addVenue',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	req.body.modified_by_user_id = 1;req.body.created_by_user_id = 1;

	let sql = "INSERT INTO venue (venue_name, description, created_by_user_id, created_date, modified_by_user_id, modified_date) VALUES ('"+req.body.venue_name+"','"+req.body.venue_desc+"','"+req.body.created_by_user_id+"','"+reqdte+"','"+req.body.modified_by_user_id+"','"+reqdte+"')";

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Venue Added successfully."
			});						
		}
	});
})

app.get('/getVenue',function(req,res){
	let sql = "SELECT * FROM venue";

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				data: data,
				message: "List fetched successfully."
			});						
		}
	});
})

app.post('/addEventType',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	req.body.modified_by_user_id = 1;req.body.created_by_user_id = 1;

	let sql = "INSERT INTO event_type (EventType, CreatedByUserID, CreatedDate, ModifiedByUserID, ModifiedDate) VALUES ('"+req.body.event_type+"','"+req.body.created_by_user_id+"','"+reqdte+"','"+req.body.modified_by_user_id+"','"+reqdte+"')";

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Event type Added successfully."
			});						
		}
	});
})

app.get('/getEventType',function(req,res){
	let sql = "SELECT * FROM event_type";

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				data: data,
				message: "List fetched successfully."
			});						
		}
	});
})

app.post('/addStatus',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	req.body.modified_by_user_id = 1;req.body.created_by_user_id = 1;

	let sql = "INSERT INTO event_status (event_status, created_by_user_id, created_date, modified_by_user_id, modified_date) VALUES ('"+req.body.status_name+"','"+req.body.created_by_user_id+"','"+reqdte+"','"+req.body.modified_by_user_id+"','"+reqdte+"')";

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Status Added successfully."
			});						
		}
	});
})

app.get('/getEventStatus',function(req,res){
	let sql = "SELECT * FROM event_status";

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				data: data,
				message: "List fetched successfully."
			});						
		}
	});
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`));