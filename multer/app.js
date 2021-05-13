const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

module.exports = {
	lms_cat: function() {
		multer.diskStorage({
		    destination: (req, file, cb) => {
		      	cb(null, './uploads/lms/category');
		    },
		    filename: (req, file, cb) => {
			    var dte = new Date();
				var a = dte.getDate()+'_'+(dte.getMonth()+1)+'_'+dte.getFullYear()+'_'+dte.getHours()+'_'+dte.getMinutes()+'_'+dte.getSeconds();

				photopath = '/uploads/lms/category/cat_'+req.params.cat_name+path.extname(file.originalname);
				cb(null, 'cat_'+req.params.cat_name+path.extname(file.originalname));
		    }
		});
	}
}