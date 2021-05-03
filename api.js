const express = require('express'),
http = require('http'),
port = process.env.PORT || 3000,
mysql = require('mysql2'),
app = express(),
nodemailer = require('nodemailer'),
bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const authorize = require('./authorization/authorization-middleware');
const config = require('./authorization/config');
const constant = require('./authorization/constant');
const registration_email = require('./email_templates/registration');
const contact_email = require('./email_templates/contact');

//app.set("views",path.join(__dirname,"views"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json()); 
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('./uploads',express.static('public'));

//const DIR = './uploads/events';

var photopath = '';
var usertableresp = '';

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  	next();
});
 
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, constant.DIR);
    },
    filename: (req, file, cb) => {
	    //cb(null, file.fieldname + '-' + Date.now() + '.' + path.extname(file.originalname));	    
	    var dte = req.body.event_start_date;	    
		var a = dte.split('T');
	    var b = dte.split('T')[0].split('-').join('_');		
	    var c = dte.split('T')[1].split(':').join('_');
	    var reqdte = b+'_'+c;
	    photopath = 'uploads/events/event_' + req.body.event_venue +'_'+ reqdte + path.extname(file.originalname);
	    cb(null, 'event_' + req.body.event_venue +'_'+ reqdte + path.extname(file.originalname));
    }
});
var upload = multer({storage: storage});


var blogstorage = multer.diskStorage({
    destination: (req, file, cb) => {
    	//fs.mkdirsSync(constant.blogsDir);
      	//cb(null, constant.blogsDir);
      	cb(null, './uploads/blogs');
    },
    /* changeDest: function(dest, req, res) {
	    var newDestination = dest + req.params.type;
	    var stat = null;
	    try {
	        stat = fs.statSync(newDestination);
	    } catch (err) {
	        fs.mkdirSync(newDestination);
	    }
	    if (stat && !stat.isDirectory()) {
	        throw new Error('Directory cannot be created because an inode of a different type exists at "' + dest + '"');
	    }
	    return newDestination
	}, */
    filename: (req, file, cb) => {
	    var dte = new Date();
	    //var title = req.body.title.split(' ').join('_');
	    //var cat = req.body.category.split(' ').join('_');
		var a = dte.getDate()+'_'+(dte.getMonth+1)+'_'+dte.getFullYear()+'_'+dte.getHours()+'_'+dte.getMinutes()+'_'+dte.getSeconds();
		photopath = 'blogs/blog_abc'+path.extname(file.originalname);
		cb(null, 'blog_abc'+path.extname(file.originalname));
		//photopath = 'blogs/blog_' + a + '_' + path.extname(file.originalname);
		//cb(null, 'blog_' + a + '_' + path.extname(file.originalname));
	    //photopath = 'blogs/blog_' + title +'_'+ a + '_' + path.extname(file.originalname);
	    //cb(null, 'blog_' + title +'_'+ a + '_' + path.extname(file.originalname));
    }
});
var blogupload = multer({storage: blogstorage}); 

//app.listen(port, () => console.log(`Example 123 app listening on port ${port}!`));

//host: 'server1.cjeast.com',

const db = mysql.createPool({
	host: '65.175.118.74',
	user: 'admin_sas',
	password: 'S@SAdmin9',
	database: 'admin_singandshare'
});

/*const db = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'singandshare'
});*/

/*const db = mysql.createPool({
	host:'sql324.main-hosting.eu',
	user: 'u671633553_sas_admin',
	password: 'S@SAdmin9',
	database: 'u671633553_singandshare'
});*/

const mailerdetails = nodemailer.createTransport({
    service: 'gmail',
 	auth: {
        user: constant.info_email,
        pass: constant.info_password
    }
});

app.post('/login',function(req,res){
	let sql = "SELECT status from users where user_email_id ='"+req.body.email+"'";
	db.query(sql, function(err, data, fields) {
		if(data[0].status == 'Disable'){
			res.json({
				status: 201,
				message: "You are not authorized to login"
			});
		}else{
			let sql = "SELECT * from users WHERE user_email_id = '"+req.body.email+"'";
			db.getConnection(function (err, connection) {
				if(err){
		            console.log(err);
		        }else{
					connection.query(sql, function(err, data, fields) {
						if(err){
							res.json({
								status: null,
								message: err
						   	});
						}else{
							let query = "SELECT user_password from users_password WHERE user_email_id = '"+req.body.email+"'";
							connection.query(query, function(err, data, fields) {
								if(err){
									res.json({
										status: null,
										message: err
								   	});
								}else{
									if(data[0].user_password == req.body.pass_word){					
										let query = "SELECT * from users WHERE user_email_id = '"+req.body.email+"'";
										connection.query(query, function(err, data, fields) {
											if(err){
												res.json({
													status: null,
													message: err
											   	});
											}else{
												const user = {
													email : data[0].user_email_id,
													user_id : data[0].user_id,
													first_name : data[0].user_first_name,
													last_name : data[0].user_last_name,
													scopes:["customer:create","customer:read"]
												}
												jwt.sign(user, 'my secret key', (err,token) => {
													res.json({
														status: 200,
														message: "User logged in successfully.",
														token : token,
														data: data
													});
												})
											}									
										})
									}else{
										res.json({
											status: 201,
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
		}
	});
})

app.post('/register',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "INSERT INTO users (user_first_name, user_last_name, user_email_id, user_created_date, role_id, mentor_email_id, user_contact_number,status) VALUES ('"+req.body.user_first_name+"','"+req.body.user_last_name+"','"+req.body.user_email_id+"','"+reqdte+"','"+req.body.role_id+"','"+req.body.mentor_email_id+"','"+req.body.user_contact_number+"','"+req.body.status+"')";

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
					let param ={
						"email_id" : req.body.user_email_id,
						"password" : req.body.user_password
					}
					var description = registration_email.user_register(param);

				   	var mailOptions={
				        to: req.body.user_email_id,
						subject: 'Welcome to SingAndShare !!!',
						html: description
				    }

				    mailerdetails.sendMail(mailOptions, function(error, response){
					    if(error){
					        res.end("error");
					    }else{
					        res.json({
								status: 200,
								message: "You have been successfully registered. email has been sent to your mentioned ID."
							});
					    }
					});
					
					/*let sql = "INSERT INTO usersdetails (user_address,user_city,user_country) VALUES ('"+req.body.user_address+"','"+req.body.user_city+"','"+req.body.user_country+"')";
					db.query(sql, function(err, data, fields) {
						if(err){
							res.json({
								status: null,
								message: err
						   	});
						}else{
							res.json({
								status: 200,
								message: "User registered successfully."
							});
						}
					});*/
				}
			});
		}
	});
})

app.post('/changeUserStatus',function(req,res) {
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "UPDATE users SET status = '"+req.body.status+"', modified_by_user_id = '"+req.body.modified_by_user_id+"', modified_on = '"+reqdte+"' WHERE user_id="+req.body.userid;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "User "+req.body.status+"d successfully."
			});						
		}
	});
})

app.post('/updateUser',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "UPDATE users , users_password SET users.user_first_name = '"+req.body.first_name+"', users.user_last_name = '"+req.body.last_name+"', users.user_email_id = '"+req.body.email_id+"', users.role_id = '"+req.body.role+"', users.mentor_email_id = '"+req.body.mentor_email_id+"', users.modified_by_user_id = '"+req.body.modified_by+"', users.modified_on = '"+reqdte+"', users_password.user_email_id = '"+req.body.email_id+"' WHERE users.user_id="+req.body.user_id+" and users_password.user_id="+req.body.user_id;
	
	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			res.json({
				status: 200,
				message: "User updated successfully."
			});
		}
	})
})

app.get('/getUsers/:type',function(req,res){
	let sql;
	if(req.params.type == 'all'){
		sql = "SELECT users.user_id, users.user_first_name, users.user_last_name, users.user_created_date,users.status, roles.role_name FROM users INNER JOIN roles ON users.role_id = roles.role_id";
	}else{
		sql = "SELECT * from users WHERE users.user_id = " + req.params.type;
	}	

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
				message: "List fetched successfully.",
			});						
		}
	});
})

app.post('/getProfile',function(req,res){
	let sql = "SELECT * from users INNER JOIN usersdetails ON users.user_id = usersdetails.user_id INNER JOIN roles ON users.role_id = roles.role_id WHERE users.user_id = '"+req.body.id+"'";

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
				message: "User Detail fetched successfully.",
			});						
		}
	});
})

app.post('/registerUserForEvent',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "INSERT INTO contact (salutation, contact_first_name, contact_last_name, contact_email_id, contact_number, contact_state, contact_city, contact_referrer, contact_address, event_id, created_date) VALUES ('"+req.body.contact_sal+"','"+req.body.contact_first_name+"','"+req.body.contact_last_name+"','"+req.body.contact_email_id+"','"+req.body.contact_number+"','"+req.body.contact_state+"','"+req.body.contact_city+"','"+req.body.contact_referrer+"','"+req.body.contact_address+"','"+req.body.event_id+"','"+reqdte+"')";
	
	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			let sql = "SELECT event_name, event_start_date, venue_name FROM events";
			db.query(sql, function(err, data, fields) {
				if(err){
					res.json({
						status: null,
						message: err
				   	});
				}else{
					var dte = new Date(data[0].event_start_date);
					var evt_date = dte.getDate()+'/'+(dte.getMonth()+1)+'/'+dte.getFullYear();
					let evt_time = dte.getHours()+':'+dte.getMinutes();

					let param = {
						"event_name" : data[0].event_name,
						"event_start_date" : evt_date,
						"event_start_time": evt_time,
						"venue_name": data[0].venue_name
					}
					var description = registration_email.event_register(param);

				   	var mailOptions={
				        to: req.body.contact_email_id,
						subject: 'Webinar Registration Details',
						html: description
				    }

				    mailerdetails.sendMail(mailOptions, function(error, response){
					    if(error){
					        res.end("error");
					    }else{
					        res.json({
								status: 200,
								message: "User successfully registered for the event.",
								data: ''
							});
					    }
					});
				}
			})		
		}
	});				
})

app.post('/updateProfile',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "UPDATE users SET user_first_name = '"+req.body.profile_first_name+"', user_last_name = '"+req.body.profile_last_name+"', user_email_id = '"+req.body.profile_email_id+"', user_contact_number = '"+req.body.profile_contact_number+"' WHERE user_id="+req.body.user_id;
	
	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			let sql = "UPDATE usersdetails SET user_address = '"+req.body.profile_address+"', user_city = '"+req.body.profile_city+"', user_pincode = '"+req.body.profile_pincode+"', user_state = '"+req.body.profile_state+"' WHERE user_id="+req.body.user_id;

			db.query(sql, function(err, data, fields) {
				if(err){
					res.json({
						status: null,
						message: err
				   	});
				}else{
					res.json({
						status: 200,
						message: "User registered successfully."
					});
				}
			});
		}
	});				
})

app.get('/getContact/:email',function(req,res){
	let sql = "SELECT contact_id FROM contact WHERE contact_email_id = '"+req.params.email+"'";
	
	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			res.json({
				status: 200,
				message: "User successfully registered for the event.",
				data: data
			});
		}
	});				
})

app.post('/addToContactEvent',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "INSERT INTO contact_event (contact_id, event_id, created_date) VALUES ('"+req.body.contact_id+"','"+req.body.event_id+"','"+reqdte+"')";
	
	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			res.json({
				status: 200,
				message: "You have successfully registered yourself for the event."
			});
		}
	})
})

app.post('/addAttendance',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "INSERT INTO attendance (user_id, sns_name, meeting_date, no_of_people_attended, no_of_new_people_attended, created_date) VALUES ('"+req.body.user_id+"','"+req.body.sns_name+"','"+req.body.meeting_date+"','"+req.body.people_attended+"','"+req.body.new_people_attended+"','"+reqdte+"')";
	
	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			res.json({
				status: 200,
				message: "Added meeting details successfully."
			});
		}
	})
})

app.post('/sendUserLink',function(req,res){
	let param = {
		"redirectlink" : constant.redirectlink,
		"url" : req.body.url
	}
	var description = registration_email.mentee_register(param);

   	var mailOptions={
        to: req.body.email,
		subject: 'Register Yourself as a Mentee at SingAndShare',
		html: description
    }

    mailerdetails.sendMail(mailOptions, function(error, response){
	    if(error){
	        res.end("error");
	    }else{
	        res.end("Email Sent");
	    }
	});
})

app.post('/checkUser',function(req,res){
	let sql = "SELECT * from contact WHERE contact_email_id = '"+req.body.email+"'";
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

app.post('/addBlogImg',blogupload.single('image'),function(req,res){		
	res.json({
		status: 200,
		message: "Blog Image Added successfully.",
		filepath: photopath
	});
})


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

app.post('/addRole',function(req,res){
	//let accessToken = req.cookies.jwt;
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	req.body.created_by_user_id=1;
	req.body.modified_user_id=1;

	let sql = "INSERT INTO roles (role_name, created_by_user_id, created_date, modified_user_id, modified_user_date) VALUES ('"+req.body.role_name+"','"+req.body.created_by_user_id+"','"+reqdte+"','"+req.body.modified_user_id+"','"+reqdte+"')";

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Role Added successfully."
			});						
		}
	});
})

app.get('/getRole',function(req,res){ //,authorize("customer:read")
	let sql = "SELECT role_id, role_name FROM roles";

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
				message: "Role Fetched successfully."
			});						
		}
	});
})

app.get('/getEvents', function(req,res){ //
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

app.get('/getAllEvents', function(req,res){ //
	let sql = "SELECT * , event_status.event_status, event_type.EventType FROM events INNER JOIN event_status ON events.event_status_id = event_status.event_status_id INNER JOIN event_type ON events.event_type_id = event_type.EventTypeID";

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

app.post('/addBlog',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "INSERT INTO blogs (title, category, description, created_by_user_id, created_date,status) VALUES ('"+req.body.title+"','"+req.body.category+"','"+req.body.description+"','"+req.body.created_by_user_id+"','"+reqdte+"','Enable')";

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Blog Added successfully."
			});						
		}
	});
})

app.get('/getBlogs/:listtype/:cnt',function(req,res){
	let sql = '';
	if(req.params.listtype == 'multiple'){
		(req.params.cnt == 'all') ? sql = "SELECT * FROM blogs" : sql = "SELECT * FROM blogs LIMIT 3";
	}else{
		sql = "SELECT * FROM blogs WHERE blog_id ="+req.params.cnt;
	}
	
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
				message: "Blog fetched successfully."
			});						
		}
	});
})

app.post('/updateBlog',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "UPDATE blogs SET title = '"+req.body.title+"', category = '"+req.body.category+"', description = '"+req.body.description+"', modified_by = '"+req.body.modified_by_user_id+"', modified_on = '"+reqdte+"' WHERE blog_id="+req.body.blog_id;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Blog Added successfully."
			});						
		}
	});
})

app.post('/disableBlog',function(req,res) {
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "UPDATE blogs SET status = 'Disable', modified_by = '"+req.body.modified_by_user_id+"', modified_on = '"+reqdte+"' WHERE blog_id="+req.body.blog_id;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Blog Disabled successfully."
			});						
		}
	});
})

app.post('/addBranch',function(req,res) {
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "INSERT INTO srs_branch (srs_name, user_id, created_by, created_on, status) VALUES ('"+req.body.srs_name+"','"+req.body.user_id+"','"+req.body.created_by+"','"+reqdte+"','Enable')";

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "A new Branch has been created successfully."
			});						
		}
	});
})

app.post('/editBranch',function(req,res) {
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "UPDATE srs_branch SET srs_name = '"+req.body.srs_name+"', user_id = '"+req.body.user_id+"', modified_by = '"+req.body.modified_by+"', modified_on = '"+reqdte+"' WHERE srs_id="+req.body.srs_id;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Branch Updated successfully."
			});						
		}
	});
})

app.get('/getBranches/:type',function(req,res){
	let sql = '';
	if(req.params.type == 'all'){
		sql = "SELECT srs_branch.srs_id, srs_branch.srs_name, srs_branch.created_on,srs_branch.status , users.user_first_name, users.user_last_name FROM srs_branch INNER JOIN users ON users.user_id = srs_branch.user_id";
	}else{
		sql = "SELECT * from srs_branch";
	}
	
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

app.get('/getCaptain',function(req,res){
	let sql = "SELECT users.user_id, users.user_first_name, users.user_last_name FROM users INNER JOIN roles ON users.role_id = roles.role_id WHERE roles.role_name = 'captain'";
	
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

app.post('/changeBranchStatus',function(req,res) {
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "UPDATE srs_branch SET status = '"+req.body.status+"', modified_by = '"+req.body.modified_by+"', modified_on = '"+reqdte+"' WHERE srs_id="+req.body.srs_id;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Branch "+req.body.status+"d successfully."
			});						
		}
	});
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`));