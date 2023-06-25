const mongoose=require('mongoose')
const applicationSchema=new mongoose.Schema({
    firstName:String,
    lastName:String,
    fatherName:String,
    motherName:String,
    cnic:String,
    email:String,
    age:String,
    gender:String,
    about:String,
    dateOfBirth:String,
    address:String,
    education:String,
    lastInstitution:String,
    yearsStudeid:String,
    reasonForLeaving:String,
    lastDegreeMarks:String,
    lastDegreePercentage:String,
    profilePicture:String
})
module.exports=mongoose.model('application',applicationSchema)