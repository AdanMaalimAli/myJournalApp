const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  googleLogin,
} = require('../controllers/authController');

const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Images only!');
  }
}

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.put('/updatedetails', protect, upload.single('image'), updateDetails);

module.exports = router;
