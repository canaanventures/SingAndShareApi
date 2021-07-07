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
const get_password = require('./email_templates/password');

//app.set("views",path.join(__dirname,"views"));
//app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json()); 
app.set('view engine', 'ejs');
app.use(express.static('public'));
//app.use('./uploads',express.static('public'));

//const DIR = './uploads/events';

var photopath = '', galleryphotopath=[], lessondocpath=[];
var usertableresp = '';

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  	next();
});
 
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './uploads/events');
    },
    filename: (req, file, cb) => {
	    photopath = '/uploads/events/event_' + req.params.dte +'_'+ req.params.event_name + path.extname(file.originalname);
	    cb(null, 'event_' + req.params.dte +'_'+ req.params.event_name + path.extname(file.originalname));
    }
});
var upload = multer({storage: storage});


var blogstorage = multer.diskStorage({
    destination: (req, file, cb) => {
      	cb(null, './uploads/blogs');
    },
    filename: (req, file, cb) => {
	    var dte = new Date();
		var a = dte.getDate()+'_'+(dte.getMonth()+1)+'_'+dte.getFullYear()+'_'+dte.getHours()+'_'+dte.getMinutes()+'_'+dte.getSeconds();

		photopath = '/uploads/blogs/blog_'+req.params.title+'_'+req.params.cat+'_'+a+path.extname(file.originalname);
		cb(null, 'blog_'+req.params.title+'_'+req.params.cat+'_'+a+path.extname(file.originalname));
    }
});
var blogupload = multer({storage: blogstorage});

var userstorage = multer.diskStorage({
    destination: (req, file, cb) => {
      	cb(null, './uploads/profile');
    },
    filename: (req, file, cb) => {
	    photopath = '/uploads/profile/user_'+req.params.user_id+path.extname(file.originalname);
		cb(null, 'user_'+req.params.user_id+path.extname(file.originalname));
    }
});
var userupload = multer({storage: userstorage}); 

var lmscatstorage = multer.diskStorage({
    destination: (req, file, cb) => {
      	cb(null, './uploads/lms/category');
    },
    filename: (req, file, cb) => {
	    photopath = '/uploads/lms/category/cat_'+req.params.cat_name+path.extname(file.originalname);
		cb(null, 'cat_'+req.params.cat_name+path.extname(file.originalname));
    }
});
var lmscatupload = multer({storage: lmscatstorage});

var lmscorstorage = multer.diskStorage({
    destination: (req, file, cb) => {
      	cb(null, './uploads/lms/course');
    },
    filename: (req, file, cb) => {
	    photopath = '/uploads/lms/course/cor_'+req.params.course_name+path.extname(file.originalname);
		cb(null, 'cor_'+req.params.course_name+path.extname(file.originalname));
    }
});
var lmscourseupload = multer({storage: lmscorstorage});

var lmslesstorage = multer.diskStorage({
    destination: (req, file, cb) => {
      	cb(null, './uploads/lms/lesson');
    },
    filename: (req, file, cb) => {
	    photopath = '/uploads/lms/lesson/lesson_'+req.params.lesson_name+path.extname(file.originalname);
		cb(null, 'lesson_'+req.params.lesson_name+path.extname(file.originalname));
    }
});
var lmslessonupload = multer({storage: lmslesstorage});

var lmsclassstorage = multer.diskStorage({
    destination: (req, file, cb) => {
      	cb(null, './uploads/lms/class');
    },
    filename: (req, file, cb) => {
	    photopath = '/uploads/lms/class/class_'+req.params.class_name+'_'+req.params.cnt+path.extname(file.originalname);
		cb(null, 'lesson_'+req.params.class_name+'_'+req.params.cnt+path.extname(file.originalname));
    }
});
var lmsclassupload = multer({storage: lmsclassstorage});

var gallerystorage = multer.diskStorage({
    destination: (req, file, cb) => {
      	cb(null, './uploads/events/gallery');
    },
    filename: (req, file, cb) => {
	    galleryphotopath.push('/uploads/events/gallery/event_'+req.params.id+'_'+file.originalname);
		cb(null, 'event_'+req.params.id+'_'+file.originalname);
    }
});
var galleryupload = multer({storage: gallerystorage});

var lessonstorage = multer.diskStorage({
    destination: (req, file, cb) => {
      	cb(null, './uploads/lms/lesson');
    },
    filename: (req, file, cb) => {
	    lessondocpath.push('/uploads/lms/lesson/lesson_'+req.params.id+'_'+file.originalname);
		cb(null, 'lesson_'+req.params.id+'_'+file.originalname);
    }
});
var lessonupload = multer({storage: lessonstorage});

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
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
 	auth: {
        user: constant.info_email,
        pass: constant.info_password
    },
	tls: {
	    rejectUnauthorized: false
	}
});

app.post('/login',function(req,res){
	let sql = "SELECT status from users where user_email_id ='"+req.body.email+"'";
	db.query(sql, function(err, data, fields) {
		if(data.length > 0){
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
								if(data.length > 0){
									let query = "SELECT user_password from users_password WHERE user_email_id = '"+req.body.email+"'";
									connection.query(query, function(err, data, fields) {
										if(err){
											res.json({
												status: null,
												message: err
										   	});
										}else{
											if(data[0].user_password == req.body.pass_word){				let query = "SELECT * from users a INNER JOIN roles b ON a.role_id = b.role_id WHERE user_email_id = '"+req.body.email+"'";
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
															srs_id : data[0].srs_id,
															role_id : data[0].role_id,
															role_name : data[0].role_name,
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
								}else{
									res.json({
										status: 201,
										message: "Email ID does not exist"
									});
								}								
							}
						})
						connection.release();
					}
				});
			}
		}else{
			res.json({
				status: 201,
				message: "Email ID does not exist"
			});
		}
	});
})

app.post('/register',function(req,res){
	let sql = "SELECT * FROM users WHERE user_email_id = '"+req.body.user_email_id+"'";
	db.query(sql, function(err, data, fields) {
		if(data.length == 0){
			var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
			month < 10 ? mon = "0"+month : mon = month;
			dte < 10 ? dt = "0"+dte : dt = dte;
			var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

			let sql = "INSERT INTO users (user_first_name, user_last_name, user_email_id, user_created_date, role_id, mentor_email_id, user_contact_number,status,parent_id, srs_id) VALUES ('"+req.body.user_first_name+"','"+req.body.user_last_name+"','"+req.body.user_email_id+"','"+reqdte+"','"+req.body.role_id+"','"+req.body.mentor_email_id+"','"+req.body.user_contact_number+"','"+req.body.status+"','"+req.body.parent_id+"','"+req.body.srs_id+"')";

			db.query(sql, function(err, data, fields) {
				if(err){
					res.json({
						status: null,
						message: err
				   	});
				}else{
					let user_id = data.insertId;
					let sql = "INSERT INTO user_access (user_id, sns_access, user_access, event_access, attendance_access, calendar_add_access, calendar_access, blog_access, blog_approve_access, blog_change_status_access) VALUES ('"+user_id+"','0','0','0','0','0','0','0','0','0')";
					db.query(sql, function(err, data, fields) {

						let sql = "INSERT INTO users_password (user_password,user_email_id,user_id) VALUES ('"+req.body.user_password+"','"+req.body.user_email_id+"','"+user_id+"')";
						db.query(sql, function(err, data, fields) {

							if(err){
								res.json({
									status: null,
									message: err
							   	});
							}else{
								let sql = "INSERT INTO usersdetails (user_id, user_address, user_pincode, user_city, user_state) VALUES ('"+user_id+"','',0,'','')";
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
									}
								})
							}
						});
					})
				}
			});
		}else{
			res.json({
				status: 201,
				message: "Email ID already exist"
			});
		}
	})
})

app.post('/changeUserStatus',function(req,res) {
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql;
	if(req.body.statusEnableDesc){
		sql = "UPDATE users SET status = '"+req.body.status+"', user_activation_reason = '"+req.body.statusEnableDesc+"', modified_by_user_id = '"+req.body.modified_by_user_id+"', modified_on = '"+reqdte+"' WHERE user_id="+req.body.userid;
	}else{
		sql = "UPDATE users SET status = '"+req.body.status+"', user_deactivation_reason = '"+req.body.statusDisableDesc+"', modified_by_user_id = '"+req.body.modified_by_user_id+"', modified_on = '"+reqdte+"' WHERE user_id="+req.body.userid;
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

	var srs = '';
	(req.body.srs_id == '') ? srs = null : srs = req.body.srs_id;
	let sql = "UPDATE users , users_password SET users.user_first_name = '"+req.body.user_first_name+"', users.user_last_name = '"+req.body.user_last_name+"', users.user_email_id = '"+req.body.user_email_id+"', users.role_id = '"+req.body.role_id+"', users.mentor_email_id = '"+req.body.mentor_email_id+"', users.modified_by_user_id = '"+req.body.modified_by+"', users.srs_id = "+srs+", users.modified_on = '"+reqdte+"', users_password.user_email_id = '"+req.body.user_email_id+"' WHERE users.user_id="+req.body.user_id+" and users_password.user_id="+req.body.user_id;
	
	db.query(sql, function(err, data, fields) {
		if(req.body.mentor_email_id == ''){
			let sql = "UPDATE users SET parent_id = '0' WHERE user_email_id ='"+req.body.user_email_id+"'";
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
			});
		}else{
			let sql = "SELECT user_id FROM users WHERE user_email_id ='"+req.body.mentor_email_id+"'";
			db.query(sql, function(err, data, fields) {
				if(data.length > 0){

					let sql = "UPDATE users SET parent_id = '"+data[0].user_id+"' WHERE user_email_id ='"+req.body.user_email_id+"'";
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
					});
				}else{
					res.json({
						status: 200,
						message: "User updated successfully."
					});
				}
			});
		}
	})
})

app.get('/getUsers/:type',function(req,res){
	let sql;
	if(req.params.type == 'all'){
		//sql = "SELECT users.user_id, users.user_first_name, users.user_last_name, users.user_created_date,users.status, roles.role_name FROM users INNER JOIN roles ON users.role_id = roles.role_id";
		sql = "SELECT a.user_id, a.user_first_name, a.user_last_name, a.user_created_date,a.status, b.role_name, c.srs_name, CONCAT(d.user_first_name, ' ', d.user_last_name) AS mentor_name FROM users a INNER JOIN roles b ON a.role_id = b.role_id LEFT JOIN srs_branch c ON a.srs_id = c.srs_id LEFT JOIN users d ON d.user_id = a.parent_id";
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

app.get('/attendanceUsers/:type',function(req,res){
	let sql = "SELECT user_id, user_first_name, user_last_name, user_email_id from users WHERE status = 'Enable' and srs_id = " + req.params.type;

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
			res.json({
				status: 200,
				message: "New User registered for the event."
			});
		}
	});				
})

app.post('/updateProfile',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();
	let sql;

	if(req.body.image_url == ''){
		sql = "UPDATE users SET user_first_name = '"+req.body.user_first_name+"', user_last_name = '"+req.body.user_last_name+"', user_email_id = '"+req.body.user_email_id+"', user_contact_number = '"+req.body.user_contact_number+"' WHERE user_id="+req.body.user_id;
	}else{
		sql = "UPDATE users SET user_first_name = '"+req.body.user_first_name+"', user_last_name = '"+req.body.user_last_name+"', user_email_id = '"+req.body.user_email_id+"', user_contact_number = '"+req.body.user_contact_number+"', image_url = '"+req.body.image_url+"' WHERE user_id="+req.body.user_id;
	}
	
	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			let sql = "UPDATE usersdetails SET user_address = '"+req.body.user_address+"', user_city = '"+req.body.user_city+"', user_pincode = '"+req.body.user_pincode+"', user_state = '"+req.body.user_state+"' WHERE user_id="+req.body.user_id;

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
			let sql = "SELECT event_name, event_start_date, venue_name, connection_link FROM events WHERE event_id = " + req.body.event_id;
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
						"venue_name": data[0].venue_name,
						"connection_link": data[0].connection_link
					}
					var description;
					if(data[0].connection_link){
						description = registration_email.event_register_link(param);
					}else{
						description = registration_email.event_register(param);
					}					

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
								message: "User successfully registered for the event."
							});
					    }
					});
				}
			})
		}
	})
})

app.post('/addAttendance',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "INSERT INTO meetingattendance (srs_id, meeting_date, total_members, new_attendees, presentees, absentees, created_by, created_on, topic_name, speaker_name) VALUES ('"+req.body.srs_id+"','"+req.body.meeting_date+"','"+req.body.total_members+"','"+req.body.new_attendees+"','"+req.body.presentees+"','"+req.body.absentees+"','"+req.body.created_by+"','"+reqdte+"','"+req.body.topic_name+"','"+req.body.speaker_name+"')";
	
	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			res.json({
				status: 200,
				message: "Added meeting details successfully.",
				rowid: data.insertId
			});
		}
	})
})

app.post('/addAttendees',function(req,res){
	let sql = "INSERT INTO attendees (user_id, user_first_name, user_last_name, user_email_id, attendance_status, meeting_id) VALUES?";

	db.query(sql, [req.body.vals], function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				data: data,
				message: "Meeting Details added successfully."
			});						
		}
	});
})

app.post('/sendUserLink',function(req,res){
	let sql = "SELECT * from users WHERE user_email_id = '"+req.body.email+"'";
	db.query(sql, function(err, data, fields) {
		if(data.length == 0){
			let param = {
				redirectlink : constant.redirectlink,
				url : req.body.url
			}
			var description = registration_email.mentee_register(param);

		   	var mailOptions={
		        to: req.body.email,
		        cc: 'abraham@vecan.co, rbnjathanna@gmail.com',
				subject: 'Register Yourself as a Mentee at SingAndShare',
				html: description
		    }

		    mailerdetails.sendMail(mailOptions, function(error, response){
			    if(error){
			        res.json({
			        	status:201,
			        	message:error,
			        	data:response
			        });
			    }else{
			        res.json({
						status: 200,
						message: "Email is sent to the mentioned Email Address."
				   	});
			    }
			});
		}else{
			res.json({
				status:201,
				message: "Email ID already exists."
			})
		}
	})
})

app.post('/checkUser',function(req,res){
	let sql = "SELECT * from users WHERE user_email_id = '"+req.body.email+"'";
	db.query(sql, function(err, data1, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			let sql = "SELECT * from contact WHERE contact_email_id = '"+req.body.email+"'";
			db.query(sql, function(err, data, fields) {
				if(err){
					res.json({
						status: null,
						message: err
				   	});
				}else{
					if(data.length == 0){
						if(data1.length == 0){
							res.json({
								status: 201,
								email: req.body.email,
								message: "User Does not exist"
						   	});
						}else{
							var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
							month < 10 ? mon = "0"+month : mon = month;
							dte < 10 ? dt = "0"+dte : dt = dte;
							var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

							let sql = "INSERT INTO contact (user_id, contact_email_id, event_id, created_date) VALUES ('"+data1[0].user_id+"','"+req.body.email+"','"+req.body.event_id+"','"+reqdte+"')";
							
							db.query(sql, function(err, data, fields) {
								if(err){
									res.json({
										status: null,
										message: err
								   	});
								}else{
									res.json({
										status: 200,
										message: "New User registered for the event."
									});
								}
							});	
						}
					}else{
						res.json({
							status: 200,
							email: req.body.email,
							message: "User exists"
					   	});
					}
				}
			})
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

app.post('/addBlogImg/:title/:cat',blogupload.single('image'),function(req,res){	
	res.json({
		status: 200,
		message: "Blog Image Added successfully.",
		filepath: photopath
	});
})

app.post('/addUserImg/:user_id/',userupload.single('image'),function(req,res){	
	res.json({
		status: 200,
		message: "User Image Updated successfully.",
		filepath: photopath
	});
})

app.post('/addEventImg/:dte/:event_name',upload.single('image'),function(req,res){		
	res.json({
		status: 200,
		message: "Event Banner Added successfully.",
		filepath: photopath
	});
})

app.post('/addGalleryImg/:id',galleryupload.array('image',10),function(req,res){    
	let b=[];
	for(var i=0;i<galleryphotopath.length;i++){
		let newArray = [];
		newArray.push(req.params.id);
		newArray.push(galleryphotopath[i]);		
		newArray.push("N");
		b.push(newArray);
    }
	let sql = "INSERT INTO gallery (event_id, image_url, main_img) VALUES ?";
	db.query(sql, [b], function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			galleryphotopath = [];
			res.json({
				status: 200,
				message: "Images for this events added successfully."
			});
		}
	})
})

app.get('/deleteGalleryImg/:id',function(req,res){    
	let sql = "SELECT image_url FROM gallery WHERE event_id = " + req.params.id;
	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			var setObj = new Set(); // create key value pair from array of array
			var result = data.reduce((acc,item)=>{
			  	if(!setObj.has(item.image_url)){
				    setObj.add(item.image_url,item)
				    acc.push(item)
			  	}
			  return acc;
			},[]);
			for(var i=0;i<result.length;i++){
				if(data.length > 0){
					const pathToFile = __dirname + data[i].image_url;
					fs.unlinkSync(pathToFile);
				}				
				/* fs.unlinkSync(pathToFile, function(err) {
					if (err) {
						throw err
					} else {
						console.log("Successfully deleted the file.")
					}
				}) */
			}
			let sql = "DELETE FROM gallery WHERE event_id = " + req.params.id;
			db.query(sql, function(err, data, fields) {
				if(err){
					res.json({
						status: null,
						message: err
				   	});
				}else{
					res.json({
						status: 200,
						message: "Gallery images deleted successfully."
				   	});
				}
			})
		}
	})
})

app.post('/addGalleryMainImg/:id',galleryupload.single('image'),function(req,res){    
	let sql = "INSERT INTO gallery (event_id, image_url, main_img) VALUES ('"+req.params.id+"','"+galleryphotopath[0]+"','Y')";
	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{	
			res.json({
				status: 200,
				message: "Main Image for this events added successfully."
			});
		}
	})
})

app.post('/addEvent',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "INSERT INTO events (event_name, event_start_date, event_end_date, cost_per_person, description, created_by_user_id, created_date, venue_name, event_type_id, poster_url, status, connection_link) VALUES ('"+req.body.event_name+"','"+req.body.event_start_date+"','"+req.body.event_end_date+"','"+req.body.cost_per_person+"','"+req.body.description+"','"+req.body.created_by_user_id+"','"+reqdte+"','"+req.body.venue_name+"','"+req.body.event_type_id+"','"+req.body.imgurl+"','Enable','"+req.body.connection_link+"')";

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

app.post('/addCalendar',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "INSERT INTO calendar (event_name, event_start_date, event_end_date,  description, created_by, created_on, venue_name, connection_link) VALUES ('"+req.body.event_name+"','"+req.body.event_start_date+"','"+req.body.event_end_date+"','"+req.body.description+"','"+req.body.created_by_user_id+"','"+reqdte+"','"+req.body.venue_name+"','"+req.body.connection_link+"')";

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

app.get('/getCalendar/:type', function(req,res){
	let sql = '';
	if(req.params.type == 'all'){
		sql ="SELECT * from calendar";
	}else{
		sql ="SELECT * FROM calendar where calendar_id = " + req.params.type;
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
				message: "Event fetched successfully."
			});						
		}
	});
})

app.post('/editEvent',function(req,res) {
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "UPDATE events SET event_name = '"+req.body.event_name+"', event_start_date = '"+req.body.event_start_date+"', event_end_date = '"+req.body.event_end_date+"', cost_per_person = '"+req.body.cost_per_person+"', description = '"+req.body.description+"', modified_user_id = '"+req.body.modified_user_id+"', modified_user_date = '"+reqdte+"', venue_name = '"+req.body.venue_name+"', event_type_id = '"+req.body.event_type_id+"', poster_url = '"+req.body.imgurl+"', connection_link = '"+req.body.connection_link+"' WHERE event_id="+req.body.event_id;

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

app.post('/changeEventStatus',function(req,res) {
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "UPDATE events SET status = '"+req.body.status+"', modified_user_id = '"+req.body.modified_user_id+"', modified_user_date = '"+reqdte+"' WHERE event_id="+req.body.event_id;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Event "+req.body.status+"d successfully."
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

app.get('/pastEvents',function(req,res){
	let sql ="SELECT * , b.EventType FROM events a INNER JOIN event_type b ON a.event_type_id = b.EventTypeID WHERE a.event_end_date < NOW()";
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
				message: "Event fetched successfully."
			});						
		}
	});
})


app.get('/getEvents/:type', function(req,res){
	let sql = '';
	if(req.params.type == 'home'){
		//sql ="SELECT e.event_id, poster_url from events as e inner join event_status as es on e.event_status_id = es.event_status_id where es.event_status in('On Going','Upcoming')";

		sql ="SELECT * from events where status = 'Enable'";
	}else if(req.params.type == 'all'){
		sql ="SELECT * , b.EventType FROM events a INNER JOIN event_type b ON a.event_type_id = b.EventTypeID WHERE a.event_end_date > NOW() ORDER BY a.created_date DESC";
	}else{
		sql ="SELECT * , event_type.EventType FROM events INNER JOIN event_type ON events.event_type_id = event_type.EventTypeID where event_id = " + req.params.type;
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
				message: "Event fetched successfully."
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

	let sql = "INSERT INTO event_type (EventType, CreatedByUserID, CreatedDate) VALUES ('"+req.body.event_type+"','"+req.body.created_by_user_id+"','"+reqdte+"')";

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

app.get('/getBlogImg/:id', function(req, res){
	let sql = "SELECT image_url from blogs WHERE blog_id = "+req.params.id;
	db.query(sql, function(err, data, fields) {
		if(data.length > 0){
			const file = data[0].image_url;
			if(file){
				res.sendFile(__dirname + file);
			}else{
				res.sendFile(__dirname + '/uploads/not-found/no-img-found-medium.png');
			}
		}else{
			res.sendFile(__dirname + '/uploads/not-found/no-img-found-medium.png');
		}
	});
});

app.get('/getUserImg/:id', function(req, res){
	let sql = "SELECT image_url from users WHERE user_id = "+req.params.id;
	db.query(sql, function(err, data, fields) {
		if(data.length > 0){
			const file = data[0].image_url;
			if(file){
				res.sendFile(__dirname + file);
			}else{
				res.sendFile(__dirname + '/uploads/not-found/no-img-found-small.png');
			}
		}else{
			res.sendFile(__dirname + '/uploads/not-found/no-img-found-small.png');
		}
	});
});

app.get('/getEventImg/:id', function(req, res){
	let sql = "SELECT poster_url FROM events WHERE event_id = "+req.params.id;
	db.query(sql, function(err, data, fields) {
		//console.log(data)
		if(data.length > 0){
			const file = data[0].poster_url;
		//	console.log(file)    
			if(file){
				
				res.sendFile(__dirname + file);

			}else{
				res.sendFile(__dirname + '/uploads/not-found/no-img-found-medium.png');
			}
		}else{
			res.sendFile(__dirname + '/uploads/not-found/no-img-found-medium.png');
		}
	});
});

app.post('/getBlogMultiImg', function(req, res){
	let data = req.body; let imgArr = [];
	for(var i=0;i<data.length;i++){
		if(data.length > 0){
			if(data[i].image_url){
				let buff = fs.readFileSync(__dirname+data[i].image_url);
				let base64data = buff.toString('base64');
				imgArr.push({
					'id': data[i].blog_id,
					'src': base64data
				});
			}
		}
	}
	res.json({
		status: 200,
		data: imgArr,
		message: "List fetched successfully."
	});
});

app.get('/getGalleryImg/:type', function(req, res){
	let sql; 
	if(req.params.type == 'home'){
		sql = "SELECT gallery_id, event_id, image_url FROM gallery WHERE main_img = 'Y' LIMIT 5";
	}else if(req.params.type == 'all'){
		sql = "SELECT a.gallery_id, a.event_id, a.image_url, b.event_name, b.description, b.event_start_date FROM gallery a INNER JOIN events b ON a.event_id = b.event_id WHERE a.main_img = 'Y'";
	}else{
		sql = "SELECT * FROM gallery a INNER JOIN events b ON a.event_id = b.event_id WHERE a.event_id = " + req.params.type;
	}
	db.query(sql, function(err, data, fields) {
		let imgArr = [];
		for(var i=0;i<data.length;i++){
			if(data.length > 0){
				if(data[i].image_url){
					let buff = fs.readFileSync(__dirname+data[i].image_url);
					let base64data = buff.toString('base64');				
					data[i].image_url = 'data:image/jpeg;base64,' + base64data;
					imgArr.push(data[i]);
				}
			}
		}
		res.json({
			status: 200,
			data: imgArr,
			message: "List fetched successfully."
		});			
	});
});

app.get('/getMultiEventImg', function(req, res){
	let sql = "SELECT event_id, poster_url FROM events WHERE events.event_end_date > NOW() LIMIT 5";
	db.query(sql, function(err, data, fields) {
		let imgArr = [];
		for(var i=0;i<data.length;i++){
			if(data.length > 0){
				if(data[i].poster_url){
					let buff = fs.readFileSync(__dirname+data[i].poster_url);
					let base64data = buff.toString('base64');				
					data[i].image_url = 'data:image/jpeg;base64,' + base64data;
					imgArr.push(data[i]);
				}
			}
		}
		res.json({
			status: 200,
			data: imgArr,
			message: "List fetched successfully."
		});			
	});
});

app.get('/getMultiBlogImg', function(req, res){
	let sql = "SELECT * FROM blogs b INNER JOIN blog_category c WHERE b.category = c.category_id AND b.approval_status = 'Y' AND b.status = 'Enable' ORDER BY b.modified_on DESC LIMIT 5";
	db.query(sql, function(err, data, fields) {
		let imgArr = [];
		for(var i=0;i<data.length;i++){
			if(data.length > 0){
				if(data[i].image_url){
					let buff = fs.readFileSync(__dirname+data[i].image_url);
					let base64data = buff.toString('base64');				
					data[i].image_url = 'data:image/jpeg;base64,' + base64data;
					imgArr.push(data[i]);
				}
			}
		}
		res.json({
			status: 200,
			data: imgArr,
			message: "List fetched successfully."
		});			
	});
});

app.post('/addBlog',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "INSERT INTO blogs (title, category, description, created_by_user_id, created_date,status,approval_status,image_url) VALUES ('"+req.body.title+"','"+req.body.category+"','"+req.body.description+"','"+req.body.created_by_user_id+"','"+reqdte+"','Enable','N','"+req.body.imgurl+"')";

	//let sql = "INSERT INTO blogs (title, category, description, created_by_user_id, created_date,status,approval_status) VALUES ('"+req.body.title+"','"+req.body.category+"','"+req.body.description+"','"+req.body.created_by_user_id+"','"+reqdte+"','Enable','N')";
 
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
		(req.params.cnt == 'all') ? sql = "SELECT *, b.status AS blog_status FROM blogs b INNER JOIN blog_category c WHERE b.category = c.category_id" : sql = "SELECT * FROM blogs b INNER JOIN blog_category c WHERE b.category = c.category_id AND b.approval_status = 'Y' AND b.status = 'Enable' ORDER BY b.modified_on DESC LIMIT 5";
	}else{
		sql = "SELECT * FROM blogs b INNER JOIN blog_category c ON b.category = c.category_id LEFT JOIN users u ON b.created_by_user_id = u.user_id WHERE blog_id = "+req.params.cnt;
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


app.get('/getPaginatedBlogs/:cnt',function(req,res){
	const limit = 10, page = req.params.cnt, offset = (page - 1) * limit;
	let sql = "SELECT *, b.status AS blog_status FROM blogs b INNER JOIN blog_category c WHERE b.category = c.category_id ORDER BY b.created_date DESC limit "+limit+" OFFSET "+offset;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			let resp1 = data;
			let sql = "SELECT COUNT(*) AS total from blogs";
			db.query(sql, function(err, data, fields) {
				if(err){
					res.json({
						status: null,
						message: err
				   	});
				}else{
					res.json({
						status: 200,
						data: {
							data : resp1,
							total : data 
						},
						message: "Lists fetched successfully."
					});
				}
			})						
		}
	});
})

app.get('/getApprovedBlogs',function(req,res){
	let sql = "SELECT * FROM blogs b INNER JOIN blog_category c ON b.category = c.category_id WHERE approval_status = 'Y' AND b.status = 'Enable'";
	
	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			let imgArr = [];
			for(var i=0;i<data.length;i++){
				if(data.length > 0){
					if(data[i].image_url){
						let buff = fs.readFileSync(__dirname+data[i].image_url);
						let base64data = buff.toString('base64');				
						data[i].image_url = 'data:image/jpeg;base64,' + base64data;
						imgArr.push(data[i]);
					}
				}
			}
			res.json({
				status: 200,
				data: imgArr,
				message: "Blog list fetched successfully."
			});					
		}
	});
})

app.post('/updateBlog',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql;
	if(req.body.approval_status){
		if(req.body.imgurl == ''){
			sql = "UPDATE blogs SET title = '"+req.body.title+"', category = '"+req.body.category+"', description = '"+req.body.description+"', modified_by = '"+req.body.modified_by_user_id+"', modified_on = '"+reqdte+"', approval_status = '"+req.body.approval_status+"' WHERE blog_id="+req.body.blog_id;
		}else{
			sql = "UPDATE blogs SET title = '"+req.body.title+"', category = '"+req.body.category+"', description = '"+req.body.description+"', modified_by = '"+req.body.modified_by_user_id+"', modified_on = '"+reqdte+"', approval_status = '"+req.body.approval_status+"', image_url ='"+req.body.imgurl+"' WHERE blog_id="+req.body.blog_id;
		}
	}else{
		if(req.body.imgurl == ''){
			sql = "UPDATE blogs SET title = '"+req.body.title+"', category = '"+req.body.category+"', description = '"+req.body.description+"', modified_by = '"+req.body.modified_by_user_id+"', modified_on = '"+reqdte+"' WHERE blog_id="+req.body.blog_id;
		}else{
			sql = "UPDATE blogs SET title = '"+req.body.title+"', category = '"+req.body.category+"', description = '"+req.body.description+"', modified_by = '"+req.body.modified_by_user_id+"', modified_on = '"+reqdte+"', image_url ='"+req.body.imgurl+"' WHERE blog_id="+req.body.blog_id;
		}
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
				message: "Blog Updated successfully."
			});						
		}
	});
})

app.post('/disableBlog',function(req,res) {
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "UPDATE blogs SET status = '"+req.body.status+"', modified_by = '"+req.body.modified_by_user_id+"', modified_on = '"+reqdte+"' WHERE blog_id="+req.body.blog_id;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Blog status changed successfully."
			});						
		}
	});
})

app.post('/addComment',function(req,res) {
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "INSERT INTO comments (blog_id, name, email_id, blog_comment, added_on, approval_status) VALUES ('"+req.body.blog_id+"','"+req.body.name+"','"+req.body.email_id+"','"+req.body.blog_comment+"','"+reqdte+"','D')";

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Blog comment changed successfully."
			});						
		}
	});
})

app.get('/getComments/:type/:cnt',function(req,res){
	let sql = '';
	if(req.params.type == 'disapprove'){
		sql = "SELECT * FROM comments WHERE blog_id = "+req.params.cnt+"";
	}else{
		sql = "SELECT * FROM comments WHERE blog_id = "+req.params.cnt+" AND approval_status='Y'";
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
				message: "Comments fetched successfully."
			});						
		}
	});
})

app.post('/commentStatusChange',function(req,res) {
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "UPDATE comments SET approved_by = '"+req.body.approved_by+"', approval_status = '"+req.body.approval_status+"', approved_on = '"+reqdte+"' WHERE comment_id="+req.body.comment_id;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Status of the comment changed successfully."
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
		sql = "SELECT srs_branch.srs_id, srs_branch.srs_name, srs_branch.created_on,srs_branch.status , users.user_first_name, users.user_last_name FROM srs_branch INNER JOIN users ON users.user_id = srs_branch.user_id ORDER BY created_on DESC";
	}else if(req.params.type == 'adduser'){
		sql = "SELECT srs_id, srs_name FROM srs_branch  WHERE status = 'Enable'";
	}else{
		sql = "SELECT srs_id, srs_name, user_id from srs_branch WHERE srs_id="+req.params.type;
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

app.post('/addBlogCategory',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "INSERT INTO blog_category (category_name, created_by, created_on, status) VALUES ('"+req.body.category_name+"','"+req.body.created_by+"','"+reqdte+"','Enable')";

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Blog Category Added successfully."
			});						
		}
	});
})

app.get('/getBlogCategory',function(req,res){
	let sql = "SELECT * FROM blog_category";

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

app.post('/updateAccess',function(req,res) {
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "UPDATE user_access SET sns_access = '"+req.body.sns_access+"', user_access = '"+req.body.user_access+"', event_access = '"+req.body.event_access+"', attendance_access = '"+req.body.attendance_access+"', calendar_access = '"+req.body.calendar_access+"', calendar_add_access = '"+req.body.calendar_add_access+"', blog_access = '"+req.body.blog_access+"', blog_approve_access = '"+req.body.blog_approve_access+"', blog_change_status_access = '"+req.body.blog_status_access+"' WHERE access_id="+req.body.access_id;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Access assigned successfully."
			});						
		}
	});
})

app.post('/getAccessList',function(req,res){
	let sql = "SELECT * FROM user_access WHERE user_id = "+req.body.user_id;

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

app.post('/getReports',function(req,res){
	let sql;

	if(req.body.type == 'attendance'){
		sql = "SELECT * from meetingattendance where month(meeting_date)="+req.body.val+" AND srs_id="+req.body.srs_id;
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

app.get('/getMentorReportList',function(req,res){
	let sql = "SELECT CONCAT( a.user_first_name,' ', a.user_last_name ) AS mentor_name, a.modified_on, a.user_email_id, a.user_contact_number, b.srs_name, a.status, c.user_address, c.user_pincode, c.user_city, c.user_state, d.role_name FROM users a LEFT JOIN srs_branch b ON a.srs_id = b.srs_id LEFT JOIN usersdetails c ON a.user_id = c.user_id LEFT JOIN roles d ON a.role_id = d.role_id WHERE a.role_id in (8,9,11)";

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
	})
})

app.get('/getNewMentorReportList',function(req,res){
	let sql = "SELECT CONCAT( a.user_first_name,' ', a.user_last_name ) AS mentor_name, a.user_created_date, a.user_email_id, a.user_contact_number, b.srs_name, a.status, c.user_address, c.user_pincode, c.user_city, c.user_state, d.role_name FROM users a LEFT JOIN srs_branch b ON a.srs_id = b.srs_id LEFT JOIN usersdetails c ON a.user_id = c.user_id LEFT JOIN roles d ON a.role_id = d.role_id WHERE a.role_id in (8,9,11)";
	
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
	})
})

app.get('/getMenteeReportList',function(req,res){
	let sql = "SELECT CONCAT(a.user_first_name,' ', a.user_last_name) as mentee_name, a.modified_on, a.user_email_id, a.user_contact_number, b.srs_name, a.status, c.user_address, c.user_pincode, c.user_city, c.user_state, CONCAT(d.user_first_name, d.user_last_name) as mentor_name FROM users a RIGHT JOIN srs_branch b ON a.srs_id = b.srs_id RIGHT JOIN usersdetails c ON a.user_id = c.user_id LEFT JOIN users d ON a.parent_id = d.user_id WHERE a.role_id = 10";
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
	})
})

app.get('/getNewMenteeReportList',function(req,res){
	let sql = "SELECT CONCAT(a.user_first_name,' ', a.user_last_name) as mentee_name, a.user_created_date, a.user_email_id, a.user_contact_number, b.srs_name, a.status, c.user_address, c.user_pincode, c.user_city, c.user_state, CONCAT(d.user_first_name, d.user_last_name) as mentor_name FROM users a RIGHT JOIN srs_branch b ON a.srs_id = b.srs_id RIGHT JOIN usersdetails c ON a.user_id = c.user_id LEFT JOIN users d ON a.parent_id = d.user_id WHERE a.role_id = 10";
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
	})
})

app.get('/getPCSReportList',function(req,res){
	let sql = "SELECT a.current_status, a.modified_date, a.created_on, a.name_of_user, a.relation_with_user, CONCAT (b.user_first_name,' ', b.user_last_name) as member_name from pcs a LEFT JOIN users b ON a.user_id = b.user_id WHERE a.status = 'Y'";
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
	})
})

app.get('/getLMSReportList',function(req,res){
	let sql = "SELECT a.class_name, a.start_date, a.end_date, c.category_name, d.course_name, CONCAT( b.user_first_name, ' ', b.user_last_name ) AS instructor_name FROM Lms_Class a LEFT JOIN users b ON a.instructor_id = b.user_id LEFT JOIN Lms_Category c ON a.category_id = c.row_id LEFT JOIN Lms_Course d ON a.course_id = d.row_id";
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
	})
})

app.get('/getSNSList',function(req,res){
	let sql = "SELECT srs_id, srs_name from srs_branch";
	
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

app.get('/getAttendanceReportList',function(req,res){
	let sql = "SELECT b.srs_name, a.srs_id, c.attendance_status, CONCAT( c.user_first_name, ' ', c.user_last_name ) AS users_name, e.user_contact_number, e.user_email_id, CONCAT( f.user_first_name, ' ', f.user_last_name ) AS mentor_name, COUNT(*) AS count FROM meetingattendance a LEFT JOIN srs_branch b ON a.srs_id = b.srs_id LEFT JOIN attendees c ON a.meeting_id = c.meeting_id LEFT JOIN users d ON a.created_by = d.user_id LEFT JOIN users e ON c.user_id = e.user_id LEFT JOIN users f ON e.parent_id = f.user_id Where c.user_first_name != '' OR c.attendance_status != '' GROUP BY a.srs_id, users_name, c.attendance_status, e.user_contact_number, e.user_email_id, mentor_name ORDER BY users_name";
	//let sql = "SELECT CONCAT( d.user_first_name, ' ', d.user_last_name ) AS captain_name, b.srs_name, a.srs_id, c.attendance_status, CONCAT( c.user_first_name, ' ', c.user_last_name ) AS users_name, a.speaker_name, a.topic_name, e.user_contact_number, e.user_email_id, CONCAT( f.user_first_name, ' ', f.user_last_name ) AS mentor_name, COUNT(*) AS count FROM meetingattendance a LEFT JOIN srs_branch b ON a.srs_id = b.srs_id LEFT JOIN attendees c ON a.meeting_id = c.meeting_id LEFT JOIN users d ON a.created_by = d.user_id LEFT JOIN users e ON c.user_id = e.user_id LEFT JOIN users f ON e.parent_id = f.user_id Where c.user_first_name != '' OR c.attendance_status != '' GROUP BY a.created_by, a.srs_id, users_name, c.attendance_status, a.speaker_name, a.topic_name, e.user_contact_number, e.user_email_id, mentor_name ORDER BY users_name";
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
	})
})

app.get('/getAvgAttendanceReportList/:mon',function(req,res){
	let sql = "SELECT a.srs_id, b.srs_name, month(a.meeting_date) as month, sum(a.new_attendees+a.presentees) as total, (sum(a.new_attendees+a.presentees))/4 as percent FROM meetingattendance a, srs_branch b WHERE a.srs_id = b.srs_id and month(a.meeting_date) = "+req.params.mon+" group by srs_id, month(meeting_date) order by month(meeting_date)";

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
	})
})

app.get('/getTopicReportList',function(req,res){
	let sql = "SELECT a.srs_id, CONCAT(c.user_first_name,' ',c.user_last_name) AS captain_name, a.topic_name, a.meeting_date, a.speaker_name, b.srs_name FROM meetingattendance a INNER JOIN srs_branch b ON a.srs_id = b.srs_id INNER JOIN users c ON b.user_id = c.user_id";

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
	})
})

app.post('/getTopicReportListByDate',function(req,res){
	let sql = "SELECT a.srs_id, CONCAT(c.user_first_name,' ',c.user_last_name) AS captain_name, a.topic_name, a.meeting_date, a.speaker_name, b.srs_name FROM meetingattendance a INNER JOIN srs_branch b ON a.srs_id = b.srs_id INNER JOIN users c ON b.user_id = c.user_id WHERE a.meeting_date >='"+req.body.from_date+"' AND a.meeting_date <= '"+req.body.to_date+"'";

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
	})
})

app.get('/getEventReportList',function(req,res){
	let sql = "SELECT a.event_name, a.event_start_date, a.event_end_date, a.venue_name, b.EventType FROM events a LEFT JOIN event_type b ON a.event_type_id = b.EventTypeID";

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
	})
})

app.post('/getEventReportListByDate',function(req,res){
	let sql = "SELECT a.event_name, a.event_start_date, a.event_end_date, a.venue_name, b.EventType FROM events a LEFT JOIN event_type b ON a.event_type_id = b.EventTypeID WHERE a.event_start_date >='"+req.body.from_date+"' AND a.event_start_date <= '"+req.body.to_date+"'";

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
	})
})

app.get('/getNewlyAddedList',function(req,res){
	let sql = "SELECT a.user_id, CONCAT(a.user_first_name,' ',a.user_last_name) AS user_name, a.user_created_date, a.user_email_id, a.user_contact_number, a.status, b.role_name, CONCAT(c.user_first_name,' ',c.user_last_name) AS mentor_name, d.srs_name FROM users a LEFT JOIN roles b ON a.role_id = b.role_id LEFT JOIN users c ON a.parent_id = c.user_id LEFT JOIN srs_branch d ON a.srs_id = d.srs_id ORDER BY a.user_created_date DESC";
	
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
	})
})

app.get('/monthlyAttendance',function(req,res){
	let sql = "SELECT b.srs_name, CONCAT(MONTHNAME(a.meeting_date),', ',YEAR(a.meeting_date)) AS month, COUNT(*) AS count FROM meetingattendance a INNER JOIN srs_branch b ON a.srs_id = b.srs_id GROUP BY b.srs_name, month";
	
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
	})
})

app.post('/getAttendanceReportListByDate',function(req,res){
	//let sql = "SELECT CONCAT( d.user_first_name, ' ', d.user_last_name ) AS captain_name, b.srs_name, a.srs_id, c.attendance_status, CONCAT( c.user_first_name, ' ', c.user_last_name ) AS users_name, COUNT(*) AS count FROM meetingattendance a LEFT JOIN srs_branch b ON a.srs_id = b.srs_id LEFT JOIN attendees c ON a.meeting_id = c.meeting_id LEFT JOIN users d ON a.created_by = d.user_id WHERE a.meeting_date >='"+req.body.from_date+"' AND a.meeting_date <= '"+req.body.to_date+"' GROUP BY a.created_by, a.srs_id, users_name, c.attendance_status ORDER BY users_name";

	let sql = "SELECT b.srs_name, a.srs_id, c.attendance_status, CONCAT( c.user_first_name, ' ', c.user_last_name ) AS users_name, e.user_contact_number, e.user_email_id, CONCAT( f.user_first_name, ' ', f.user_last_name ) AS mentor_name, COUNT(*) AS count FROM meetingattendance a LEFT JOIN srs_branch b ON a.srs_id = b.srs_id LEFT JOIN attendees c ON a.meeting_id = c.meeting_id LEFT JOIN users d ON a.created_by = d.user_id LEFT JOIN users e ON c.user_id = e.user_id LEFT JOIN users f ON e.parent_id = f.user_id Where c.user_first_name != '' OR c.attendance_status != '' AND a.meeting_date >='"+req.body.from_date+"' AND a.meeting_date <= '"+req.body.to_date+"' GROUP BY a.srs_id, users_name, c.attendance_status, e.user_contact_number, e.user_email_id, mentor_name ORDER BY users_name";

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
	})
})

app.get('/getMentorNonActiveReportList',function(req,res){
	let sql = "SELECT CONCAT(b.user_first_name,' ',b.user_last_name) AS mentor_name, a.created_on, a.modified_date, a.current_status, a.status, c.srs_name FROM pcs a LEFT JOIN users b ON a.user_id = b.user_id LEFT JOIN srs_branch c ON b.srs_id = c.srs_id WHERE b.role_id != 10";

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
	})
})

app.post('/getMentorActivityReportByDate',function(req,res){
	let sql = "SELECT CONCAT(b.user_first_name,' ',b.user_last_name) AS mentor_name, a.created_on, a.modified_date, a.current_status, a.status, c.srs_name FROM pcs a LEFT JOIN users b ON a.user_id = b.user_id LEFT JOIN srs_branch c ON b.srs_id = c.srs_id WHERE b.role_id != 10 AND a.created_on NOT BETWEEN '"+req.body.from_date+"' AND '"+req.body.to_date+"' AND a.modified_date NOT BETWEEN '"+req.body.from_date+"' AND '"+req.body.to_date+"'";

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
	})
})

app.get('/getMenteeNonActiveReportList',function(req,res){
	let sql = "SELECT CONCAT(b.user_first_name,' ',b.user_last_name) AS mentee_name, a.created_on, a.modified_date, a.current_status, a.status, c.srs_name FROM pcs a LEFT JOIN users b ON a.user_id = b.user_id LEFT JOIN srs_branch c ON b.srs_id = c.srs_id WHERE b.role_id = 10";

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
	})
})

app.post('/getMenteeActivityReportByDate',function(req,res){
	let sql = "SELECT CONCAT(b.user_first_name,' ',b.user_last_name) AS mentee_name, a.created_on, a.modified_date, a.current_status, a.status, c.srs_name FROM pcs a LEFT JOIN users b ON a.user_id = b.user_id LEFT JOIN srs_branch c ON b.srs_id = c.srs_id WHERE b.role_id = 10 AND a.created_on NOT BETWEEN '"+req.body.from_date+"' AND '"+req.body.to_date+"' AND a.modified_date NOT BETWEEN '"+req.body.from_date+"' AND '"+req.body.to_date+"'";

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
	})
})

/* Training Category (LMS) */
app.post('/addLMSCategory',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "INSERT INTO Lms_Category (category_name, category_description, category_image_url, created_by, created_on, category_status) VALUES ('"+req.body.category_name+"','"+req.body.category_description+"','"+req.body.category_image_url+"','"+req.body.created_by+"','"+reqdte+"','Y')";

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Category Added successfully."
			});						
		}
	});
})

app.post('/addTrainingCatImg/:cat_name',lmscatupload.single('image'),function(req,res){	
	res.json({
		status: 200,
		message: "Category Image Added successfully.",
		filepath: photopath
	});
})

app.get('/getLMSCategory/:cnt',function(req,res){
	let sql;
	if(req.params.cnt == 'all'){
		sql = "SELECT * from Lms_Category";
	}else if(req.params.cnt == 'Y'){
		sql = "SELECT * from Lms_Category WHERE category_status = '"+req.params.cnt+"'";
	}else{
		sql = "SELECT * from Lms_Category WHERE row_id = "+req.params.cnt;
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

app.get('/getPaginatedCategory/:cnt',function(req,res){
	const limit = 10, page = req.params.cnt, offset = (page - 1) * limit;
	let sql = "SELECT * from Lms_Category limit "+limit+" OFFSET "+offset;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			let resp1 = data;
			let sql = "SELECT COUNT(*) AS total from Lms_Category";
			db.query(sql, function(err, data, fields) {
				if(err){
					res.json({
						status: null,
						message: err
				   	});
				}else{
					res.json({
						status: 200,
						data: {
							data : resp1,
							total : data 
						},
						message: "Lists fetched successfully."
					});
				}
			})						
		}
	});
})

app.post('/changeLMSCatStatus',function(req,res) {
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "UPDATE Lms_Category SET category_status = '"+req.body.category_status+"', modified_by = '"+req.body.modified_by+"', modified_on = '"+reqdte+"' WHERE row_id="+req.body.row_id;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Category status changed successfully."
			});						
		}
	});
})

app.get('/getLMSCategoryImg/:id', function(req, res){
	let sql = "SELECT category_image_url from Lms_Category WHERE row_id = "+req.params.id;
	db.query(sql, function(err, data, fields) {
		if(data.length > 0){
			const file = data[0].category_image_url;
			if(file){
				res.sendFile(__dirname + file);
			}else{
				res.sendFile(__dirname + '/uploads/not-found/no-img-found-small.png');
			}
		}else{
			res.sendFile(__dirname + '/uploads/not-found/no-img-found-small.png');
		}  		
	});
});

app.post('/updateLMSCategory',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql;
	if(req.body.imgurl == ''){
		sql = "UPDATE Lms_Category SET category_name = '"+req.body.category_name+"', category_description = '"+req.body.category_description+"', modified_by = '"+req.body.modified_by+"', modified_on = '"+reqdte+"' WHERE row_id="+req.body.row_id;
	}else{
		sql = "UPDATE Lms_Category SET category_name = '"+req.body.category_name+"', category_description = '"+req.body.category_description+"', modified_by = '"+req.body.modified_by+"', category_image_url = '"+req.body.category_image_url+"', modified_on = '"+reqdte+"' WHERE row_id="+req.body.row_id;
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
				message: "Category Updated successfully."
			});						
		}
	});
});


/* Training Course (LMS) */
app.post('/addLMSCourse',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "INSERT INTO Lms_Course (course_name, category_id, course_description, course_image_url, created_by, created_on, course_status) VALUES ('"+req.body.course_name+"','"+req.body.category_id+"','"+req.body.course_description+"','"+req.body.course_image_url+"','"+req.body.created_by+"','"+reqdte+"','Y')";

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Category Added successfully."
			});						
		}
	});
})

app.post('/addTrainingCourseImg/:course_name',lmscourseupload.single('image'),function(req,res){
	res.json({
		status: 200,
		message: "Course Image Added successfully.",
		filepath: photopath
	});
})

app.get('/getLMSCourseImg/:id', function(req, res){
	let sql = "SELECT course_image_url from Lms_Course WHERE row_id = "+req.params.id;
	db.query(sql, function(err, data, fields) {
		if(data.length > 0){
			const file = data[0].course_image_url;
	  		if(file){
				res.sendFile(__dirname + file);
			}else{
				res.sendFile(__dirname + '/uploads/not-found/no-img-found-small.png');
			}
		}else{
			res.sendFile(__dirname + '/uploads/not-found/no-img-found-small.png');
		}		
	});
});

app.get('/getLMSCourse/:cnt',function(req,res){
	let sql;
	if(req.params.cnt == 'all'){
		sql = "SELECT * from Lms_Course a INNER JOIN Lms_Category b ON a.category_id = b.row_id";
	}else if(req.params.cnt == 'Y'){
		sql = "SELECT * from Lms_Course WHERE course_status = '"+req.params.cnt+"'";
	}else{
		sql = "SELECT * from Lms_Course WHERE row_id = "+req.params.cnt;
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

app.get('/getPaginatedCourse/:cnt',function(req,res){
	const limit = 10, page = req.params.cnt, offset = (page - 1) * limit;
	let sql = "SELECT *, a.row_id AS course_id from Lms_Course a INNER JOIN Lms_Category b ON a.category_id = b.row_id limit "+limit+" OFFSET "+offset;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			let resp1 = data;
			let sql = "SELECT COUNT(*) AS total from Lms_Course";
			db.query(sql, function(err, data, fields) {
				if(err){
					res.json({
						status: null,
						message: err
				   	});
				}else{
					res.json({
						status: 200,
						data: {
							data : resp1,
							total : data 
						},
						message: "Lists fetched successfully."
					});
				}
			})						
		}
	});
})

app.get('/getMentors/:id',function(req,res){
	let sql = "SELECT user_id, user_email_id FROM users WHERE role_id IN (9,11) AND srs_id = "+req.params.id;

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

app.get('/getLMSCourseOnCat/:id',function(req,res){
	let sql = "SELECT * from Lms_Course WHERE category_id = "+req.params.id;

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

app.post('/changeLMSCourseStatus',function(req,res) {
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "UPDATE Lms_Course SET course_status = '"+req.body.course_status+"', modified_by = '"+req.body.modified_by+"', modified_on = '"+reqdte+"' WHERE row_id="+req.body.row_id;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Course status changed successfully."
			});						
		}
	});
})

app.post('/updateLMSCourse',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql;
	if(req.body.course_image_url == ''){
		sql = "UPDATE Lms_Course SET course_name = '"+req.body.course_name+"',category_id = '"+req.body.category_id+"', course_description = '"+req.body.course_description+"', modified_by = '"+req.body.modified_by+"', modified_on = '"+reqdte+"' WHERE row_id="+req.body.row_id;
	}else{
		sql = "UPDATE Lms_Course SET course_name = '"+req.body.course_name+"',category_id = '"+req.body.category_id+"', course_description = '"+req.body.course_description+"', modified_by = '"+req.body.modified_by+"', course_image_url = '"+req.body.course_image_url+"', modified_on = '"+reqdte+"' WHERE row_id="+req.body.row_id;
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
				message: "Course Updated successfully."
			});						
		}
	});
});


/* Training Lesson (LMS) */
app.post('/addLMSLesson',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "INSERT INTO Lms_Lesson (lesson_name, course_id, category_id, lesson_description, created_by, created_on, lesson_status) VALUES ('"+req.body.lesson_name+"','"+req.body.course_id+"','"+req.body.category_id+"','"+req.body.lesson_description+"','"+req.body.created_by+"','"+reqdte+"','Y')";

	db.query(sql, function(err, data, fields) {
		if(req.body.docdata.length > 0){
			var b =[], id = data.insertId, newArr=[];
			for(var i=0;i<req.body.docdata.length;i++){
				b.push(id);
				b.push('/uploads/lms/lesson/lesson_'+id+'_'+req.body.docdata[i].pdf_path);
				b.push(req.body.docdata[i].meeting_url);
				newArr.push(b);
				b=[];
			}
			let sql = "INSERT INTO Lms_Lesson_Doc (lesson_id, pdf_path, meeting_url) VALUES ?";
			db.query(sql, [newArr], function(err, data, fields) {
				if(err){
					res.json({
						status: null,
						message: err
				   	});
				}else{			
					res.json({
						status: 200,
						message: "Lesson Added successfully.",
						data: id
					});						
				}
			})
		}else{
			res.json({
				status: 200,
				message: "Lesson Added successfully.",
				data: id
			});	
		}
	});
})

app.post('/addLessonDoc/:id',lessonupload.array('image',10),function(req,res){    
	res.json({
		status: 200,
		message: "Lesson Added successfully."
	});
})

app.post('/addTrainingLessonImg/:lesson_name',lmslessonupload.single('image'),function(req,res){
	res.json({
		status: 200,
		message: "Lesson Image Added successfully.",
		filepath: photopath
	});
})

app.get('/getLMSLessonImg/:id', function(req, res){
	let sql = "SELECT lesson_image_url from Lms_Lesson WHERE row_id = "+req.params.id;
	db.query(sql, function(err, data, fields) {
		if(data.length > 0){
			const file = data[0].lesson_image_url;
	  		if(file){
				res.sendFile(__dirname + file);
			}else{
				res.sendFile(__dirname + '/uploads/not-found/no-img-found-small.png');
			}
		}else{
			res.sendFile(__dirname + '/uploads/not-found/no-img-found-small.png');
		}
	});
});

app.get('/getLMSLesson/:cnt',function(req,res){
	let sql, type;
	if(req.params.cnt == 'all'){
		sql = "SELECT *, CONCAT(a.row_id) AS lesson_id from Lms_Lesson a INNER JOIN Lms_Category b ON a.category_id = b.row_id LEFT JOIN Lms_Course c ON a.course_id = c.row_id";
	}else if(req.params.cnt == 'Y'){
		sql = "SELECT * from Lms_Lesson WHERE lesson_status = '"+req.params.cnt+"'";
	}else{
		sql = "SELECT * from Lms_Lesson WHERE row_id = "+req.params.cnt;
		type = 'editlesson';
	}

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			if(type){
				let resp1 = data;
				sql = "SELECT * from Lms_Lesson_Doc WHERE lesson_id = "+req.params.cnt;
				db.query(sql, function(err, data, fields) {
					if(err){
						res.json({
							status: null,
							message: err
					   	});
					}else{
						let resp = {};
						resp.list = data;
						resp.data = resp1;
						res.json({
							status: 200,
							data: resp,
							message: "List fetched successfully."
						});
					}
				})
			}else{
				res.json({
					status: 200,
					data: data,
					message: "List fetched successfully."
				});
			}			
		}
	});
})

app.get('/getPaginatedLesson/:cnt',function(req,res){
	const limit = 10, page = req.params.cnt, offset = (page - 1) * limit;
	let sql = "SELECT *, CONCAT(a.row_id) AS lesson_id from Lms_Lesson a INNER JOIN Lms_Category b ON a.category_id = b.row_id LEFT JOIN Lms_Course c ON a.course_id = c.row_id  limit "+limit+" OFFSET "+offset;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			let resp1 = data;
			let sql = "SELECT COUNT(*) AS total from Lms_Lesson";
			db.query(sql, function(err, data, fields) {
				if(err){
					res.json({
						status: null,
						message: err
				   	});
				}else{
					res.json({
						status: 200,
						data: {
							data : resp1,
							total : data 
						},
						message: "Lists fetched successfully."
					});
				}
			})						
		}
	});
})

app.get('/removeDoc/:rowid/:lessonid',function(req,res){    
	let sql = "SELECT pdf_path FROM Lms_Lesson_Doc WHERE row_id = " + req.params.rowid;
	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			if(data.length > 0){
				const pathToFile = __dirname + data[0].pdf_path;
				fs.unlinkSync(pathToFile);
			}
			
			let sql = "DELETE FROM Lms_Lesson_Doc WHERE row_id = " + req.params.rowid;
			db.query(sql, function(err, data, fields) {
				if(err){
					res.json({
						status: null,
						message: err
				   	});
				}else{
					res.json({
						status: 200,
						message: "Lessons deleted successfully."
				   	});
				}
			})
		}
	})
})

app.post('/changeLMSLessonStatus',function(req,res) {
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "UPDATE Lms_Lesson SET lesson_status = '"+req.body.lesson_status+"', modified_by = '"+req.body.modified_by+"', modified_on = '"+reqdte+"' WHERE row_id="+req.body.row_id;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Course status changed successfully."
			});						
		}
	});
})

app.post('/updateLMSLesson',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();
	sql = "UPDATE Lms_Lesson SET lesson_name = '"+req.body.lesson_name+"',course_id = '"+req.body.course_id+"',category_id = '"+req.body.category_id+"', lesson_description = '"+req.body.lesson_description+"', modified_by = '"+req.body.modified_by+"', modified_on = '"+reqdte+"' WHERE row_id="+req.body.row_id;	
	db.query(sql, function(err, data, fields) {
		var b =[], id = req.body.row_id, newArr=[], cnt=0;
		for(var i=0;i<req.body.docdata.length;i++){
			if(typeof req.body.docdata[i].row_id != 'number'){
				b.push(id);
				b.push('/uploads/lms/lesson/lesson_'+id+'_'+req.body.docdata[i].pdf_path);
				b.push(req.body.docdata[i].meeting_url);
				newArr.push(b);
				b=[];
				cnt++;
			}
		}
		if(cnt > 0){
			let sql = "INSERT INTO Lms_Lesson_Doc (lesson_id, pdf_path, meeting_url) VALUES ?";
			db.query(sql, [newArr], function(err, data, fields) {
				if(err){
					res.json({
						status: null,
						message: err
				   	});
				}else{			
					res.json({
						status: 200,
						message: "Lesson Updated successfully.",
						data: id
					});						
				}
			})
		}else{
			res.json({
				status: 200,
				message: "Lesson Updated successfully."
			});	
		}		
	});
});

app.post('/addLMSClass',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "INSERT INTO Lms_Class (class_name, start_date, end_date, connection_link, description, course_id, instructor_id, created_by, created_on, class_status, class_type, category_id) VALUES ('"+req.body.class_name+"','"+req.body.start_date+"','"+req.body.end_date+"','"+req.body.connection_link+"','"+req.body.description+"','"+req.body.course_id+"','"+req.body.instructor_id+"','"+req.body.created_by+"','"+reqdte+"','Y','"+req.body.class_type+"','"+req.body.cat_id+"')";

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Class Added successfully."
			});						
		}
	});
})

app.get('/getCourseFromCat/:id',function(req,res){
	let sql = "SELECT row_id, course_name FROM Lms_Course WHERE category_id = " + req.params.id +" AND course_status = 'Y'";

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

app.post('/generateCode',function(req,res) {
	let sql = "INSERT INTO generateClassCode (course_name, class_start_date) VALUES ('"+req.body.course_name+"','"+req.body.class_start_date_mon_yr+"')";

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				data: data.insertId,
				message: "Code Generated Successfully"
			});						
		}
	});
})

app.post('/updateLMSClass',function(req,res){
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "UPDATE Lms_Class SET class_name = '"+req.body.class_name+"',course_id = '"+req.body.course_id+"',start_date = '"+req.body.start_date+"', end_date = '"+req.body.end_date+"', description = '"+req.body.description+"', modified_by = '"+req.body.modified_by+"', modified_on = '"+reqdte+"', class_type = '"+req.body.class_type+"', category_id = '"+req.body.cat_id+"' WHERE row_id="+req.body.row_id;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Class Updated successfully."
			});
		}
	});
});

app.post('/addTrainingClassDoc/:class_name/:cnt',lmsclassupload.single('image'),function(req,res){	
	res.json({
		status: 200,
		message: "Document Added successfully.",
		filepath: photopath
	});
})

app.get('/getLMSClass/:cnt',function(req,res){
	let sql;
	if(req.params.cnt == 'all'){
		sql = "SELECT *, CONCAT(a.row_id) AS class_id from Lms_Class a LEFT JOIN Lms_Course b ON a.course_id = b.row_id";
	}else if(req.params.cnt == 'Y'){
		sql = "SELECT * from Lms_Class WHERE class_status = '"+req.params.cnt+"'";
	}else{
		sql = "SELECT * from Lms_Class WHERE row_id = "+req.params.cnt;
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

app.get('/getPaginatedClass/:id/:cnt',function(req,res){
	const limit = 10, page = req.params.cnt, offset = (page - 1) * limit;
	let sql = "SELECT *, CONCAT(a.row_id) AS class_id from Lms_Class a LEFT JOIN Lms_Course b ON a.course_id = b.row_id WHERE a.created_by = "+req.params.id+" limit "+limit+" OFFSET "+offset;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			let resp1 = data;
			let sql = "SELECT COUNT(*) AS total from Lms_Class WHERE created_by = " + req.params.id;
			db.query(sql, function(err, data, fields) {
				if(err){
					res.json({
						status: null,
						message: err
				   	});
				}else{
					res.json({
						status: 200,
						data: {
							data : resp1,
							total : data 
						},
						message: "Lists fetched successfully."
					});
				}
			})						
		}
	});
})

app.get('/getAllLMSClass',function(req,res){
	let sql = "SELECT a.class_name, b.course_name, c.user_first_name, c.user_last_name, a.start_date, a.end_date, a.class_status, CONCAT(a.row_id) AS class_id from Lms_Class a LEFT JOIN Lms_Course b ON a.course_id = b.row_id LEFT JOIN users c ON a.instructor_id = c.user_id";

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

app.get('/getPaginatedAllClass/:cnt',function(req,res){
	const limit = 10, page = req.params.cnt, offset = (page - 1) * limit;
	let sql = "SELECT a.class_name, b.course_name, c.user_first_name, c.user_last_name, a.start_date, a.end_date, a.class_status, CONCAT(a.row_id) AS class_id from Lms_Class a LEFT JOIN Lms_Course b ON a.course_id = b.row_id LEFT JOIN users c ON a.instructor_id = c.user_id limit "+limit+" OFFSET "+offset;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			let resp1 = data;
			let sql = "SELECT COUNT(*) AS total from Lms_Class";
			db.query(sql, function(err, data, fields) {
				if(err){
					res.json({
						status: null,
						message: err
				   	});
				}else{
					res.json({
						status: 200,
						data: {
							data : resp1,
							total : data 
						},
						message: "Lists fetched successfully."
					});
				}
			})						
		}
	});
})

app.get('/getLMSClassLesson/:id',function(req,res){
	let sql = "SELECT a.row_id, a.lesson_name FROM Lms_Lesson a INNER JOIN Lms_Class b ON a.course_id = b.course_id WHERE b.row_id = " + req.params.id;
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
				message: "Lesson List fetched successfully."
			});						
		}
	});
})

app.post('/updateLessonStatus',function(req,res){
	let sql = "INSERT INTO Lms_Class_Lesson (class_id,lesson_id,instructor_id,lesson_status, completion_date) VALUES ('"+req.body.class_id+"','"+req.body.lesson_id+"','"+req.body.instructor_id+"','"+req.body.lesson_status+"',NOW())";

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Lesson Status Updated successfully."
			});						
		}
	});
})

app.get('/getActiveLesson/:id',function(req,res){
	let sql = "SELECT lesson_status,lesson_id from Lms_Class_Lesson WHERE class_id = " + req.params.id;
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

app.get('/getLMSClassList/:id',function(req,res){
	let sql = "SELECT *, CONCAT(a.row_id) AS class_id from Lms_Class a LEFT JOIN Lms_Course b ON a.course_id = b.row_id WHERE a.created_by = " + req.params.id;

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

app.post('/changeLMSClassStatus',function(req,res) {
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "UPDATE Lms_Class SET class_status = '"+req.body.class_status+"', modified_by = '"+req.body.modified_by+"', modified_on = '"+reqdte+"' WHERE row_id="+req.body.row_id;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Class status changed successfully."
			});						
		}
	});
})

app.post('/addMenteeToClass',function(req,res) {
	if(req.body.vals.length == 0){
		let sql = "UPDATE Lms_Mentees SET mentee_status = 'N' WHERE class_id = "+req.body.class_id;
		db.query(sql, function(err, data, fields) {
			if(err){
				res.json({
					status: null,
					message: err
			   	});
			}else{			
				res.json({
					status: 200,
					message: "Mentees List has been updated successfully."
				});						
			}
		});
	}else{
		var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
		month < 10 ? mon = "0"+month : mon = month;
		dte < 10 ? dt = "0"+dte : dt = dte;
		var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

		let sql = "DELETE FROM Lms_Mentees WHERE class_id = "+req.body.class_id;

		db.query(sql, function(err, data, fields) {
			let sql = "INSERT INTO Lms_Mentees (mentee_id, mentee_first_name, mentee_last_name, instructor_id, class_id, category_id, course_id, created_by, added_on, mentee_status) VALUES?";

			db.query(sql, [req.body.vals], function(err, data, fields) {
				if(err){
					res.json({
						status: null,
						message: err
				   	});
				}else{			
					res.json({
						status: 200,
						message: "Mentees added successfully."
					});						
				}
			});
		})
	}
})

app.get('/getMentees/:instructor_id/:sns_id',function(req,res){
	let sql = "SELECT users.user_id, users.user_first_name, users.user_last_name, users.parent_id from users WHERE users.parent_id = " + req.params.instructor_id + " AND users.srs_id = " + req.params.sns_id+" AND users.status = 'Enable'";
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

app.get('/getLmsMentees/:class_id',function(req,res){
	let sql = "SELECT mentee_id AS user_id, mentee_first_name AS user_first_name, mentee_last_name AS user_last_name, instructor_id AS parent_id, mentee_status from Lms_Mentees WHERE class_id = "+req.params.class_id;
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

app.get('/getLmsClassMentees/:class_id',function(req,res){
	let sql = "SELECT row_id, mentee_id, mentee_first_name, mentee_last_name, instructor_id from Lms_Mentees WHERE class_id = "+req.params.class_id+" AND mentee_status='Y'";
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

app.get('/disableMentee/:user_id/:id',function(req,res) {
	var a = new Date(), month = (a.getMonth()+1), mon = '', dte = a.getDate(), dt = '';
	month < 10 ? mon = "0"+month : mon = month;
	dte < 10 ? dt = "0"+dte : dt = dte;
	var reqdte = a.getFullYear()+'-'+mon+'-'+dt+' '+a.getHours()+':'+a.getMinutes()+':'+a.getSeconds();

	let sql = "UPDATE Lms_Mentees SET mentee_status = 'N', modified_by = '"+req.params.user_id+"', modified_on = '"+reqdte+"' WHERE row_id="+req.params.id;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Class status changed successfully."
			});						
		}
	});
})

/* Mentee Page */
app.get('/getUpComingCourseForMentees/:id',function(req,res){
	let sql = "SELECT * FROM Lms_Mentees a LEFT JOIN Lms_Course b ON a.course_id = b.row_id LEFT JOIN Lms_Class c ON a.class_id = c.row_id WHERE a.mentee_id="+ req.params.id+" AND DATE(c.start_date) > DATE(NOW())";
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

app.get('/getOnGoingCourseForMentees/:id',function(req,res){
	let sql = "SELECT * FROM Lms_Mentees a LEFT JOIN Lms_Course b ON a.course_id = b.row_id LEFT JOIN Lms_Class c ON a.class_id = c.row_id WHERE a.mentee_id="+ req.params.id+" AND a.mentee_status = 'Y' AND DATE(c.start_date) <= DATE(NOW()) AND DATE(c.end_date) >= DATE(NOW())";
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

app.get('/downloadPDF/:id', function(req, res){
	let sql = "SELECT document_url from Lms_Class WHERE row_id = "+req.params.id;
	db.query(sql, function(err, data, fields) {
  		const file = data[0].document_url;
  		fs.readFile(__dirname + file , function (err,data){
            res.contentType("application/pdf");
            res.send(data);
        });
	});
});

app.get('/getCourseDetailsForMentees/:id/:user_id',function(req,res){
	let sql = "SELECT *, CONCAT(b.row_id) AS class_id FROM Lms_Course a INNER JOIN Lms_Class b ON a.row_id = b.course_id INNER JOIN users c ON b.instructor_id = c.parent_id WHERE a.row_id = '"+ req.params.id+"' AND c.user_id = '"+ req.params.user_id+"'";
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
				message: "Details fetched successfully."
			});						
		}
	});
})

app.get('/getLessonsForMentees/:id',function(req,res){
	let sql = "SELECT * FROM Lms_Lesson WHERE course_id = "+ req.params.id;
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
				message: "Details fetched successfully."
			});						
		}
	});
})

/* PCS */
app.post('/addPCS',function(req,res){
	let sql = "INSERT INTO pcs (user_id,name_of_user,relation_with_user,city,state,current_status,pcs_description,created_on,status) VALUES ('"+req.body.user_id+"','"+req.body.name_of_user+"','"+req.body.relation_with_user+"','"+req.body.city+"','"+req.body.state+"','"+req.body.current_status+"','"+req.body.pcs_description+"',NOW(),'"+req.body.status+"')"

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Information Added Successfully."
			});
		}
	});
});


app.get('/getPCS/:user_id/:type',function(req,res){
	let sql;
	if(req.params.type == 'all'){
		sql = "SELECT * FROM pcs WHERE user_id = "+req.params.user_id+"ORDER BY created_on DESC";
	}else{
		sql = "SELECT * FROM pcs WHERE pcs_id = "+ req.params.type;
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
				message: "Details fetched successfully."
			});						
		}
	});
})


app.get('/getPaginatedPCS/:user_id/:cnt',function(req,res){
	const limit = 10, page = req.params.cnt, offset = (page - 1) * limit;
	let sql = "SELECT * FROM pcs WHERE user_id = "+req.params.user_id+" ORDER BY created_on DESC limit "+limit+" OFFSET "+offset;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			let resp1 = data;
			let sql = "SELECT COUNT(*) AS total from pcs WHERE user_id = "+req.params.user_id;
			db.query(sql, function(err, data, fields) {
				if(err){
					res.json({
						status: null,
						message: err
				   	});
				}else{
					res.json({
						status: 200,
						data: {
							data : resp1,
							total : data 
						},
						message: "Details fetched successfully."
					});
				}
			})						
		}
	});
})

app.get('/getPaginatedUsers/:cnt',function(req,res){
	const limit = 10, page = req.params.cnt, offset = (page - 1) * limit;

	let sql = "SELECT a.user_id, a.user_first_name, a.user_last_name, a.user_created_date,a.status, b.role_name, c.srs_name, CONCAT(d.user_first_name, ' ', d.user_last_name) AS mentor_name FROM users a INNER JOIN roles b ON a.role_id = b.role_id LEFT JOIN srs_branch c ON a.srs_id = c.srs_id LEFT JOIN users d ON d.user_id = a.parent_id ORDER BY a.user_created_date DESC limit "+limit+" OFFSET "+offset;
	//ORDER BY a.user_first_name, a.user_last_name,  DESC

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			let resp1 = data;
			let sql = "SELECT COUNT(*) AS total from users";
			db.query(sql, function(err, data, fields) {
				if(err){
					res.json({
						status: null,
						message: err
				   	});
				}else{
					res.json({
						status: 200,
						data: {
							data : resp1,
							total : data 
						},
						message: "Details fetched successfully."
					});
				}
			})					
		}
	});
})

app.get('/getPaginatedSpecificUsers/:type/:id/:cnt',function(req,res){
	const limit = 10, page = req.params.cnt, offset = (page - 1) * limit; let sql;
	if(req.params.type == 'M'){
		sql = "SELECT a.user_id, a.user_first_name, a.user_last_name, a.user_created_date,a.status, b.role_name, c.srs_name, CONCAT(d.user_first_name, ' ', d.user_last_name) AS mentor_name FROM users a INNER JOIN roles b ON a.role_id = b.role_id LEFT JOIN srs_branch c ON a.srs_id = c.srs_id LEFT JOIN users d ON d.user_id = a.parent_id WHERE a.parent_id = "+req.params.id+" ORDER BY a.user_first_name, a.user_last_name DESC limit "+limit+" OFFSET "+offset;
	}else{
		sql = "SELECT a.user_id, a.user_first_name, a.user_last_name, a.user_created_date,a.status, b.role_name, c.srs_name, CONCAT(d.user_first_name, ' ', d.user_last_name) AS mentor_name FROM users a INNER JOIN roles b ON a.role_id = b.role_id LEFT JOIN srs_branch c ON a.srs_id = c.srs_id LEFT JOIN users d ON d.user_id = a.parent_id WHERE a.srs_id = "+req.params.id+" ORDER BY a.user_first_name, a.user_last_name DESC limit "+limit+" OFFSET "+offset;
	}

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			let resp1 = data;
			if(req.params.type == 'M'){
				sql = "SELECT COUNT(*) AS total from users WHERE parent_id = "+req.params.id;
			}else{
				sql = "SELECT COUNT(*) AS total from users WHERE srs_id = "+req.params.id;
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
						data: {
							data : resp1,
							total : data 
						},
						message: "Details fetched successfully."
					});
				}
			})					
		}
	});
})

app.post('/changeStatusOfPCS',function(req,res){
	let sql = "UPDATE pcs SET status = '"+req.body.status+"', modified_date = NOW() WHERE pcs_id="+req.body.pcs_id;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Status Changed Successfully."
			});
		}
	});
});

app.post('/upDatePCS',function(req,res){
	let sql = "UPDATE pcs SET name_of_user = '"+req.body.name_of_user+"',relation_with_user = '"+req.body.relation_with_user+"',city = '"+req.body.city+"', state = '"+req.body.state+"', current_status = '"+req.body.current_status+"', pcs_description = '"+req.body.pcs_description+"', modified_date = NOW() WHERE pcs_id="+req.body.pcs_id;

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{			
			res.json({
				status: 200,
				message: "Data Updated Successfully."
			});
		}
	});
});

app.post('/visitors',function(req,res){
	let sql = "INSERT INTO visitors_contact (visitor_name, visitor_email_id, visitor_subject, visitor_contact_number, message, created_date) VALUES ('"+req.body.visitor_name+"','"+req.body.visitor_email_id+"','"+req.body.visitor_subject+"','"+req.body.visitor_contact_number+"','"+req.body.message+"', NOW())";

	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			let param ={
				"visitor_name" : req.body.visitor_name,
				"visitor_email_id" : req.body.visitor_email_id,
				"visitor_contact_number" : req.body.visitor_contact_number,
				"message" : req.body.message
			}
			var description = contact_email.contact(param);

		   	var mailOptions={
		        to : 'abraham@vecan.co',
		        cc : 'reuben@vecan.co',
				subject : req.body.visitor_subject,
				html : description
		    }

		    mailerdetails.sendMail(mailOptions, function(error, response){
			    if(error){
			        res.json({
						status: 200,
						message: error
					});
			    }else{
			        res.json({
						status: 200,
						message: "Message has been sent successfully."
					});
			    }
			});
		}
	});
});

app.post('/enquiry',function(req,res){
	let param ={
		"visitor_name" : req.body.visitor_name,
		"visitor_email_id" : req.body.visitor_email_id,
		"message" : req.body.message
	}
	var description = contact_email.enquiry(param);
	var mailOptions={
	    to : req.body.mailers_to,
	    cc : 'rbnjathanna@gmail.com',
		subject : "Visitors Details",
		html : description
	}

	mailerdetails.sendMail(mailOptions, function(error, response){
	    if(error){
	        res.json({
				status: 200,
				message: error
			});
	    }else{
	        res.json({
				status: 200,
				message: "Message has been sent successfully."
			});
	    }
	});
});

app.post('/forgotpassword',function(req,res){
	let sql = "SELECT * FROM users WHERE user_email_id = '"+req.body.email_id+"'";
	db.query(sql, function(err, data, fields) {
		if(data.length > 0){
			let param = {
				redirectlink : constant.forgotredirectlink,
				url : req.body.url
			}
			var description = get_password.forgot_password(param);

		   	var mailOptions={
		        to: req.body.email_id,
		        cc: 'abraham@vecan.co',
				subject: 'Sing And Share - Forgot your Password',
				html: description
		    }

		    mailerdetails.sendMail(mailOptions, function(error, response){
			    if(error){
			        res.json({
			        	status:201,
			        	message:response,
			        	data:error
			        });
			    }else{
			        res.json({
						status: 200,
						message: "Email is sent successfully. Kindly check your Spam or Inbox for the same."
				   	});
			    }
			});
		}else{
			res.json({
	        	status:201,
	        	message: "No User with such Email Id exists"
	        });
		}		
	})
});

app.post('/resetpassword',function(req,res){
	let sql = "UPDATE users_password SET user_password = '"+req.body.password+"' WHERE user_email_id='"+req.body.email_id+"'";
	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			res.json({
				status: 200,
				message: "Your password has been resetted successfully."
		   	});
		}
	})
})

app.get('/getLessonsActivityForMentees/:class_id',function(req,res){
	let sql = "SELECT * FROM Lms_Class_Lesson WHERE class_id = '"+req.params.class_id+"'";
	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			res.json({
				status: 200,
				data:data,
				message: "List fetched successfully."
		   	});
		}
	})
})

app.get('/getLessonsActivityForMentees/:class_id',function(req,res){
	let sql = "SELECT * FROM Lms_Class_Lesson WHERE class_id = '"+req.params.class_id+"'";
	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			res.json({
				status: 200,
				data:data,
				message: "List fetched successfully."
		   	});
		}
	})
})

app.get('/getMenteeStatusForClass/:class_id/:user_id',function(req,res){
	let sql = "SELECT mentee_status FROM Lms_Mentees WHERE class_id = '"+req.params.class_id+"' AND mentee_id = '"+req.params.user_id+"'";
	db.query(sql, function(err, data, fields) {
		if(err){
			res.json({
				status: null,
				message: err
		   	});
		}else{
			res.json({
				status: 200,
				data:data,
				message: "Status fetched successfully."
		   	});
		}
	})
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`));