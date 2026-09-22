import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 5000
let dbReady = false
let memoryPatients = [
  {id: crypto.randomUUID(), name:'Alice Johnson', age:34, gender:'Female', symptoms:'Chest pain', severity:1, status:'waiting', admittedAt:new Date(Date.now()-22*60000).toISOString()},
  {id: crypto.randomUUID(), name:'Bob Smith', age:52, gender:'Male', symptoms:'Breathing difficulty', severity:2, status:'waiting', admittedAt:new Date(Date.now()-17*60000).toISOString()},
  {id: crypto.randomUUID(), name:'Charlie Brown', age:27, gender:'Male', symptoms:'Fever and weakness', severity:4, status:'waiting', admittedAt:new Date(Date.now()-10*60000).toISOString()},
]

const patientSchema = new mongoose.Schema({
  name:{type:String,required:true,trim:true},
  age:{type:Number,min:0,max:130},
  gender:{type:String,default:'Not specified'},
  symptoms:{type:String,default:''},
  severity:{type:Number,required:true,min:1,max:5},
  status:{type:String,enum:['waiting','discharged'],default:'waiting'},
  admittedAt:{type:Date,default:Date.now},
  dischargedAt:{type:Date}
})
const Patient = mongoose.model('Patient', patientSchema)

async function listPatients(status) {
  if (dbReady) {
    const q = status === 'all' ? {} : {status}
    return await Patient.find(q).sort({severity:1,admittedAt:1}).lean()
  }
  const arr = status === 'all' ? memoryPatients : memoryPatients.filter(p=>p.status===status)
  return arr.sort((a,b)=>a.severity-b.severity || new Date(a.admittedAt)-new Date(b.admittedAt))
}

app.get('/api/health',(req,res)=>res.json({ok:true,database:dbReady?'mongodb':'memory'}))

app.get('/api/patients', async (req,res)=>{
  try {
    const status = req.query.status || 'waiting'
    res.json({patients:await listPatients(status)})
  } catch(e){ res.status(500).json({message:'Unable to load patients'}) }
})

app.post('/api/patients', async (req,res)=>{
  try {
    const {name,age,gender,symptoms,severity} = req.body
    if (!name?.trim()) return res.status(400).json({message:'Patient name is required'})
    if (![1,2,3,4,5].includes(Number(severity))) return res.status(400).json({message:'Severity must be between 1 and 5'})
    const data = {name:name.trim(),age:age?Number(age):undefined,gender:gender||'Not specified',symptoms:symptoms||'',severity:Number(severity),status:'waiting',admittedAt:new Date()}
    const patient = dbReady ? await Patient.create(data) : {id:crypto.randomUUID(),...data,admittedAt:new Date().toISOString()}
    if (!dbReady) memoryPatients.push(patient)
    res.status(201).json({patient})
  } catch(e){ res.status(500).json({message:'Unable to admit patient'}) }
})

app.post('/api/patients/:id/discharge', async (req,res)=>{
  try {
    let patient
    if (dbReady) {
      patient = await Patient.findOneAndUpdate({_id:req.params.id,status:'waiting'},{$set:{status:'discharged',dischargedAt:new Date()}},{new:true}).lean()
    } else {
      patient = memoryPatients.find(p=>p.id===req.params.id && p.status==='waiting')
      if (patient) { patient.status='discharged'; patient.dischargedAt=new Date().toISOString() }
    }
    if (!patient) return res.status(404).json({message:'Patient not found or already discharged'})
    res.json({patient})
  } catch(e){ res.status(500).json({message:'Unable to discharge patient'}) }
})

app.delete('/api/patients/:id', async (req,res)=>{
  try {
    if (dbReady) await Patient.findByIdAndDelete(req.params.id)
    else memoryPatients = memoryPatients.filter(p=>p.id!==req.params.id)
    res.json({message:'Patient deleted'})
  } catch(e){ res.status(500).json({message:'Unable to delete patient'}) }
})

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/emergency_room', {serverSelectionTimeoutMS:2000})
  .then(()=>{dbReady=true; console.log('MongoDB connected')})
  .catch(()=>console.log('MongoDB unavailable; using in-memory data'))

app.listen(PORT,()=>console.log(`ER server running at http://localhost:${PORT}`))
