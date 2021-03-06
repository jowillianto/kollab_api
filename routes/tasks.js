var express = require('express')
var Task = require('../models/task');
var router = express.Router();
var async = require('async')

//Display all tasks
router.get('/all', (req,res) => {
  Task.find((err,allTask) => {
    if (!err) res.json({allTask})
    else res.json({err: err.message})
  })

});

//Find Task by ID
router.get('/find/:id', (req,res) => {
  if (req.params.id) {
    Task.findById(req.params.id, (err,data) => {
      if (!err) res.json({data:data})
      else res.json({err: err.message})
    })
  } else {
    res.json({status: 'error',message: 'Enter Valid URL'})
  }
})

//Display Task by status
router.get('/filter', (req,res) => {
  //Display Done/Not Done Tasks
  if (req.query && req.query.done != null) {
    Task.find({done: req.query.done}, (err,tasks) => {
      if (!err) res.json({tasks})
      else res.json({status: 'error', message: err.message})
    })
  //Display 'Doing' Tasks
  } else if (req.query && req.query.doing) {
    Task.find({doing: req.query.doing}, (err,tasks) => {
      if (!err) res.json({tasks})
      else res.json({status: 'error', message: err.message})
    })
  } else {
    res.json({status: 'error', message: 'Enter Valid URL'})
  }
})

//Create a task
router.post('/create', (req,res) => {
  if (req.body && req.body.title) {
    
      var new_task = new Task({
        title: req.body.title, 
        description: req.body.description,
        deadline: req.body.deadline,
        status: req.body.status
      })

      new_task.save((err) => {
        if (!err) res.json({status: 'ok', message: 'Task Added'})
        else res.json({status: 'error', message: err.message})
      })

  } else {
    res.json({status: 'error', message: 'Enter a Valid Form'})
  }
  
})

//Delete a task
router.delete('/delete', async(req,res) => {
  if (req.query && req.query.taskId) {
    async.waterfall([ //Only Done task(s) could be deleted.
      //1. Find the Task
      function (callback) {
        Task.findById(req.query.taskId, (err,task) => {
          if(!err && task) callback(null, task)
          else callback('Task Not Found')
        })
      }, 

      //2. Check if the Task is Completed or not
      function (task, callback) {
        if (task.done) callback(null, task)
        else callback("Task isn't Done, Complete This Task Before Deleting")
      }

    ], function(err,data){
      if (!err){
        data.remove((err) => {
          if (err) res.json({status: 'error', message: err.message})
          else res.json({status: 'ok', message: 'Task Successfully Deleted'})
        })
      } else {
        res.json({status: 'error', message: err})
      }
    })
  } else {
    res.json({status: 'error',message: 'You forgot to enter the taskId'})
  } 
})

//Edit a task
router.put('/update', (req,res) => {
  if (req.body && req.body.id && (req.body.title || req.body.description || req.body.status || req.body.deadline || req.body.notes)){
    let newTask = {}

    if (req.body.title) newTask.title = req.body.title //Edit title
    if (req.body.description) newTask.description = req.body.description; //Edit description
    //Edit status. Doing and Done are also being editted automatically.
    if (req.body.status && req.body.status === 'done'){
      newTask.doing = false
      newTask.done = true
      newTask.status = req.body.status
    } else if (req.body.status && req.body.status === 'doing') {
      newTask.doing = true
      newTask.done = false
      newTask.status = req.body.status
    } else if (req.body.status && req.body.status === 'pending') {
      newTask.doing = false
      newTask.done = false
      newTask.status = req.body.status
    }
    if (req.body.deadline) newTask.deadline = req.body.deadline //Update deadline
    if (req.body.notes) newTask.notes = req.body.notes

    Task.findOneAndUpdate({_id:req.body.id}, newTask, (err) => {
      if (!err) res.status(200).json({message: 'Task Updated!'})
      else res.status(500).json({message: err.message})
    })

  } else {
    res.status(400).json({message: 'Enter a VALID form'})
  }
})


module.exports = router