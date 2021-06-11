module.exports = {
	change_password: function(param) {
		return(
			'<h3>Welcome to SingAndShare</h3>'+
			'<p>Please click on the below link to register yourself as a Mentee and be the disciple of God.</p>'+
			'<a href="'+param.redirectlink + param.url+'">Click Here !!</a>'
		)
	},

	forgot_password: function(param) {
		return(
			'<h3>Welcome to SingAndShare</h3>'+
			'<p>Please click on the below link to change your password and get a new password for yourself.</p>'+
			'<a href="'+param.redirectlink + param.url+'">Click Here !!</a>'
		)
	}
}