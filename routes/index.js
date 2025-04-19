var express = require('express');
const { signUp, login, createProj, saveProject, getProjects, getProject, deleteProject, editProject, githubAuth, githubCallback, forgotPassword, verifyResetCode, resetPassword } = require('../controllers/userController');
const { sendContactEmail } = require('../utils/emailService');
const { handleContact } = require('../controllers/contactController');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // Instead of rendering a view, send a simple JSON response
  res.json({
    success: true,
    message: 'API is running'
  });
});

router.post("/signUp", signUp); // signUp is the controller function
router.post("/login", login); 
router.post("/createProj", createProj); 
router.post("/saveProject", saveProject); 
router.post("/getProjects", getProjects); 
router.post("/getProject", getProject); 
router.post("/deleteProject", deleteProject); 
router.post("/editProject", editProject); 

router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

// If you have GitHub routes here, you should remove them or make sure they use the imported passport
// Instead of defining these routes here, they should be in the auth.js file

router.post('/contact', handleContact);

module.exports = router;
