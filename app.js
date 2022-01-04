const express = require('express');
const app = express();
const cors = require('cors');
const nodemailer=require('nodemailer')
const {google}=require('googleapis')
const bodyParser = require('body-parser')
var fileUpload=require('express-fileupload')
const port = process.env.PORT || 5000;
const path = require('path');
app.use(express.static('./dist/Student-enrollment-system'));
const bcrypt=require('bcrypt')
const jwt = require('jsonwebtoken')
const razorpay=require('razorpay')
const adminData = require('./src/model/adminData');
const courseData= require('./src/model/courseData');
const employeeData=require('./src/model/employeeData');
const studentData = require('./src/model/studentData');
const { oauth2 } = require('googleapis/build/src/apis/oauth2');

let instance=new razorpay({
    key_id:'rzp_test_ZGATXfSKdjDjl0',
    key_secret:'JlpCgDzCSpxdvfKUIofLPs6w'
})
app.use(cors());
app.use(express.json())
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());
app.use(fileUpload());
app.use(express.static('public')); 
app.use('/images', express.static('images'));

const CLIENT_ID='358879111934-lldho3noupbpkclh30g3iv06t8ri0m64.apps.googleusercontent.com'
const CLIENT_SECRET='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'
const REDIRECT_URI='https://developers.google.com/oauthplayground'
const REFRESH_TOKEN='1//04YjoTW1pK31aCgYIARAAGAQSNwF-L9IrCq-LYDWmQMbF3mWMAiYDsnMNw_NsclAfcLxX6i8ziIE9Z2m7AbdZxxdGYkrLItyZx2s'

const oAuth2Client=new google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET,REDIRECT_URI)
oAuth2Client.setCredentials({refresh_token:REFRESH_TOKEN})

async function sendEmail(data){
    console.log("course Name :"+data.courseName);
    try{
        const accessToken=await oAuth2Client.getAccessToken()
          let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            secure: true,
            auth: {
                type: 'OAuth2',
                user: 'creationzv@gmail.com',
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken:accessToken
            }
        });

          const mailOptions={
              from:'ICT Academy Kerala <creationzv@gmail.com>',
              to:data.studentMail,
              subject:'Course Enrolled Successfully',
              text:`You have been successfully enrolled to ${data.courseName} . Your ID is ${data.studentid}` 

          }

          const result =  await transporter.sendMail(mailOptions)
          return result

    }catch(error){
        return error
    }
}

let verify=false;

function verifyEmployeeToken(req, res) {
    if(!req.headers.employeeauthorization) {
        return res.status(401).send('Unauthorized request4')
      }
      let token = req.headers.employeeauthorization.split(' ')[1]
      if(token === null) {
        return res.status(401).send('Unauthorized request5')    
      }
      let payload = jwt.verify(token, 'employeeKey')
      console.log(payload);
      if(!payload) {
        return res.status(401).send('Unauthorized request6')    
      }
      req.userId = payload.subject
      verify==true
  }

  function verifyAdminToken(req, res,next) {
    if(!req.headers.adminauthorization) {
      return res.status(401).send('Unauthorized request4')
    }
    let token = req.headers.adminauthorization.split(' ')[1]
    if(token === null) {
      return res.status(401).send('Unauthorized request5')    
    }
    let payload = jwt.verify(token, 'adminKey')
    console.log(payload);
    if(!payload) {
      return res.status(401).send('Unauthorized request6')    
    }
    req.userId = payload.subject
    verify==true

    next()
  }


// image upload using express file uploads
    app.post('/api/uploadImage',(req,res,next) => {
        
        let image = req.files.image;
        let id = req.body.id;
        image.mv('public/images/'+id+'.jpg',(error,result)=>{
           res.send();
        })
    })

    app.post('/api/studentImage',(req,res,next) => {
        console.log(req.body)
        let image = req.files.image;
        let id = req.body.id;
        console.log(id)
        image.mv('public/images/'+id+'.jpg',(error,result)=>{
           res.send();
        })
    })


// get all courses
app.get('/api/courses',function(req,res){
    res.header("Acces-Control-Allow-Origin","*");
    res.header("Acces-Control-Allow-Methods: GET, POST, PATH, PUT, DELETE, HEAD");
    courseData.find()
                .then(function(courses){
                    res.send(courses);
                });
});   

// get single course using _id
app.get('/api/course/:id',function(req,res){  
    res.header("Acces-Control-Allow-Origin","*");
    res.header("Acces-Control-Allow-Methods: GET, POST, PATH, PUT, DELETE, HEAD"); 
    let id=req.params.id;
    courseData.findOne({_id:id},function(err,course){ 
        res.send(course)
    })
});

// add course
app.post('/api/add-course',verifyAdminToken,(req,res)=>{
    res.header("Acces-Control-Allow-Origin","*");
    res.header("Acces-Control-Allow-Methods: GET, POST, PATH, PUT, DELETE, HEAD"); 
    console.log(req.body);
    console.log(req.files);
    var item={
        name : req.body.course.name,
        certification : req.body.course.certification,
        details : req.body.course.details,
        price : req.body.course.price,
        eligibility : req.body.course.eligibility,
        code:req.body.course.code,
        count:0
    }
    let course = new courseData(item);
    course.save().then((data)=>{
        console.log(data)
        res.send(data);
    })
   
});

app.put('/api/update-course',verifyAdminToken,(req,res)=>{
    res.header("Acces-Control-Allow-Origin","*");
    res.header("Acces-Control-Allow-Methods: GET, POST, PATH, PUT, DELETE, HEAD"); 
    console.log(req.body)
    let id=req.body.course._id
    courseData.findByIdAndUpdate({"_id":id},
    {$set:
        {
            name : req.body.course.name,
            certification : req.body.course.certification,
            details : req.body.course.details,
            price : req.body.course.price,
            eligibility : req.body.course.eligibility,
            code:req.body.course.code
 }}) .then((data)=>{
    console.log(data); 
    res.send(data)
})
                                })

// delete course
app.delete('/api/remove-course/:id',verifyAdminToken,(req,res)=>{  
    id = req.params.id;
    courseData.findByIdAndDelete({"_id":id})
    .then(()=>{
        console.log('success')
        res.send();
    })
});

app.post('/api/register-student',async (req,res)=>{
    res.header("Acces-Control-Allow-Origin","*");
    res.header("Acces-Control-Allow-Methods: GET, POST, PATH, PUT, DELETE, HEAD"); 
    courseData.updateOne(
        { 
            _id:req.body.student.course  
        },
        {
            $inc: { count: 1 } 
        }).then((response)=>{
            console.log(response);
            courseData.findOne({_id:req.body.student.course}, async function(err,course){ 
                console.log(course.code);
                console.log(course.count);
                var item={
                    name:req.body.student.name,
                    email:req.body.student.email,
                    phone:req.body.student.phone,
                    address:req.body.student.address,
                    district:req.body.student.district,
                    state:req.body.student.state,
                    password:req.body.student.password,
                    qualification:req.body.student.qualification,
                    passout:req.body.student.passout,
                    skillset:req.body.student.skillset,
                    employmentStatus:req.body.student.employmentStatus,
                    technologyTraining:req.body.student.technologyTraining,
                    course:req.body.student.course,
                    courseName:course.name,
                    payment:"pending",
                    id:`${course.code}${course.count}`,
                    mark:""
                }
            
                item.password=await bcrypt.hash(item.password,10)
                var fees=req.body.fees
                console.log(fees);
                let student = new studentData(item);
                student.save((err,data)=>{
                    let orderid=data._id
                    console.log(orderid);
                    var options = {
                        amount: fees*100,  // amount in the smallest currency unit
                        currency: "INR",
                        receipt: ""+orderid
                      };
                      instance.orders.create(options, function(err, order) {
                        
                        if(err){
                            console.log(err);
                        }else{
                            console.log('order',order);
                            res.send(order)
                        }
                      });
            
            
                });
            })
        })
})
                

            

app.post("/api/verify-payment",(req,res)=>{

    let body=req.body.response.razorpay_order_id + "|" + req.body.response.razorpay_payment_id;
   
     var crypto = require("crypto");
     var expectedSignature = crypto.createHmac('sha256', 'JlpCgDzCSpxdvfKUIofLPs6w')
                                     .update(body.toString())
                                     .digest('hex');
                                     console.log("sig received " ,req.body.response.razorpay_signature);
                                     console.log("sig generated " ,expectedSignature);
     var response = {"signatureIsValid":"false"}
     if(expectedSignature === req.body.response.razorpay_signature)
      response={"signatureIsValid":"true"}
        console.log(req.body.id);
        let data={
            studentId:'',
            courseName:'',
            studentMail:''
        }
        studentData.findOne({_id:req.body.id},(err,student)=>{
            data.studentid=student.id
            data.studentMail=student.email
            courseData.findOne({_id:student.course},(err,course)=>{
                data.courseName=course.name
                console.log("courseName from db:"+data.courseName);
                sendEmail(data).then((res)=>{
                    console.log(res);
                     
                })
            })
        })
        studentData.updateOne(
            { 
                _id: req.body.id 
            },
            {
                $set: { 'payment': 'Success'} 
            }).then((data)=>{

                res.send(response);
            })
     });

// get all students
app.get('/api/students',verifySignin,function(req,res){
    res.header("Acces-Control-Allow-Origin","*");
    res.header("Acces-Control-Allow-Methods: GET, POST, PATH, PUT, DELETE, HEAD");
    studentData.find({payment:'Success'})
                .then(function(student){
                    res.send(student);
                });
});

app.post('/api/studentLogin',(req,res)=>{
    res.header("Acces-Control-Allow-Origin","*");
    res.header("Acces-Control-Allow-Methods: GET, POST, PATH, PUT, DELETE, HEAD");

    studentData.findOne({email:req.body.student.email,payment:'Success'},(err,student)=>{
        console.log(student);
        if(student){
            bcrypt.compare(req.body.student.password,student.password)
            .then((response)=>{
                if(response){
                    console.log("student");
                    let payload = {subject: req.body.student.email+req.body.student.password}
                    let token = jwt.sign(payload, 'studentKey')
                    res.status(200).send({token,role:'student',id:student._id})
                   
                }else{
                    res.status(401).send('Invalid Student Password')
                }
            })   
        }else{
            res.status(401).send('Invalid credential')
        }
    })


})

app.post('/api/adminLogin',async(req,res)=>{
    console.log("adminlogin");
    res.header("Acces-Control-Allow-Origin","*");
    res.header("Acces-Control-Allow-Methods: GET, POST, PATH, PUT, DELETE, HEAD");
    adminData.findOne({username:req.body.admin.email},(err,admin)=>{
        if(admin){
            bcrypt.compare(req.body.admin.password,admin.password)
            .then((response)=>{
                if(response){
                    console.log("admin");
                    let payload = {subject: req.body.admin.email+req.body.admin.password}
                    let token = jwt.sign(payload, 'adminKey')
                    res.status(200).send({token,role:'admin',id:admin._id})
                   
                }else{
                    res.status(401).send('Invalid Admin Password')
                }
            })   
        }else{
            res.status(401).send('Invalid credential')
        }
    })

})

app.post('/api/employeeLogin',(req,res)=>{
    res.header("Acces-Control-Allow-Origin","*");
    res.header("Acces-Control-Allow-Methods: GET, POST, PATH, PUT, DELETE, HEAD");
    employeeData.findOne({email:req.body.employee.email,status:"approved"},(err,employee)=>{
        if(employee){
            bcrypt.compare(req.body.employee.password,employee.password)
            .then((response)=>{
                if(response){
                    console.log("employee");
                    let payload = {subject: req.body.employee.email+req.body.employee.password}
                    let token = jwt.sign(payload, 'employeeKey')
                    res.status(200).send({token,role:'employee',id:employee._id})
                   
                }else{
                    console.log("Invalid Employee Password");
                    res.status(401).send('Invalid Employee Password')
                }
            })   
        }else{
            console.log("Invalid credential");
            res.status(401).send('Invalid credential')
        }
    })

})

app.post('/api/employeeRegister',async(req,res)=>{
    res.header("Acces-Control-Allow-Origin","*");
    res.header("Acces-Control-Allow-Methods: GET, POST, PATH, PUT, DELETE, HEAD");
    console.log(req.body);
    data={
        name:req.body.employee.name,
        email:req.body.employee.email,
        password:req.body.employee.password,
        role:req.body.employee.role,
        status:"pending"
    }
    data.password= await bcrypt.hash(data.password,10)
    let employee = new employeeData(data)
    employee.save()
    res.send()
})

app.get('/api/pending-employee',verifyAdminToken,(req,res)=>{
    res.header("Acces-Control-Allow-Origin","*");
    res.header("Acces-Control-Allow-Methods: GET, POST, PATH, PUT, DELETE, HEAD");
    employeeData.find({status:'pending'}).then((data)=>{
        res.send(data)
    })
})

app.post('/api/approve-employee',verifyAdminToken,(req,res)=>{
    res.header("Acces-Control-Allow-Origin","*");
    res.header("Acces-Control-Allow-Methods: GET, POST, PATH, PUT, DELETE, HEAD");
    employeeData.updateOne(
        { 
            _id: req.body.id 
        },
        {
            $set: { 'status': 'approved'} 
        }).then((data)=>{
            res.send();
        })
})

app.delete('/api/reject-employee/:id',verifyAdminToken,(req,res)=>{  
    id = req.params.id;
    employeeData.findByIdAndDelete({"_id":id})
    .then(()=>{
        console.log('success')
        res.send();
    })
});

// employee
app.get('/api/employees',verifyAdminToken,(req,res)=>{
    employeeData.find({status:"approved"})
    .then((data)=>{
        res.send(data)
    })
})

// search student
app.get('/api/search-student',verifySignin,(req,res)=>{
    res.header("Acces-Control-Allow-Origin","*");
    res.header("Acces-Control-Allow-Methods: GET, POST, PATH, PUT, DELETE, HEAD");
    studentData.find({payment:'Success'})
                .then(function(student){
                    res.send(student);
                });

})

// delete student
app.delete('/api/remove-student/:id',verifyAdminToken,(req,res)=>{  
    id = req.params.id;
    studentData.findByIdAndDelete({"_id":id})
    .then(()=>{
        console.log('success')
        res.send();
    })
});

// delete employee
app.delete('/api/remove-employee/:id',verifyAdminToken,(req,res)=>{  
    id = req.params.id;
    employeeData.findByIdAndDelete({"_id":id})
    .then(()=>{
        console.log('success')
        res.send();
    })
});

// get single student using _id
app.get('/api/student/:id',verifySignin,function(req,res){  
    res.header("Acces-Control-Allow-Origin","*");
    res.header("Acces-Control-Allow-Methods: GET, POST, PATH, PUT, DELETE, HEAD"); 
    let id=req.params.id;
    studentData.findOne({_id:id},function(err,student){ 
        res.send(student)
    })
});

// get single employee using _id
app.get('/api/employee/:id',verifyAdminToken,function(req,res){  
    res.header("Acces-Control-Allow-Origin","*");
    res.header("Acces-Control-Allow-Methods: GET, POST, PATH, PUT, DELETE, HEAD"); 
    let id=req.params.id;
    employeeData.findOne({_id:id},function(err,employee){ 
        res.send(employee)
    })
});

// update employee
app.put('/api/update-employee',verifyAdminToken,(req,res)=>{
    res.header("Acces-Control-Allow-Origin","*");
    res.header("Acces-Control-Allow-Methods: GET, POST, PATH, PUT, DELETE, HEAD"); 
    console.log(req.body)
    let id=req.body.employee._id
    employeeData.findByIdAndUpdate({"_id":id},
    {
        $set:{
            name:req.body.employee.name,
            email:req.body.employee.email,
            role:req.body.employee.role,
            }
    }) .then((data)=>{
    console.log(data); 
    res.send(data)
})
})

// update sstudent
app.put('/api/update-student',(req,res)=>{
    res.header("Acces-Control-Allow-Origin","*");
    res.header("Acces-Control-Allow-Methods: GET, POST, PATH, PUT, DELETE, HEAD"); 
    console.log(req.body)
    let id=req.body.student._id
    studentData.findByIdAndUpdate({"_id":id},
    {
        $set:{
            name:req.body.student.name,
            email:req.body.student.email,
            phone:req.body.student.phone,
            address:req.body.student.address,
            district:req.body.student.district,
            state:req.body.student.state,
            qualification:req.body.student.qualification,
            passout:req.body.student.passout,
            skillset:req.body.student.skillset,
            employmentStatus:req.body.student.employmentStatus,
            technologyTraining:req.body.student.technologyTraining,
            }
    }) .then((data)=>{
    console.log(data); 
    res.send(data)
})
})

// enter exit mark
app.put('/api/exit-mark',verifySignin,(req,res)=>{
    res.header("Acces-Control-Allow-Origin","*");
    res.header("Acces-Control-Allow-Methods: GET, POST, PATH, PUT, DELETE, HEAD"); 
    console.log(req.body.student.mark)
    let id=req.body.student._id
    studentData.findByIdAndUpdate({"_id":id},
    {
        $set:{
            mark:req.body.student.mark,
            courseName:req.body.student.courseName
            }
    }) .then((data)=>{
    console.log(data); 
    res.send(data)
})
.catch((data)=>{
    console.log(data);
})
})

function verifySignin(req,res,next){
    if(verify){
        console.log(verify);
        return res.status(401).send('Unauthorized request10')
    }else{
        next()
    }
}

app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname + '/dist/Student-enrollment-system/index.html'));
   });

app.listen(port,()=>{console.log("server Ready at"+port)});