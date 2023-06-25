//jshint ESversion 6
require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const app = express()
const multer = require('multer')
const path = require('path');
const fs = require('fs')
const methodOverride = require('method-override')
const ApplicationModel = require('./module/applicationSchema.js')
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session')
const slipModel = require("./module/schema.js").slipModel;
const Notification = require("./module/schema.js").Notifications;
const adminModel = require("./module/schema.js").adminModel;
const bcrypt=require('bcrypt');
const salt=10;
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))
app.set('view engine', 'ejs')
app.use(methodOverride('_method'))
//if anywhere you needed date
function getDate() {
  var date = new Date();
  var day = date.getDate();
  var month = date.getMonth() + 1;
  var year = date.getFullYear();
  return day + "/" + month + "/" + year;
}
const date = getDate();
// Setting multer up 
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });
// All about setting multer up

//Passport
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 60 * 1000 } // The login timeout is set to 30 minutes.You can modify it by changing the figure "1" in the cookie maxAge query...
}))
app.use(passport.initialize());
app.use(passport.session());
const StudentsModel = require('./module/mongooseConnect.js');
const { send } = require('process');
let adminIsAuthorised=false;

//pssport setup intialization
app.get('/', (req, res) =>
  res.render('index'))

app.get('/applyOnline', function (req, res) {
  res.render('apply')
})
app.get("/adminLogin",async function(req,res){
  res.render('adminLogin')
})
app.post('/adminlogin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const auth = await adminModel.findOne({ email });
    if (!auth) {
      return res.redirect('/adminLogin?error=Invalid Email Address');
    }

    const passwordMatch = await bcrypt.compare(password, auth.password);
    if (!passwordMatch) {
      return res.redirect('/adminLogin?error=Invalid Password');
    }

    // Authentication successful
    req.session.adminIsAuthorised = true; // Store authentication status in session
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.redirect('/adminLogin?error=Internal Server Error');
  }
});

app.get('/adminSignup',async function(req,res){
  res.render("adminSignup")
})
app.post('/adminSignUp',upload.single('profilePicture'),async function(req,res){
  try{
  const newAdmin=new adminModel({
    email: req.body.email,
    password: await bcrypt.hash(req.body.password,salt),
    firstName:req.body.firstName,
    lastName:req.body.lastName,
    fatherName:req.body.fatherName,
    cnic:req.body.cnic,
    phone: req.body.phone,
    address: req.body.address,
    gender: req.body.gender,
    dateOfBirth: req.body.dateOfBirth,
    age:req.body.age,
    role: req.body.role,
    profilePicture:req.file.filename,
    about:req.body.about
  })
  newAdmin.save().then(()=>{
    res.send("Success the user has been added to the admin database")
  })
  console.log(newAdmin)
  console.log("The admin with above credentials has been added to the databse and we granted him access to the system")
}catch(err){
  console.log(err)
  res.status(500).json({message: err.message})
}
})
const Student = require('./module/schema.js').Student;

passport.use(new LocalStrategy(Student.authenticate()));
passport.serializeUser(Student.serializeUser());
passport.deserializeUser(Student.deserializeUser());
app.post('/database/add/new', async function (req, res) {
  //specificly passport setup
  const newStudent = new Student({
    fname: req.body.fname,
    lname: req.body.lname,
    cnic: req.body.cnic,
    fatherName: req.body.faname,
    mname: req.body.mname,
    username: req.body.email,
    password: req.body.password,
    dues: req.body.dues,
    dob: req.body.dob,
    address: req.body.address,
    gender: req.body.gender,
    age: req.body.age,
    lastinstitution: req.body.lastinstitution,
    rollno: req.body.rollno,
    class: req.body.class,
    Sphone: req.body.Sphone,
    guardianPhone: req.body.guardianPhone,
    emergencyContactName: req.body.emergencyContactName,
    emergencyContactPhone: req.body.emergencyContactPhone,
    about: req.body.about,

  });
  newStudent.save()
  Student.register(newStudent, req.body.password, (err, user) => {
    if (err) {
      console.log(err);
      res.render('add');

    } else {
      passport.authenticate('local')(req, res, () => {
        res.redirect('/login');
      });
    }
  });
  //specificly passport setup
})
app.post('/sendNotifications', async function (req, res) {
  if (req.body.class === "all") {
    try {
      for (let i = 1; i <= 12; i++) {
        const newNotification = new Notification({
          class: i,

          message: req.body.message
        })
        newNotification.save()
      }
      res.send("notification sent to all students")
    } catch (err) {
      console.log(err);
    }
  } else {
    const newNotification = new Notification({
      class: req.body.class,
      message: req.body.message
    })
    newNotification.save().then(() => {
      res.send("notification sent to class " + req.body.class + " students")
    })
  }
})
app.post('/sendreminder', async function (req, res) {
  try {
    const classi = req.body.class;
    console.log(classi);

    const allStudents = await Student.find({ class: classi });
    console.log(allStudents); // Check if students are retrieved

    if (allStudents.length === 0) {
      // Handle the case when no students are found
      return res.status(404).send('No students found for the given class');
    }

    for (const student of allStudents) {
      const newReminder = new RemindersModel({
        name: student.fname,
        fatherName: student.fatherName,
        username: student.username,
        studentId: student.id,
        class: req.body.class,
        rollno: student.rollno,
        message: req.body.message,
        issueDate: req.body.issueDate,
        dueDate: req.body.dueDate,
        paymentStatus: "unpaid",
        month: req.body.month,
        tutionFee: req.body.tutionFee,
        hostelFee: req.body.hostelFee,
        transportFee: req.body.transportFee,
        duePayments: student.dues,
        tax: req.body.tax,
        totall: req.body.totall,
      });

      await newReminder.save();
      console.log(student.username);
    }

    res.status(200).send('Reminders sent successfully');
  } catch (err) {
    console.log(err);
    res.status(500).send('An error occurred while making the post request for sending reminders');
  }
});

app.put("/sendreminder", async function (req, res) {

  const allReminders = await RemindersModel.find({ class: req.body.class });

  const sendReminder = {
    tfee: req.body.tfee,
    hfee: req.body.hfee,
    mfee: req.body.mfee,
    trfee: req.body.trfee,
    totalFee: req.body.totalfee
  };


  try {
    allReminders.forEach(reminder => {
      RemindersModel.findOneAndUpdate({ _id: reminder._id }, sendReminder).then(() => {
        console.log("Model updated successfully");
      });
    });

    res.send("All reminders updated successfully");
  } catch (error) {
    // Handle error
    res.status(500).send("An error occurred while updating reminders");
  }
})
app.get('/admin/transactions/:id/show/paymentSlip', async function (req, res) {
  const id = req.params.id;
  const reminder = await RemindersModel.find({ _id: id });
  console.log(reminder);
  res.render("paymentSlip", { data: reminder, cssPath: '/css/paymentSlip.css', mediaPath: '/img/' })
})
app.post('/applyOnline', upload.single('profilePicture'), async function (req, res) {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const fatherName = req.body.fatherName;
  const motherName = req.body.motherName;
  const cnic = req.body.cnic;
  const email = req.body.email;
  const address = req.body.address;
  const age = req.body.age;
  const gender = req.body.gender;
  const dateOfBirth = req.body.dateOfBirth;
  const lastInstitution = req.body.lastInstitution;
  const yearsStudeid = req.body.yearsStudeid;
  const reasonForLeaving = req.body.reasonForLeaving;
  const lastDegreeMarks = req.body.lastDegreeMarks;
  const lastDegreePercentage = req.body.lastDegreePercentage;
  const about = req.body.about;
  console.log(req.body.profilePicture)
  const newApplication = new ApplicationModel({
    firstName: firstName,
    lastName: lastName,
    fatherName: fatherName,
    motherName: motherName,
    cnic: cnic,
    email: email,
    age: age,
    gender: gender,
    about: about,
    dateOfBirth: dateOfBirth,
    address: address,
    lastInstitution: lastInstitution,
    yearsStudeid: yearsStudeid,
    reasonForLeaving: reasonForLeaving,
    lastDegreeMarks: lastDegreeMarks,
    lastDegreePercentage: lastDegreePercentage,
    profilePicture: req.file.filename

  });

  newApplication.save().then(() => (console.log('file uploaded')))
  res.send("Your Application has been filed succefully Yo'l be notified once your application get approved")
})
const ReviewsModel = require('./module/schema.js').ReviewsModel;


//Not yet programmed

app.get('/database/teacher/:teachersid', async function (req, res) {
  const teachersid = req.params.id;
  console.log(teachersid)
  res.render('/teacher-dashboard')
})

//Not yet programmed
//Not yet programmed
const RemindersModel = require('./module/schema.js').RemindersModel;
app.get('/pay/bills', async function (req, res) {
  res.render('bills')
})
//Not yet programmed

app.get('/login', function (req, res) {
  res.render('login')
})
app.get('/signUp', function (req, res) {
  res.render('signup')
})

app.get('/search/result', async function (req, res) {
  res.render('searchresult')
})
var searchResult = null;
app.post('/search/result', async function (req, res) {
  const rollno = req.body.rollno
  const StudentName = req.body.name
  searchResult = (await Student.find({
    rollno: rollno
  }))
  res.redirect('/results')
})
//Not yet programmed

app.get('/admin/database/:post', async function (req, res) {
  const post = req.params.post;
  console.log(post)
})
//Not yet programmed

app.get('/results', async function (req, res) {
  console.log(searchResult)
  res.render('results', { results: searchResult })
})

app.get('/admin', async function (req, res) {
  if(!req.session.adminIsAuthorised){
  res.redirect('/adminLogin')
}else{
  const applications = await ApplicationModel.find({})
  res.render('admin', { applications: applications })
}
})

app.get('/database', async function (req, res) {
  if(!req.session.adminIsAuthorised){
    res.redirect('/adminLogin')
  }else{
  const data = await Student.find({})
  res.render('database', { data: data })
}
})
app.get('/transactions', async function (req, res) {
  if(!req.session.adminIsAuthorised){
    res.redirect('/adminLogin')
  }else{
  res.render('transactions')}
})
app.get('/studentPortal', async function (req, res) {
  res.render('studentPortal')
})
app.get('/admin/application/appId/:id', async function (req, res) {
  if(!req.session.adminIsAuthorised){
    res.redirect('/adminLogin')
  }else{
  const id = req.params.id
  const application = await ApplicationModel.find({ _id: id })
  console.log(application)
  res.render('application', { uploads: "/uploads/", application: application, cssPath: '/css/paymentSlip.css', mediaPath: '/img/' })
}})
app.get('/admin/database/transactions', async function (req, res) {
  if(!req.session.adminIsAuthorised){
    res.redirect('/adminLogin')
  }else{
  res.render('transactions')}
})
app.get('/admin/transactions/appId/:id', async function (req, res) {
  const id = req.params.id
  const transactions = await transactions.find({ _id: id })
  res.render('transactions', { transactions: transactions })
})
app.get('/academics', function (req, res) {
  res.render('academics')
})
app.get('/students/reviews', async function (req, res) {
  const data = await ReviewsModel.find({})
  res.render('reviews', { reviews: data })
})
app.post('/database/postReviews', function (req, res) {
  const name = req.body.name
  const department = req.body.field
  const review = req.body.review
  const newReview = new ReviewsModel({
    name: name,
    department: department,
    review: review
  })
  newReview.save().then(() => {
    res.redirect('/students/reviews')
  })
})
app.get('/database/add', function (req, res) {
  if(!req.session.adminIsAuthorised){
    res.redirect('/adminLogin')
  }else{
  res.render('add')}
})
// app.get('/sendReminder', function (req, res) {
//   res.render('sendReminder')
// })
// app.post('/sendReminder', function (req, res) {
//   const sendReminder = new RemindersModel({
//     name: req.body.name,
//     rollno: req.body.rollno,
//     message: req.body.message,
//     date: req.body.date,
//     tfee: req.body.tfee,
//     hfee: req.body.hfee,
//     mfee: req.body.mfee,
//     trfee: req.body.trfee
//   })
//   sendReminder.save().then(() => {
//     res.send("Reminder send suuccefully!");
//   })
// })

app.get('/login', function (req, res) {
  res.render('login')
})
app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      // Forward the error message to the failure redirect URL
      return res.redirect('/login?error=' + encodeURIComponent(info.message));
    }
    // Authentication successful
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      // Redirect to the success redirect URL
      return res.redirect('/target');
    });
  })(req, res, next);
});

app.get('/logout', function (req, res) {
  req.logout((err) => {
    console.log(err);
  });
  res.redirect('/'); // Redirect to the homepage or any other desired page
});
app.get('/target', async function (req, res) {
  if (!req.isAuthenticated()) {
    res.redirect('/login');
    return;
  }
  const username = req.user.username;
  console.log(username);
  const data = await Student.find({ username: req.user.username });
  const date = new Date();
  const today = date.getDate() + '/' + date.getMonth() + '/' + date.getFullYear();
  var Varstudent = null;
  let nam = null
  let address = null;
  data.forEach(function (student) {
    Varstudent = student
    nam = student.fname
    address = student.address
  })
  console.log(data);
  const reminders = await RemindersModel.find({ username: req.user.username })
    .sort({ createdAt: -1 });
  const remindy = [];
  for (let i = reminders.length - 1; i >= 0; i--) {
    remindy.push(reminders[i]);
    // Process the notification

  }
  const student = await Student.find({ username: req.user.username },)
  console.log(student);
  let grade = null
  student.forEach(function (student) {
    grade = student.class
    cnic = student.cnic
  })
  const application = await ApplicationModel.find({ email: req.user.username })
  let profilePicture = null;
  application.forEach(function (application) {
    profilePicture = application.profilePicture
  })
  console.log(application);
  const notifications = await Notification.find({ class: grade });
  const notifyMe = [];
  for (let i = notifications.length - 1; i >= 0; i--) {
    notifyMe.push(notifications[i]);
    // Process the notification
    console.log(notifyMe);
  }

  console.log(notifyMe);
  res.render('dashboard', { nam: nam, data: Varstudent, today: today, notifyMe: notifyMe, reminders: remindy, address: address, grade: grade, profilePicture: profilePicture });
});
app.get('/target/student/:class/:username/selectedCourse', async function (req, res) {
  if (!req.isAuthenticated()) {

    res.redirect('/login')
  } else {
    const grade = req.params.class
    const username = req.params.username
    const notifications = await Notification.find({ class: req.user.class });
    const loadedNotifications = [];
    for (let i = notifications.length - 1; i >= 0; i--) {
      loadedNotifications.push(notifications[i]);
      // Process the notification
      console.log(loadedNotifications);
    }
    const reminders = await RemindersModel.find({ username: req.user.username })
      .sort({ createdAt: -1 });
    const remindy = [];
    for (let i = reminders.length - 1; i >= 0; i--) {
      remindy.push(reminders[i]);
      // Process the notification
    }
    let name = null;
    remindy.forEach(function (reminder) {
      name = reminder.name
      console.log(reminder);
    })
    res.render('selectedCourse', { notifyMe: loadedNotifications, reminders: remindy, nam: name, today: new Date().toLocaleDateString() })
  }
})
app.get('/database/student/:id/aboutMe/:email', async function (req, res) {
  if(!req.session.adminIsAuthorised){
    res.redirect('/adminLogin')
  }else{
  const id = req.params.id;
  const email = req.params.email
  try {

    const student = await Student.find({ cnic: req.params.id });
    console.log(student)
    const profilePicture = await ApplicationModel.find({ email: email })
    console.log(profilePicture);
    let dp = null;
    profilePicture.forEach(function (application) {
      dp = application.profilePicture
    })
    console.log(dp)
    res.render('aboutTheStudent', { student: student, cssPath: "/css/paymentSlip.css", mediaPath: "/img/", uploads: "/uploads/", profilePicture: dp });
  } catch (e) {
    console.log(e);
  }
}})
app.listen(process.env.PORT, () =>
  console.log(`The sever is up on port ${process.env.PORT}!`)
)



