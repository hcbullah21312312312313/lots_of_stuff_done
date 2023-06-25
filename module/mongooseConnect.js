const mongoose=require('mongoose')
mongoose.connect('mongodb+srv://admin:p5W5Rvr28zzQAhWE@cluster0.bp2y7j1.mongodb.net/College', {useNewUrlParser: true, useUnifiedTopology: true}).then(()=>
console.log('Connected to the database'))

// mongoose.connect('mongodb://127.0.0.1:27017/College', {useNewUrlParser: true, useUnifiedTopology: true}).then(()=>

// console.log('Connected to the database'))
const StudentsSchema=new mongoose.Schema({
    fname:String,
    lname:String,
    fatherName:String,
    matherName:String,
    class:Number,
    email:String,
    rollno:Number,
    age:String,
    gender:String,
    about:String,
    designation:String,
    dob:String,
    address:String,
    
})
module.exports=mongoose.model('students',StudentsSchema)
