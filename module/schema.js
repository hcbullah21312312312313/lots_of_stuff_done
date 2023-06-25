const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const studentSchema = new mongoose.Schema({
  fname: String,
  lname: String,
  cnic: String,
  fatherName: String,
  mname: String,
  username: { type: String, unique: true }, // Make the username field unique
  password: String,
  dob: String,
  dues: Number,
  address: String,
  gender: String,
  age: String,
  lastinstitution: String,
  rollno: Number,
  class: Number,
  Sphone: String,
  guardianPhone: String,
  emergencyContactName: String,
  emergencyContactPhone: String,
  profilePicture: String,
});

// Add passport-local-mongoose plugin
studentSchema.plugin(passportLocalMongoose,{ usernameField: 'username' });

const Student = mongoose.model('Student', studentSchema);

const reviewsSchema = new mongoose.Schema({
    name: String,
    department: String,
    review: String
  })
const ReviewsModel = mongoose.model('reviews', reviewsSchema)

const reminderSchema = new mongoose.Schema({
    name: String,
    fatherName: String,
    username: String,
    studentId: String,
    class:Number,
    rollno: Number,
    message: String,
    issueDate: String,
    month:String,
    dueDate: String,
    tutionFee: Number,
    hostelFee: Number,
    transportFee: Number,
    duePayments: Number,
    tax:Number,
    totall:Number,
    paymentStatus: String,
    timestamp: { type: String, default: new Date().toLocaleString() },
  
  })
const RemindersModel = mongoose.model('reminders', reminderSchema)

const slipSchema=new mongoose.Schema({
  name:String,
  rollno:String,
  class:Number,
  tufee:Number,
  hfee:Number,
  trfee:Number,
  issueDate:String,
  dueDate:String
})
const slipModel=mongoose.model('Slip',slipSchema)

const notificationsSchema=new mongoose.Schema({
  class:String,
  timestamp: { type: Date, default: Date.now() },
  message:String,
})
const Notifications=mongoose.model('Notification',notificationsSchema)

const adminSignup=new mongoose.Schema({
  email: { type: String, unique: true },
    password: String,
    firstName:String,
    password:String,
    lastName:String,
    fatherName:String,
    cnic:String,
    phone: String,
    address: String,
    gender: String,
    dateOfBirth: String,
    age:String,
    role: String,
    profilePicture:String,
    about:String,
    employeeDate: { type: String, default: new Date().toLocaleString() },
})

const adminModel=mongoose.model('Admin',adminSignup)
module.exports = {
  Student,ReviewsModel,RemindersModel
,slipModel,Notifications,adminModel
};
