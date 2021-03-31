const jwt = require('jsonwebtoken');
const config = require('./config');

module.exports = (credentials = []) => {
	return (req, res, next) => {
		const token = req.headers['authorization'];

		// Allow for a string or array
		if(typeof credentials === 'string'){
			credentials = [credentials]
		}

		if(token){
			// Validate JWT
			const tokenBody = token.slice(7);
			jwt.verify(tokenBody,config.JWT_SECRET,(err,decoded) => {
				if(err){
					console.log('JWT Error : '+err);
					return res.status(403).send('Error : Access Denied');
				}
				// No Error, JWT is right

				//Check for the credentials being passed
				if(credentials.length > 0){
					if(
						decoded.scopes &&
						decoded.scopes.length && 
						credentials.some(cred => decoded.scopes.indexOf(cred) >= 0)
					){
						next();
					}else{
						return res.status(403).send('Error : Access Denied');
					}
				}else{
					// No credentials required, user is authorized
					next();
				}				
			});
		}else{
			return res.status(403).send("You're not Authorized");
		}
	}
}


