import express from 'express';
import { query } from '../db/db.js'; 

const router = express.Router();
router.get('/temp',async(req,res)=>{
res.status(200).send({
  "message":"lol"
})
})


export default router;
