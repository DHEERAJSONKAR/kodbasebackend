const userModel = require("../models/userModel");
const projectModel = require("../models/projectModel");
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const passport = require('passport');
const { sendResetCode } = require('../utils/emailService');  // Fixed import

const secret = process.env.JWT_SECRET || "secret";

function getStartupCode(language) {
  if (language.toLowerCase() === "python") {
    return 'print("Hello World")';
  } else if (language.toLowerCase() === "java") {
    return 'public class Main { public static void main(String[] args) { System.out.println("Hello World"); } }';
  } else if (language.toLowerCase() === "javascript") {
    return 'console.log("Hello World");';
  } else if (language.toLowerCase() === "cpp") {
    return '#include <iostream>\n\nint main() {\n    std::cout << "Hello World" << std::endl;\n    return 0;\n}';
  } else if (language.toLowerCase() === "c") {
    return '#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}';
  } else if (language.toLowerCase() === "go") {
    return 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello World")\n}';
  } else if (language.toLowerCase() === "bash") {
    return 'echo "Hello World"';
  } else if (language.toLowerCase() === "ruby") {
    return 'puts "Hello World"';
  } else if (language.toLowerCase() === "dart") {
    return 'void main() {\n    print("Hello World");\n}';
  } else if (language.toLowerCase() === "swift") {
    return 'print("Hello World")';
  } else if (language.toLowerCase() === "php") {
    return '<?php\necho "Hello World";\n?>';
  } else {
    return 'Language not supported';
  }
}

const signUp = async (req, res) => {
  try {
    let { email, pwd, fullName } = req.body;

    if (!email || !pwd || !fullName) {
      return res.status(400).json({
        success: false,
        msg: "All fields are required"
      });
    }

    // Check if email already exists
    let existingUser = await userModel.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        msg: "Email already exists"
      });
    }

    // Generate password hash
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(pwd, salt);

    try {
      // Create new user without explicitly setting social auth fields
      // This avoids the duplicate key error
      let user = await userModel.create({
        email: email,
        password: hash,
        fullName: fullName
      });

      return res.status(200).json({
        success: true,
        msg: "User created successfully",
      });
    } catch (dbError) {
      console.error('Database error during signup:', dbError);
      
      // Check for duplicate key error
      if (dbError.code === 11000) {
        const field = Object.keys(dbError.keyPattern)[0];
        return res.status(400).json({
          success: false,
          msg: `Account creation failed: This ${field} is already associated with another account.`
        });
      }
      
      throw dbError;
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      msg: "Server error during signup. Please try again later."
    });
  }
};

const login = async (req, res) => {
  try {
    let { email, pwd } = req.body;

    if (!email || !pwd) {
      return res.status(400).json({
        success: false,
        msg: "Email and password are required"
      });
    }

    let user = await userModel.findOne({ email: email });
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    try {
      const isMatch = await bcrypt.compare(pwd, user.password);
      if (isMatch) {
        const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '24h' });
        return res.status(200).json({
          success: true,
          msg: "Login successful",
          token,
          fullName: user.fullName
        });
      } else {
        return res.status(401).json({
          success: false,
          msg: "Invalid password"
        });
      }
    } catch (err) {
      console.error('Password comparison error:', err);
      return res.status(500).json({
        success: false,
        msg: "Error verifying password"
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
};

const createProj = async (req, res) => {
  try {

    let { name, projLanguage, token, version } = req.body;
    let decoded = jwt.verify(token, secret);
    let user = await userModel.findOne({ _id: decoded.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    };

    let project = await projectModel.create({
      name: name,
      projLanguage: projLanguage,
      createdBy: user._id,
      code: getStartupCode(projLanguage),
      version: version
    });


    return res.status(200).json({
      success: true,
      msg: "Project created successfully",
      projectId: project._id
    });


  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: error.message
    })
  }
};

const saveProject = async (req, res) => {
  try {

    let { token, projectId, code } = req.body;
    console.log("DATA: ",token, projectId, code)
    let decoded = jwt.verify(token, secret);
    let user = await userModel.findOne({ _id: decoded.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    };

    let project = await projectModel.findOneAndUpdate({ _id: projectId }, {code: code});

    return res.status(200).json({
      success: true,
      msg: "Project saved successfully"
    });

  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      msg: error.message
    })
  }
};

const getProjects = async (req, res) => {
  try {

    let { token } = req.body;
    let decoded = jwt.verify(token, secret);
    let user = await userModel.findOne({ _id: decoded.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    let projects = await projectModel.find({ createdBy: user._id });

    return res.status(200).json({
      success: true,
      msg: "Projects fetched successfully",
      projects: projects
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: error.message
    })
  }
};

const getProject = async (req, res) => {
  try {

    let { token, projectId } = req.body;
    let decoded = jwt.verify(token, secret);
    let user = await userModel.findOne({ _id: decoded.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    let project = await projectModel.findOne({ _id: projectId });

    if (project) {
      return res.status(200).json({
        success: true,
        msg: "Project fetched successfully",
        project: project
      });
    }
    else {
      return res.status(404).json({
        success: false,
        msg: "Project not found"
      });
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: error.message
    })
  }
};

const deleteProject = async (req, res) => {
  try {

    let { token, projectId } = req.body;
    let decoded = jwt.verify(token, secret);
    let user = await userModel.findOne({ _id: decoded.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    let project = await projectModel.findOneAndDelete({ _id: projectId });

    return res.status(200).json({
      success: true,
      msg: "Project deleted successfully"
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: error.message
    })
  }
};

const editProject = async (req, res) => {
  try {

    let {token, projectId, name} = req.body;
    let decoded = jwt.verify(token, secret);
    let user = await userModel.findOne({ _id: decoded.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    };

    let project = await projectModel.findOne({ _id: projectId });
    if(project){
      project.name = name;
      await project.save();
      return res.status(200).json({
        success: true,
        msg: "Project edited successfully"
      })
    }
    else{
      return res.status(404).json({
        success: false,
        msg: "Project not found"
      })
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: error.message
    })
  }
};

// GitHub authentication handler
const githubAuth = passport.authenticate('github', { scope: [ 'user:email' ] });

// GitHub callback handler
const githubCallback = (req, res, next) => {
  passport.authenticate('github', async (err, profile) => {
    if (err) return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=github_auth_failed`);
    
    try {
      // Check if user exists by GitHub ID or email
      let user = await userModel.findOne({ 
        $or: [
          { githubId: profile.id },
          { email: profile.emails[0].value }
        ]
      });
      
      if (!user) {
        // Create new user if doesn't exist
        user = await userModel.create({
          email: profile.emails[0].value,
          fullName: profile.displayName || profile.username,
          password: Math.random().toString(36).slice(-8), // Generate random password
          githubId: profile.id
        });
      } else {
        // Update existing user's GitHub ID if not set
        if (!user.githubId) {
          user.githubId = profile.id;
          await user.save();
        }
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '24h' }
      );

      // Redirect to frontend with token and fullName
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?token=${token}&fullName=${encodeURIComponent(user.fullName)}`);
    } catch (error) {
      console.error('GitHub auth error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=github_auth_failed`);
    }
  })(req, res, next);
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found with this email address"
      });
    }

    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    user.resetPasswordCode = verificationCode;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    try {
      await sendResetCode(email, verificationCode);
      
      return res.status(200).json({
        success: true,
        msg: "Verification code sent to your email"
      });
    } catch (emailError) {
      // Rollback the saved verification code if email fails
      user.resetPasswordCode = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(emailError.statusCode || 500).json({
        success: false,
        msg: emailError.message || "Failed to send verification code. Please try again."
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      msg: "Server error. Please try again later."
    });
  }
};

const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await userModel.findOne({ 
      email,
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        msg: "Invalid or expired verification code"
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      success: true,
      resetToken
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: error.message
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, email, bypassToken } = req.body;
    
    let user;
    
    // Handle both token-based and email-based resets
    if (resetToken) {
      try {
        // Verify reset token
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'your_jwt_secret');
        user = await userModel.findOne({ _id: decoded.userId });
      } catch (tokenError) {
        console.error('Token verification error:', tokenError.message);
        return res.status(401).json({
          success: false,
          msg: "Invalid or expired token"
        });
      }
    } else if (email && bypassToken) {
      // Development bypass mode using email directly
      user = await userModel.findOne({ email });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          msg: "User not found with this email address"
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        msg: "Missing required parameters"
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password and clear reset code
    user.password = hashedPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      msg: "Password successfully reset"
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      success: false,
      msg: error.message
    });
  }
};

module.exports = {
  signUp,
  login,
  createProj,
  saveProject,
  getProjects,
  getProject,
  deleteProject,
  editProject,
  githubAuth,
  githubCallback,
  forgotPassword,
  verifyResetCode,
  resetPassword
};